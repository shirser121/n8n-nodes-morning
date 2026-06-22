# n8n-nodes-morning

[![npm version](https://img.shields.io/npm/v/n8n-nodes-morning.svg)](https://www.npmjs.com/package/n8n-nodes-morning)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

n8n community node for **Morning** (formerly Green Invoice / חשבונית ירוקה) — the Israeli accounting and invoicing API.

Full coverage of the API surfaces a real workflow needs: documents, clients, suppliers, items, expenses, accounting classifications, business profile, and the hosted-checkout payment flow with auto-issued tax invoice + receipt. Includes a trigger node that receives Morning's `notifyUrl` webhooks.

Built against the live sandbox API (verified 2026-05-31).

## What's included

### Credentials: `Morning (Green Invoice) API`
- API Key ID + Secret + Environment (sandbox / production)
- Auto-fetches JWT via `POST /account/token` (1-hour TTL, refreshed on demand via n8n's `expirable` token field)
- Credential test pings `GET /businesses/me`

### Node: `Morning` (action)

| Resource | Operations |
|---|---|
| **Document** | Create · Get · Search · Email · Preview · Close · Open · Get Download Links · Get Info |
| **Client** | Create · Get · Update · Search · Delete (tax ID validated client-side via mod-10) |
| **Supplier** | Create · Get · Update · Search · Delete (tax ID validated client-side via mod-10) |
| **Item (Catalog)** | Create · Get · Update · Search · Delete |
| **Expense** | Create · Get · Search · Close · Open · Delete · Search Drafts · Get Statuses |
| **Payment** | Create Payment Form · Search Links · Get Link · Search Saved Tokens · Charge Token |
| **Recurring Payment (הוראת קבע)** | Create · Get · Update · Delete · Search · Count · Get Jobs · Recharge · Unsuspend |
| **Retainer (ריטיינר)** | Create · Get · Update · Delete · Search · Count · Get Jobs · Process Job |
| **Accounting** | Get Classifications Map |
| **Business** | Get Me · Get Numbering · Get Footer · Get Business Types |

**56 operations across 10 resources.**

> **Recurring Payment** and **Retainer** wrap Morning's *recurring-income* features (הכנסות קבועות). A **Recurring Payment** (`/payments/recurrings`) auto-charges a saved credit-card token on a schedule; a **Retainer** (`/retainers`) auto-issues a recurring document/payment-request to a client. These two endpoint families are **not in Morning's official (Apiary) API reference** — paths, verbs and request bodies were taken verbatim from Morning's own web-app client.
>
> The **retainer** create/update body is nested (from the web app's `buildData()`): `{ startDate, endDate, interval, doc: { …document fields, type }, data: { paymentTerms, description } }`. The node builds this via dotted properties (`doc.*`, `data.*`). `paymentTerms` is a number (Immediate `-1`, or Net `10/15/30/45/60/75/90/120`); `data.description` is a token (`my` = month-year, `pmy` = previous-month-year) or free text; `interval` is `1m/2m/3m/6m/1y`.

### Trigger: `Morning Trigger`
- Receives the form-urlencoded webhook Morning POSTs to `notifyUrl` after a payment
- Optional `?token=` query-param verification (Morning does not sign webhooks, so this is the recommended guard)
- Output: parsed (camelCase normalized) or raw

### Built-in helpers (so you don't trip on Morning's gotchas)

- **Israeli mod-10 (Luhn-variant) checksum** validates `taxId` on client/supplier create *before* the request goes out. Rejects "123456789" with a clear error instead of waiting for Morning's Hebrew rejection. Test value `000000018` passes.
- **VAT math auto-compute** (Payment → Create Payment Form): toggle "Auto-Compute Amount from Income" and the node calculates `amount` from `income[]` × `vatRate` per the chosen `vatType`. No more `קיים חוסר התאמה בין סכום התקבולים לסכום התשלומים` errors.

## Install

### Community Nodes panel (easiest — self-hosted n8n)

1. In n8n: **Settings → Community Nodes → Install**.
2. Enter the package name `n8n-nodes-morning` and confirm.
3. The **Morning** and **Morning Trigger** nodes appear in the node panel.

> Requires self-hosted n8n with community packages enabled (`N8N_COMMUNITY_PACKAGES_ENABLED=true`, which is the default). n8n Cloud only lists *verified* community nodes in the panel.

### npm (Docker / manual)

```bash
cd ~/.n8n/custom        # mkdir -p ~/.n8n/custom first if it doesn't exist
npm install n8n-nodes-morning
# restart n8n
```

### From source (development)

```bash
git clone https://github.com/shirser121/n8n-nodes-morning.git
cd n8n-nodes-morning
npm install
npm run build
cd ~/.n8n/custom && npm install /absolute/path/to/n8n-nodes-morning
# restart n8n
```

The **Morning** node and **Morning Trigger** appear in the node panel.

## Getting started

1. **Generate API keys** at app.greeninvoice.co.il → המשתמש שלי → כלי מפתחים → API Keys (separate tabs for sandbox vs production).
2. **Create the credential** in n8n: paste id, secret, pick environment. Hit "Test" — it should green-check against `/businesses/me`.
3. **Discover your `pluginId`** — drop a `Morning` node, Resource: Document, Operation: Get Info, Type: 320. The response contains `paymentPlugins[0].id` — that's your `pluginId` for any payment-form call.
4. **Build the payment flow**:
   - `Morning` node → Resource: Payment → Op: Create Payment Form. Paste the `pluginId`. Set `notifyUrl` to the URL of your `Morning Trigger` node.
   - `Morning Trigger` node → set a verification token, append `?token=<value>` to the URL you paste into notifyUrl.
   - Customer redirected to `response.url` from Create Payment Form → pays → Morning issues a tax invoice + receipt → webhook fires → workflow continues.

## Gotchas built into the node (so you don't trip on them)

- **Field naming** is non-obvious. The node uses Morning's exact names: `income` (not `items`), `payment` singular (not `payments`), `emails` always array (not `email`), `lang` (not `language`), `remarks` (not `notes`).
- **VAT math** — `amount` must match `income[]` based on `vatType`. The Auto-Compute toggle on payment-form does this for you. Manual math also works — the VAT-type dropdown spells out which mode means what.
- **Documents are immutable** — there is no Update operation on Document, because Morning returns 405. To fix an issued doc, create a credit note (type 330) with `linkedDocumentIds`, then issue a new one.
- **Clients/suppliers with docs/expenses can't be deleted** — set `active: false` instead (via Update).
- **`taxId` must pass Israeli mod-10 checksum**. The node validates this client-side. Test value: `000000018`.
- **Expense `documentType`** — use the supplier's invoice kind (305/320/400), NOT 10 (quote). The dropdown only shows valid options.
- **Expense `number`** — must be ≥5 numeric digits. "INV-001" and "1001" are both rejected.
- **`accountingClassification`** — pass the UUID `id` from `/accounting/classifications/map`, not the `code` or `key`. Use Resource: Accounting → Get Classifications Map to discover.
- **Rate limit ~3 req/s** — n8n batches don't throttle by default. For high-volume workflows, add a Wait node.

## Webhook security

Morning **does not sign webhooks**. Anything that knows your `notifyUrl` can forge a "paid" callback. Two guards:

1. Use the trigger's "Verification Token (Query Param)" — append `?token=<long-random>` to the URL you give Morning. The node rejects anything without a match.
2. The trigger output's `documentId` is Morning's UUID. After receiving, use a `Morning` action node with Op: Get Document to fetch the canonical document — if the doc id is bogus, it 404s and you abort.

## Notes for production

- The session token is cached for ~50 minutes (TTL is 60). The `expirable: true` flag on the credential's session token field tells n8n to re-call `preAuthentication` when needed.
- The `notifyUrl` callback comes from AWS eu-west-1 (`34.255.212.236` observed) with `User-Agent: GreenInvoice/2.1`.
- Body is **`application/x-www-form-urlencoded`** — n8n parses it automatically into `req.body`.
- Be idempotent on `documentId` — Morning may retry on 5xx/timeout.
- Return 2xx fast (≤5s). Do heavy work async via a follow-on workflow.

## Project structure

```
n8n-nodes-morning/
├── credentials/
│   └── MorningApi.credentials.ts         JWT flow with auto-refresh
├── nodes/
│   ├── Morning/
│   │   ├── Morning.node.ts               Declarative node wiring 8 resources
│   │   ├── helpers.ts                    mod-10 checksum + VAT math + preSend hooks
│   │   ├── morning.svg                   Icon (sunrise / "Morning" branding)
│   │   └── descriptions/                 One file per resource
│   │       ├── DocumentDescription.ts
│   │       ├── ClientDescription.ts
│   │       ├── SupplierDescription.ts
│   │       ├── ItemDescription.ts
│   │       ├── ExpenseDescription.ts
│   │       ├── PaymentDescription.ts
│   │       ├── RecurringPaymentDescription.ts
│   │       ├── RetainerDescription.ts
│   │       ├── AccountingDescription.ts
│   │       └── index.ts
│   └── MorningTrigger/
│       ├── MorningTrigger.node.ts        Webhook receiver for notifyUrl
│       └── morning.svg
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
npm install        # dev deps: n8n-workflow, typescript, eslint
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # compile to dist/ + copy icons
```

`dist/` is git-ignored and produced at build/publish time. Cutting a GitHub Release
publishes the package to npm automatically (see `.github/workflows/publish.yml`).

For the n8n *verified* community-node badge, switch linting over to
`eslint-plugin-n8n-nodes-base` (see the note in `.eslintrc.js`) and clear its
findings before submitting to n8n.

## License

MIT — see [LICENSE](./LICENSE).

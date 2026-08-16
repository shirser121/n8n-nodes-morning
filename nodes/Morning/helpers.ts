import {
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	NodeOperationError,
} from 'n8n-workflow';

/**
 * Validate an Israeli tax ID (ת.ז or ח.פ) against the official mod-10 checksum.
 * Pad-left to 9 digits, multiply digits by (1,2,1,2,1,2,1,2,1), sum (subtract 9 from products > 9), sum % 10 === 0.
 */
export function isValidIsraeliTaxId(input: string | number | null | undefined): boolean {
	if (input === null || input === undefined) return false;
	const digits = String(input).trim().replace(/\D/g, '');
	if (digits.length === 0 || digits.length > 9) return false;
	const padded = digits.padStart(9, '0');

	let sum = 0;
	for (let i = 0; i < 9; i++) {
		const digit = parseInt(padded[i], 10);
		let product = digit * ((i % 2) + 1);
		if (product > 9) product -= 9;
		sum += product;
	}
	return sum % 10 === 0;
}

export type IncomeLine = {
	price?: number;
	quantity?: number;
};

/**
 * Compute the `amount` field of a Morning document/payment-form payload from `income[]`,
 * applying VAT according to vatType. Returns a number rounded to 2 decimal places.
 *
 * - vatType 0: price is BEFORE VAT → amount = sum(price*qty) * (1 + vatRate)
 * - vatType 1: price INCLUDES VAT  → amount = sum(price*qty)
 * - vatType 2: VAT exempt          → amount = sum(price*qty)
 *
 * vatRate defaults to 0.18 (18% — Israel as of 2026). Override via the node's vatRate field for past rates.
 */
export function computeAmount(
	income: IncomeLine[] | null | undefined,
	vatType: 0 | 1 | 2,
	vatRate: number = 0.18,
): number {
	if (!Array.isArray(income) || income.length === 0) return 0;
	const sumIncome = income.reduce((acc, line) => {
		const price = Number(line?.price ?? 0);
		const qty = Number(line?.quantity ?? 1);
		return acc + price * qty;
	}, 0);

	if (vatType === 0) {
		return Math.round(sumIncome * (1 + vatRate) * 100) / 100;
	}
	return Math.round(sumIncome * 100) / 100;
}

/** PreSend hook: validate taxId mod-10 before the request goes out. Attached to the `taxId` field's routing. */
export async function validateTaxIdPreSend(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = (requestOptions.body ?? {}) as Record<string, unknown>;
	const taxId = body.taxId;
	if (typeof taxId === 'string' && taxId.length > 0 && !isValidIsraeliTaxId(taxId)) {
		throw new NodeOperationError(
			this.getNode(),
			`Invalid Israeli tax ID "${taxId}". Must pass mod-10 checksum. Test value: "000000018".`,
		);
	}
	return requestOptions;
}

/** PreSend hook: compute `amount` from `income[]` when the user opted into auto-compute. Reads vatType and vatRate from node parameters. */
export async function autoComputeAmountPreSend(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const auto = this.getNodeParameter('autoComputeAmount', false) as boolean;
	if (!auto) return requestOptions;

	const income = this.getNodeParameter('income', []) as IncomeLine[];
	const vatType = this.getNodeParameter('vatType', 1) as 0 | 1 | 2;
	const vatRate = this.getNodeParameter('vatRate', 0.18) as number;

	const body = (requestOptions.body ?? {}) as Record<string, unknown>;
	body.amount = computeAmount(income, vatType, vatRate);
	requestOptions.body = body;
	return requestOptions;
}

/**
 * PreSend hook for the Recurring Payment resource: reshape the body to match Morning's
 * (undocumented) recurring-payment contract, which differs between create and update.
 *
 * Verified live against the sandbox + a real GET response:
 * - CREATE (POST /payments/recurrings): a FLAT body — document fields (description,
 *   documentType, documentVatType, descriptionRules, skipHolidays) sit at the TOP level.
 * - UPDATE (PUT /payments/recurrings/{id}): the stored (NESTED) shape — those document
 *   fields go under `data{}`, and the create-only / immutable fields (startDate, day,
 *   cycles, clientId, clientEmail, …) must NOT be sent.
 * - `endDate` uses the boolean `false` to mean "no end date" (not "" and not omitted).
 *
 * The node's fields all populate the flat shape; this hook nests them for update.
 */
export async function recurringBodyPreSend(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const operation = this.getNodeParameter('operation', '') as string;
	const body = { ...((requestOptions.body as Record<string, unknown>) ?? {}) };

	if (body.descriptionRules === undefined) body.descriptionRules = '';

	if (operation === 'update') {
		const docKeys = [
			'description',
			'descriptionRules',
			'documentType',
			'documentVatType',
			'skipHolidays',
		];
		const data = (body.data as Record<string, unknown>) ?? {};
		for (const k of docKeys) {
			if (body[k] !== undefined) {
				data[k] = body[k];
				delete body[k];
			}
		}
		body.data = data;
		// PUT is a replace of the stored document — drop create-only / immutable fields.
		// amount, currency, interval, startDate and day are locked at creation (Morning ignores
		// changes to them on update), so we don't send them.
		for (const k of [
			'amount',
			'currency',
			'interval',
			'startDate',
			'day',
			'cycles',
			'clientId',
			'clientEmail',
			'pluginId',
			'lang',
			'flow',
		]) {
			delete body[k];
		}
		// Update expresses "no end date" as boolean false.
		if (body.endDate === undefined || body.endDate === '' || body.endDate === null) {
			body.endDate = false;
		}
	} else if (operation === 'create') {
		if (body.flow === undefined) body.flow = 0;
		// Create expresses "no end date" by omitting endDate — false is rejected (400).
		if (body.endDate === undefined || body.endDate === '' || body.endDate === false || body.endDate === null) {
			delete body.endDate;
		}
	}

	requestOptions.body = body;
	return requestOptions;
}

/** "YYYY-MM-DD" for the last calendar day of 1-based `month` in `year` (handles leap years). */
function lastDayOfMonth(year: number, month: number): string {
	const daysInMonth = new Date(year, month, 0).getDate();
	return `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
}

/**
 * PreSend hook for Document → Create/Preview: default `dueDate` (the "לתשלום עד" line
 * printed on the document) to the LAST calendar day of the document's month, whenever the
 * user leaves the Due Date field blank — mirrors the common Israeli "עד סוף החודש" payment
 * term instead of silently omitting the field.
 *
 * Anchored on the explicit `Document Date` field when the user set one (read as a plain
 * "YYYY-MM-DD" prefix, like the rest of this node's date handling — no Date-object parsing,
 * so there's no timezone-shift risk); otherwise on today, since that's the date Morning
 * itself stamps on the document when `date` is omitted. Does nothing if the user already
 * typed an explicit Due Date.
 */
export async function dueDateDefaultPreSend(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const dueDate = this.getNodeParameter('dueDate', '') as string;
	if (dueDate) return requestOptions;

	const docDate = this.getNodeParameter('date', '') as string;
	let year: number;
	let month: number; // 1-based

	if (docDate) {
		const [y, m] = docDate.split('T')[0].split('-');
		year = parseInt(y, 10);
		month = parseInt(m, 10);
		if (!year || !month) return requestOptions; // malformed — leave dueDate unset rather than guess
	} else {
		const today = new Date();
		year = today.getFullYear();
		month = today.getMonth() + 1;
	}

	const body = (requestOptions.body ?? {}) as Record<string, unknown>;
	body.dueDate = lastDayOfMonth(year, month);
	requestOptions.body = body;
	return requestOptions;
}

/**
 * PreSend hook for Document → Create: build `paymentRequestData` from the node's online-payment
 * toggle fields, so a single POST /documents call can both issue the document AND attach an
 * online payment link to it — same as Morning's own web app.
 *
 * Verified against a live sandbox request captured from Morning's web UI: creating a 305 Tax
 * Invoice with "online payment" enabled sends, in the SAME body as the document fields:
 *   paymentRequestData: { plugins: [{ id: <pluginId>, type: 12200, group: <100|120|150|160> }, ...], maxPayments }
 * `type` was observed as the fixed constant 12200 for every plugin entry regardless of group.
 * The response then carries a `paymentRequestId`; once the customer pays via the link, Morning
 * auto-issues a linked receipt and closes this document.
 */
export async function paymentRequestDataPreSend(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const enabled = this.getNodeParameter('enableOnlinePayment', false) as boolean;
	if (!enabled) return requestOptions;

	const pluginId = this.getNodeParameter('paymentPluginId', '') as string;
	const groups = this.getNodeParameter('paymentMethods', []) as number[];
	const maxPayments = this.getNodeParameter('paymentMaxPayments', 1) as number;

	if (!pluginId) {
		throw new NodeOperationError(
			this.getNode(),
			'Plugin ID is required when Enable Online Payment is on. Discover it via Document → Get Info → paymentPlugins[0].id.',
		);
	}
	if (!Array.isArray(groups) || groups.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'Select at least one Payment Method when Enable Online Payment is on.',
		);
	}

	const body = (requestOptions.body ?? {}) as Record<string, unknown>;
	body.paymentRequestData = {
		plugins: groups.map((group) => ({ id: pluginId, type: 12200, group })),
		maxPayments,
	};
	requestOptions.body = body;
	return requestOptions;
}


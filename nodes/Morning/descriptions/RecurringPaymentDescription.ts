import { INodeProperties } from 'n8n-workflow';

/**
 * Recurring Payment (הוראת קבע) — `/payments/recurrings`.
 *
 * A recurring payment automatically charges a SAVED credit-card token on a fixed
 * schedule and auto-issues a document each cycle. It is the "direct debit" side of
 * Morning's "הכנסות קבועות" (recurring income); the sibling is the Retainer resource.
 *
 * NOTE: this endpoint family is NOT in Morning's official (Apiary) API reference. The
 * paths and the request body below were reverse-engineered from Morning's own web-app
 * API client. Treat as undocumented — verify against your account before production use.
 */
const documentTypeOptions = [
	{ name: 'Tax Invoice + Receipt (חשבונית מס/קבלה) — 320', value: 320 },
	{ name: 'Tax Invoice (חשבונית מס) — 305', value: 305 },
	{ name: 'Receipt (קבלה) — 400', value: 400 },
];

const intervalOptions = [
	{ name: 'Monthly (כל חודש) — 1m', value: '1m' },
	{ name: 'Every 2 Months (כל חודשיים) — 2m', value: '2m' },
	{ name: 'Quarterly (כל 3 חודשים) — 3m', value: '3m' },
	{ name: 'Semi-Annually (כל 6 חודשים) — 6m', value: '6m' },
	{ name: 'Yearly (כל שנה) — 1y', value: '1y' },
];

export const recurringOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['recurring'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a recurring payment',
				description: 'Set up a standing order that auto-charges a saved card token each cycle',
				routing: {
					request: {
						method: 'POST',
						url: '/payments/recurrings',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a recurring payment',
				routing: {
					request: {
						method: 'GET',
						url: '=/payments/recurrings/{{ $parameter["recurringId"] }}',
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a recurring payment',
				description: 'Full replace — pass all fields you want to keep',
				routing: {
					request: {
						method: 'PUT',
						url: '=/payments/recurrings/{{ $parameter["recurringId"] }}',
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a recurring payment',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/payments/recurrings/{{ $parameter["recurringId"] }}',
					},
				},
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search recurring payments',
				routing: {
					request: {
						method: 'POST',
						url: '/payments/recurrings/search',
					},
				},
			},
			{
				name: 'Count',
				value: 'count',
				action: 'Count recurring payments',
				routing: {
					request: {
						method: 'GET',
						url: '/payments/recurrings/count',
					},
				},
			},
			{
				name: 'Get Jobs',
				value: 'getJobs',
				action: 'Get the charge jobs of a recurring payment',
				description: 'List the individual charge runs (jobs) of a recurring payment',
				routing: {
					request: {
						method: 'GET',
						url: '=/payments/recurrings/{{ $parameter["recurringId"] }}/jobs',
					},
				},
			},
			{
				name: 'Recharge',
				value: 'recharge',
				action: 'Trigger a charge job for a recurring payment',
				description: 'Manually run a charge (job) for a recurring payment',
				routing: {
					request: {
						method: 'POST',
						url: '=/payments/recurrings/{{ $parameter["recurringId"] }}/jobs',
					},
				},
			},
			{
				name: 'Unsuspend',
				value: 'unsuspend',
				action: 'Unsuspend a recurring payment',
				description: 'Re-activate a recurring payment that was suspended (e.g. after a failed charge)',
				routing: {
					request: {
						method: 'PUT',
						url: '=/payments/recurrings/{{ $parameter["recurringId"] }}/unsuspend',
						body: {},
					},
				},
			},
		],
		default: 'create',
	},
];

export const recurringFields: INodeProperties[] = [
	// ─── Recurring ID (for Get / Update / Delete / Get Jobs / Recharge / Unsuspend) ──
	{
		displayName: 'Recurring Payment ID',
		name: 'recurringId',
		type: 'string',
		required: true,
		default: '',
		description: 'The UUID of the recurring payment to act on',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['get', 'update', 'delete', 'getJobs', 'recharge', 'unsuspend'],
			},
		},
	},

	// ─── Create / Update body ────────────────────────────────────────────────────
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		default: 0,
		required: true,
		description: 'Amount charged each cycle, in the currency below',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'amount' },
		},
	},
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'string',
		default: 'ILS',
		description: 'ISO 4217 currency code to charge in (e.g. "ILS", "USD", "EUR")',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'currency' },
		},
	},
	{
		displayName: 'Document Description',
		name: 'description',
		type: 'string',
		default: '',
		required: true,
		description: 'Description shown on the document issued each cycle (sent as data.description)',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'data.description' },
		},
	},
	{
		displayName: 'Document Type',
		name: 'documentType',
		type: 'options',
		options: documentTypeOptions,
		default: 320,
		description: 'Type of document auto-issued each cycle (sent as data.documentType)',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'data.documentType' },
		},
	},
	{
		displayName: 'VAT Type',
		name: 'documentVatType',
		type: 'options',
		options: [
			{ name: '0 — Price BEFORE VAT', value: 0 },
			{ name: '1 — VAT INCLUDED in price', value: 1 },
			{ name: '2 — VAT exempt', value: 2 },
		],
		default: 0,
		description: 'VAT mode for the issued document (sent as data.documentVatType)',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'data.documentVatType' },
		},
	},
	{
		displayName: 'Skip Holidays',
		name: 'skipHolidays',
		type: 'boolean',
		default: false,
		description: 'Whether to defer a charge that falls on a holiday (caps the charging day at 25). Sent as data.skipHolidays.',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'data.skipHolidays' },
		},
	},
	{
		displayName: 'Document Description Rules',
		name: 'descriptionRules',
		type: 'string',
		default: '',
		description:
			'Optional dynamic description template (e.g. month/period placeholders). Sent as data.descriptionRules.',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'data.descriptionRules',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'Charging Day of Month',
		name: 'day',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 28 },
		description: 'Day of the month the card is charged (1-28; capped at 25 when Skip Holidays is on)',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'day' },
		},
	},
	{
		displayName: 'Interval',
		name: 'interval',
		type: 'options',
		options: intervalOptions,
		default: '1m',
		description: 'How often to charge',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'interval' },
		},
	},
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		default: '',
		required: true,
		description: 'First charge date (YYYY-MM-DD)',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'startDate',
				value: '={{ $value ? $value.split("T")[0] : undefined }}',
			},
		},
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		default: '',
		description: 'Last charge date (YYYY-MM-DD). Leave empty for no limit (use Cycles instead).',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'endDate',
				value: '={{ $value ? $value.split("T")[0] : undefined }}',
			},
		},
	},
	{
		displayName: 'Cycles',
		name: 'cycles',
		type: 'number',
		default: 0,
		description: 'Number of charges before the order ends. 0/empty = open-ended (or bounded by End Date).',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'cycles',
				value: '={{ $value > 0 ? $value : undefined }}',
			},
		},
	},
	{
		displayName: 'Token ID',
		name: 'tokenId',
		type: 'string',
		default: '',
		required: true,
		description:
			'UUID of the saved credit-card token to charge. Discover via Payment → Search Saved Tokens.',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'tokenId' },
		},
	},
	{
		displayName: 'Client Email',
		name: 'clientEmail',
		type: 'string',
		default: '',
		description: 'Email of the client the recurring payment belongs to',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'clientEmail',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'Client ID',
		name: 'clientId',
		type: 'string',
		default: '',
		description: 'Optional UUID of the client the recurring payment belongs to',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'clientId',
				value: '={{ $value || undefined }}',
			},
		},
	},

	// ─── Recharge body (optional) ─────────────────────────────────────────────────
	{
		displayName: 'Job Payload (JSON)',
		name: 'jobPayload',
		type: 'json',
		default: '{}',
		description: 'Optional body for the manual charge job (leave as {} for the default behavior)',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['recharge'],
			},
		},
		routing: {
			send: { type: 'body', value: '={{ $value || {} }}' },
		},
	},

	// ─── Search fields ────────────────────────────────────────────────────────────
	{
		displayName: 'Search Term',
		name: 'searchTerm',
		type: 'string',
		default: '',
		description: 'Free-text search across recurring payments (client/description)',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['search'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'multiFieldsText',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		description: 'Page number of search results to return (1-based)',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['search'],
			},
		},
		routing: {
			send: { type: 'body', property: 'page' },
		},
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 100 },
		description: 'Number of results per page (1-100)',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['search'],
			},
		},
		routing: {
			send: { type: 'body', property: 'pageSize' },
		},
	},
];

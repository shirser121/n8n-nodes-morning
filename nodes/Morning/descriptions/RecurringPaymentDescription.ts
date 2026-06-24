import { INodeProperties } from 'n8n-workflow';
import { recurringBodyPreSend } from '../helpers';

/**
 * Recurring Payment (הוראת קבע) — `/payments/recurrings`.
 *
 * A recurring payment automatically charges a SAVED credit-card token on a fixed
 * schedule and auto-issues a document each cycle. It is the "direct debit" side of
 * Morning's "הכנסות קבועות" (recurring income); the sibling is the Retainer resource.
 *
 * NOTE: this endpoint family is NOT in Morning's official (Apiary) API reference. The paths,
 * request body and enums below were taken from Morning's own web-app client and confirmed
 * against a live GET /payments/recurrings/{id} response: interval is "1"|"2"|"3"|"12"
 * (months, NOT "1m"); status is numeric (5 pending, 10 created, 20 started, 30 finished,
 * 50 canceled, 60 suspended, 70 expired). Create uses a FLAT body (document fields at the
 * top level); Update uses the stored NESTED shape (those fields under data{}) without
 * startDate/day. The recurringBodyPreSend hook reshapes the body per operation.
 */
const documentTypeOptions = [
	{ name: 'Tax Invoice + Receipt (חשבונית מס/קבלה) — 320', value: 320 },
	{ name: 'Tax Invoice (חשבונית מס) — 305', value: 305 },
	{ name: 'Receipt (קבלה) — 400', value: 400 },
];

const intervalOptions = [
	{ name: 'Monthly (כל חודש) — 1', value: '1' },
	{ name: 'Every 2 Months (כל חודשיים) — 2', value: '2' },
	{ name: 'Quarterly (כל 3 חודשים) — 3', value: '3' },
	{ name: 'Yearly (כל שנה) — 12', value: '12' },
];

const statusOptions = [
	{ name: 'Pending (5)', value: 5 },
	{ name: 'Created (10)', value: 10 },
	{ name: 'Started (20)', value: 20 },
	{ name: 'Finished (30)', value: 30 },
	{ name: 'Canceled (50)', value: 50 },
	{ name: 'Suspended (60)', value: 60 },
	{ name: 'Expired (70)', value: 70 },
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
					send: {
						preSend: [recurringBodyPreSend],
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
				description: 'Update mutable fields. startDate/day are set at creation and are not sent.',
				routing: {
					request: {
						method: 'PUT',
						url: '=/payments/recurrings/{{ $parameter["recurringId"] }}',
					},
					send: {
						preSend: [recurringBodyPreSend],
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
			{
				name: 'Approve',
				value: 'approve',
				action: 'Approve a pending recurring payment',
				description:
					'Approve a pending recurring payment so it becomes active (status 5 → 10). A new recurring is created pending; clients normally approve via a hosted link, but this approves it directly.',
				routing: {
					request: {
						method: 'POST',
						url: '=/payments/recurrings/{{ $parameter["recurringId"] }}/approve',
						body: {},
					},
				},
			},
			{
				name: 'Distribute',
				value: 'distribute',
				action: 'Distribute a recurring payment',
				description: 'Run the distribute action for a recurring payment',
				routing: {
					request: {
						method: 'POST',
						url: '=/payments/recurrings/{{ $parameter["recurringId"] }}/distribute',
					},
				},
			},
			{
				name: 'Search Failed Jobs',
				value: 'searchFailedJobs',
				action: 'Search all failed charge jobs',
				description: 'List failed charge jobs across all recurring payments',
				routing: {
					request: {
						method: 'POST',
						url: '/payments/recurrings/jobs/failed',
						body: {},
					},
				},
			},
			{
				name: 'Export',
				value: 'export',
				action: 'Export recurring payments as CSV',
				description: 'Download recurring payments as CSV (returns CSV text)',
				routing: {
					request: {
						method: 'GET',
						url: '/payments/recurrings/export',
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
				operation: ['get', 'update', 'delete', 'getJobs', 'recharge', 'unsuspend', 'distribute', 'approve'],
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
		description:
			'Amount charged each cycle. Set at creation and CANNOT be changed afterwards (Morning locks it — create a new recurring to change the amount).',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create'],
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
		description: 'ISO 4217 currency code to charge in (e.g. "ILS", "USD", "EUR"). Set at creation; not changeable later.',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create'],
			},
		},
		routing: {
			send: { type: 'body', property: 'currency' },
		},
	},
	{
		displayName: 'Language',
		name: 'lang',
		type: 'options',
		options: [
			{ name: 'Hebrew', value: 'he' },
			{ name: 'English', value: 'en' },
		],
		default: 'he',
		required: true,
		description: 'Language of the issued document (required by Create)',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create'],
			},
		},
		routing: {
			send: { type: 'body', property: 'lang' },
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
			send: { type: 'body', property: 'description' },
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
			send: { type: 'body', property: 'documentType' },
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
			send: { type: 'body', property: 'documentVatType' },
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
			send: { type: 'body', property: 'skipHolidays' },
		},
	},
	{
		displayName: 'Document Description Rules',
		name: 'descriptionRules',
		type: 'string',
		default: '',
		description:
			'Optional dynamic description template (e.g. "my" = month-year). On Create sent at top level; on Update nested under data.',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'descriptionRules' },
		},
	},
	{
		displayName: 'Charging Day of Month',
		name: 'day',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 28 },
		description: 'Day of the month the card is charged (1-28; capped at 25 when Skip Holidays is on). Create only.',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create'],
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
		default: '1',
		description: 'How often to charge. Set at creation; not changeable later (Morning locks it).',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create'],
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
		description: 'First charge date (YYYY-MM-DD). Required on Create; ignored on Update (set at creation).',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['create'],
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

	// ─── Recharge / Distribute body ───────────────────────────────────────────────
	{
		displayName: 'Charge Date',
		name: 'chargeDate',
		type: 'dateTime',
		default: '',
		required: true,
		description: 'Date to run the manual charge job for (YYYY-MM-DD); sent as {date}',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['recharge'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'date',
				value: '={{ $value ? $value.split("T")[0] : undefined }}',
			},
		},
	},
	{
		displayName: 'Distribute Body (JSON)',
		name: 'distributeBody',
		type: 'json',
		default: '{}',
		description: 'Body for the distribute action. Pass {} for the default behavior.',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['distribute'],
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
		description:
			'Free-text search. Matches the client NAME and the document description — NOT the client UUID. To filter by client UUID use Client ID below.',
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
		displayName: 'Client ID',
		name: 'searchClientId',
		type: 'string',
		default: '',
		description:
			'Filter to the recurring payments of a single client by their UUID (sent server-side as clientId). Discover via Client → Search. Free text does not match the UUID, so use this to scope by client.',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['search'],
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
	{
		displayName: 'Status',
		name: 'status',
		type: 'multiOptions',
		options: statusOptions,
		default: [],
		description: 'Filter by status; leave empty for all (sent as an array of numeric codes)',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['search'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'status',
				value: '={{ $value && $value.length > 0 ? $value : undefined }}',
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

	// ─── Export fields (query params) ─────────────────────────────────────────────
	{
		displayName: 'Search Term',
		name: 'exportSearchTerm',
		type: 'string',
		default: '',
		description: 'Optional free-text filter for the export (sent as query multiFieldsText)',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['export'],
			},
		},
		routing: {
			send: {
				type: 'query',
				property: 'multiFieldsText',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'Business ID',
		name: 'exportBusinessId',
		type: 'string',
		default: '',
		description:
			'Business UUID to scope the export to (the web app appends this). Discover via Business → Get Me. Leave empty to let the token decide.',
		displayOptions: {
			show: {
				resource: ['recurring'],
				operation: ['export'],
			},
		},
		routing: {
			send: {
				type: 'query',
				property: 'businessId',
				value: '={{ $value || undefined }}',
			},
		},
	},
];

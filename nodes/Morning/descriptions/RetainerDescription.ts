import { INodeProperties } from 'n8n-workflow';

/**
 * Retainer (ריטיינר) — `/retainers`.
 *
 * A retainer is a recurring, fixed-amount payment request that Morning sends to a client
 * automatically each cycle, issuing a document each time. It is the "recurring document"
 * side of Morning's "הכנסות קבועות" (recurring income); the sibling is the Recurring
 * Payment resource (which auto-charges a saved card instead).
 *
 * NOTE: this endpoint family is NOT in Morning's official (Apiary) API reference. The
 * paths and the request body below were reverse-engineered from Morning's own web-app
 * API client, whose retainer form reuses the document-create payload plus the recurrence
 * fields below. Treat as undocumented — verify against your account before production use.
 */
const documentTypeOptions = [
	{ name: 'Tax Invoice + Receipt (חשבונית מס/קבלה) — 320', value: 320 },
	{ name: 'Tax Invoice (חשבונית מס) — 305', value: 305 },
	{ name: 'Proforma Invoice (חשבון עסקה) — 300', value: 300 },
	{ name: 'Receipt (קבלה) — 400', value: 400 },
];

const intervalOptions = [
	{ name: 'Monthly (כל חודש) — 1m', value: '1m' },
	{ name: 'Every 2 Months (כל חודשיים) — 2m', value: '2m' },
	{ name: 'Quarterly (כל 3 חודשים) — 3m', value: '3m' },
	{ name: 'Semi-Annually (כל 6 חודשים) — 6m', value: '6m' },
	{ name: 'Yearly (כל שנה) — 1y', value: '1y' },
];

export const retainerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['retainer'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a retainer',
				description: 'Set up a recurring document/payment request sent to a client each cycle',
				routing: {
					request: {
						method: 'POST',
						url: '/retainers',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a retainer',
				routing: {
					request: {
						method: 'GET',
						url: '=/retainers/{{ $parameter["retainerId"] }}',
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a retainer',
				description: 'Full replace — pass all fields you want to keep',
				routing: {
					request: {
						method: 'PUT',
						url: '=/retainers/{{ $parameter["retainerId"] }}',
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a retainer',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/retainers/{{ $parameter["retainerId"] }}',
					},
				},
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search retainers',
				routing: {
					request: {
						method: 'POST',
						url: '/retainers/search',
					},
				},
			},
			{
				name: 'Count',
				value: 'count',
				action: 'Count retainers',
				routing: {
					request: {
						method: 'GET',
						url: '/retainers/count',
					},
				},
			},
			{
				name: 'Get Jobs',
				value: 'getJobs',
				action: 'Get the issued jobs of a retainer',
				description: 'List the individual runs (jobs) of a retainer',
				routing: {
					request: {
						method: 'GET',
						url: '=/retainers/{{ $parameter["retainerId"] }}/jobs',
					},
				},
			},
			{
				name: 'Process Job',
				value: 'processJob',
				action: 'Process a retainer job for a date',
				description: 'Manually run a retainer job for a specific date',
				routing: {
					request: {
						method: 'POST',
						url: '=/retainers/{{ $parameter["retainerId"] }}/jobs',
					},
				},
			},
		],
		default: 'create',
	},
];

export const retainerFields: INodeProperties[] = [
	// ─── Retainer ID (for Get / Update / Delete) ─────────────────────────────────
	{
		displayName: 'Retainer ID',
		name: 'retainerId',
		type: 'string',
		required: true,
		default: '',
		description: 'The UUID of the retainer to act on',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['get', 'update', 'delete', 'getJobs', 'processJob'],
			},
		},
	},
	{
		displayName: 'Jobs Page',
		name: 'jobsPage',
		type: 'number',
		default: 1,
		description: 'Page number of jobs to return (1-based)',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['getJobs'],
			},
		},
		routing: {
			send: { type: 'query', property: 'page' },
		},
	},
	{
		displayName: 'Job Date',
		name: 'jobDate',
		type: 'dateTime',
		default: '',
		required: true,
		description: 'The date to run the retainer job for (YYYY-MM-DD); sent as {date}',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['processJob'],
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

	// ─── Create / Update body ────────────────────────────────────────────────────
	{
		displayName: 'Document Type',
		name: 'documentType',
		type: 'options',
		options: documentTypeOptions,
		default: 320,
		required: true,
		description: 'Type of document issued each cycle',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'documentType' },
		},
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		required: true,
		description: 'Title/description shown on the document issued each cycle',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'description' },
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
		description: 'Language the document is rendered in',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'lang' },
		},
	},
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'string',
		default: 'ILS',
		description: 'ISO 4217 currency code for the document totals (e.g. "ILS", "USD", "EUR")',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'currency' },
		},
	},
	{
		displayName: 'VAT Type',
		name: 'vatType',
		type: 'options',
		options: [
			{ name: '0 — Price BEFORE VAT', value: 0 },
			{ name: '1 — VAT INCLUDED in price', value: 1 },
			{ name: '2 — VAT exempt', value: 2 },
		],
		default: 1,
		description: 'How line prices relate to VAT: 0 = before VAT, 1 = VAT included, 2 = exempt',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'vatType' },
		},
	},
	{
		displayName: 'Client (JSON)',
		name: 'client',
		type: 'json',
		default: '{\n  "id": ""\n}',
		description:
			'Client object. Pass {"id":"<existing-uuid>"} or full {"add":true,"name":...,"emails":[...]} to auto-create.',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'client' },
		},
	},
	{
		displayName: 'Income Lines (JSON Array)',
		name: 'income',
		type: 'json',
		default:
			'[\n  {\n    "description": "",\n    "quantity": 1,\n    "price": 0,\n    "currency": "ILS",\n    "vatType": 1\n  }\n]',
		description:
			'Line items array. Field is "income" (not "items"). Price must match the VAT type chosen above.',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'income' },
		},
	},
	{
		displayName: 'Interval',
		name: 'interval',
		type: 'options',
		options: intervalOptions,
		default: '1m',
		description: 'How often the retainer issues/sends the document',
		displayOptions: {
			show: {
				resource: ['retainer'],
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
		description: 'First issue date (YYYY-MM-DD)',
		displayOptions: {
			show: {
				resource: ['retainer'],
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
		description: 'Last issue date (YYYY-MM-DD). Leave empty for no limit.',
		displayOptions: {
			show: {
				resource: ['retainer'],
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
		displayName: 'Charging Day of Month',
		name: 'day',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 28 },
		description: 'Day of the month the document is issued/sent (1-28)',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'day',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'Remarks',
		name: 'remarks',
		type: 'string',
		default: '',
		description: 'Free-text notes on the document (field is "remarks", not "notes")',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'remarks',
				value: '={{ $value || undefined }}',
			},
		},
	},

	// ─── Search fields ────────────────────────────────────────────────────────────
	{
		displayName: 'Search Term',
		name: 'searchTerm',
		type: 'string',
		default: '',
		description: 'Free-text search across retainers (client/name)',
		displayOptions: {
			show: {
				resource: ['retainer'],
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
				resource: ['retainer'],
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
				resource: ['retainer'],
				operation: ['search'],
			},
		},
		routing: {
			send: { type: 'body', property: 'pageSize' },
		},
	},
];

import { INodeProperties } from 'n8n-workflow';

/**
 * Retainer (ריטיינר) — `/retainers`.
 *
 * A retainer is a recurring, fixed-amount payment request that Morning issues to a client
 * automatically each cycle. It is the "recurring document" side of Morning's recurring
 * income (הכנסות קבועות); the sibling is the Recurring Payment resource.
 *
 * NOTE: this endpoint family is NOT in Morning's official (Apiary) API reference. The paths
 * and the request body below were taken from Morning's own web-app — the Retainer service
 * (`/v1/retainers` CRUD + count + jobs) and the retainer form's `buildData()`, which posts:
 *
 *   { startDate, endDate, interval,
 *     doc:  { ...document fields, type },   // a full document payload + its type
 *     data: { paymentTerms, description } }  // paymentTerms is a number; description is a token/text
 *
 * Modeled below with dotted body properties (doc.*, data.*).
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

const paymentTermsOptions = [
	{ name: 'Immediate (מיידי) — -1', value: -1 },
	{ name: 'Net 10', value: 10 },
	{ name: 'Net 15', value: 15 },
	{ name: 'Net 30', value: 30 },
	{ name: 'Net 45', value: 45 },
	{ name: 'Net 60', value: 60 },
	{ name: 'Net 75', value: 75 },
	{ name: 'Net 90', value: 90 },
	{ name: 'Net 120', value: 120 },
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
				description: 'Set up a recurring document/payment request issued to a client each cycle',
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
	// ─── Retainer ID (for Get / Update / Delete / Get Jobs / Process Job) ─────────
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

	// ─── Create / Update body: schedule (top-level) ──────────────────────────────
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
		description: 'Last issue date (YYYY-MM-DD). Leave empty for no limit (sent as "").',
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
				value: '={{ $value ? $value.split("T")[0] : "" }}',
			},
		},
	},
	{
		displayName: 'Interval',
		name: 'interval',
		type: 'options',
		options: intervalOptions,
		default: '1m',
		description: 'How often the retainer issues the document',
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

	// ─── Create / Update body: the document (doc.*) ──────────────────────────────
	{
		displayName: 'Document Type',
		name: 'documentType',
		type: 'options',
		options: documentTypeOptions,
		default: 320,
		required: true,
		description: 'Type of document issued each cycle (sent as doc.type)',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'doc.type' },
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
		description: 'Language the document is rendered in (sent as doc.lang)',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'doc.lang' },
		},
	},
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'string',
		default: 'ILS',
		description: 'ISO 4217 currency code for the document totals (sent as doc.currency)',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'doc.currency' },
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
		description: 'How line prices relate to VAT (sent as doc.vatType)',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'doc.vatType' },
		},
	},
	{
		displayName: 'Client (JSON)',
		name: 'client',
		type: 'json',
		default: '{\n  "id": ""\n}',
		description:
			'Client object (sent as doc.client). Pass {"id":"<uuid>"} or {"add":true,"name":...,"emails":[...]}.',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'doc.client' },
		},
	},
	{
		displayName: 'Income Lines (JSON Array)',
		name: 'income',
		type: 'json',
		default:
			'[\n  {\n    "description": "",\n    "quantity": 1,\n    "price": 0,\n    "currency": "ILS",\n    "vatType": 1\n  }\n]',
		description: 'Line items array (sent as doc.income). Price must match the VAT type chosen above.',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'doc.income' },
		},
	},
	{
		displayName: 'Payment Lines (JSON Array)',
		name: 'payment',
		type: 'json',
		default: '[]',
		description: 'Optional payment lines (sent as doc.payment). Field is singular "payment".',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'doc.payment',
				value: '={{ $value && $value.length > 0 ? $value : undefined }}',
			},
		},
	},
	{
		displayName: 'Document Remarks',
		name: 'remarks',
		type: 'string',
		default: '',
		description: 'Free-text notes on the issued document (sent as doc.remarks)',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'doc.remarks',
				value: '={{ $value || undefined }}',
			},
		},
	},

	// ─── Create / Update body: recurrence data (data.*) ──────────────────────────
	{
		displayName: 'Payment Terms',
		name: 'paymentTerms',
		type: 'options',
		options: paymentTermsOptions,
		default: -1,
		description: 'Payment terms for the issued document (sent as data.paymentTerms)',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'data.paymentTerms' },
		},
	},
	{
		displayName: 'Description Rule',
		name: 'description',
		type: 'string',
		default: 'my',
		description:
			'Document description each cycle (sent as data.description). Tokens: "my" = month-year, "pmy" = previous month-year. Free text also allowed.',
		displayOptions: {
			show: {
				resource: ['retainer'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'data.description' },
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

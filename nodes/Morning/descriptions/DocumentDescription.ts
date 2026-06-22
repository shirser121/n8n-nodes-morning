import { INodeProperties } from 'n8n-workflow';

export const documentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['document'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a document',
				description: 'Issue a new document (quote, invoice, receipt, credit note, etc.)',
				routing: {
					request: {
						method: 'POST',
						url: '/documents',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a document',
				description: 'Retrieve a single document by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/documents/{{ $parameter["documentId"] }}',
					},
				},
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search documents',
				description: 'Search documents with filters and pagination',
				routing: {
					request: {
						method: 'POST',
						url: '/documents/search',
					},
				},
			},
			{
				name: 'Email',
				value: 'email',
				action: 'Email a document',
				description: 'Send a document to recipients by email',
				routing: {
					request: {
						method: 'POST',
						url: '=/documents/{{ $parameter["documentId"] }}/email',
					},
				},
			},
			{
				name: 'Preview',
				value: 'preview',
				action: 'Preview a document',
				description: 'Get a base64 PDF preview without persisting',
				routing: {
					request: {
						method: 'POST',
						url: '/documents/preview',
					},
				},
			},
			{
				name: 'Close',
				value: 'close',
				action: 'Close a document',
				description: 'Manually mark a document as closed',
				routing: {
					request: {
						method: 'POST',
						url: '=/documents/{{ $parameter["documentId"] }}/close',
						body: {},
					},
				},
			},
			{
				name: 'Open',
				value: 'open',
				action: 'Re-open a closed document',
				routing: {
					request: {
						method: 'POST',
						url: '=/documents/{{ $parameter["documentId"] }}/open',
						body: {},
					},
				},
			},
			{
				name: 'Get Download Links',
				value: 'downloadLinks',
				action: 'Get signed PDF download links',
				routing: {
					request: {
						method: 'GET',
						url: '=/documents/{{ $parameter["documentId"] }}/download/links',
					},
				},
			},
			{
				name: 'Get Info',
				value: 'info',
				action: 'Get document type info',
				description: 'Get next number, vatTypes, paymentPlugins for a document type',
				routing: {
					request: {
						method: 'GET',
						url: '/documents/info',
						qs: {
							type: '={{ $parameter["docType"] }}',
						},
					},
				},
			},
		],
		default: 'create',
	},
];

const documentTypeOptions = [
	{ name: 'Price Quotation (הצעת מחיר) — 10', value: 10 },
	{ name: 'Bill / Payment Confirmation (חשבון עסקה) — 20', value: 20 },
	{ name: 'Order (הזמנה) — 100', value: 100 },
	{ name: 'Delivery Note (תעודת משלוח) — 200', value: 200 },
	{ name: 'Return Delivery (תעודת החזרה) — 210', value: 210 },
	{ name: 'Proforma Invoice (חשבון עסקה) — 300', value: 300 },
	{ name: 'Tax Invoice (חשבונית מס) — 305', value: 305 },
	{ name: 'Tax Invoice + Receipt (חשבונית מס/קבלה) — 320', value: 320 },
	{ name: 'Credit Note (חשבונית זיכוי) — 330', value: 330 },
	{ name: 'Receipt (קבלה) — 400', value: 400 },
	{ name: 'Donation Receipt (קבלה לתרומה) — 405', value: 405 },
	{ name: 'Cancel Donation (ביטול קבלת תרומה) — 410', value: 410 },
	{ name: 'Purchase Order (הזמנת רכש) — 500', value: 500 },
	{ name: 'Deposit Receipt (קבלת פיקדון) — 600', value: 600 },
	{ name: 'Deposit Withdrawal (משיכת פיקדון) — 610', value: 610 },
];

export const documentFields: INodeProperties[] = [
	// ─── Document ID (for Get / Email / Close / Open / Download Links) ────────────
	{
		displayName: 'Document ID',
		name: 'documentId',
		type: 'string',
		required: true,
		default: '',
		description: 'The UUID of the document',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['get', 'email', 'close', 'open', 'downloadLinks'],
			},
		},
	},

	// ─── Get Info: document type ─────────────────────────────────────────────────
	{
		displayName: 'Document Type',
		name: 'docType',
		type: 'options',
		options: documentTypeOptions,
		default: 320,
		required: true,
		description: 'The document type to look up info (next number, VAT types, payment plugins) for',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['info'],
			},
		},
	},

	// ─── Create / Preview body ───────────────────────────────────────────────────
	{
		displayName: 'Document Type',
		name: 'type',
		type: 'options',
		options: documentTypeOptions,
		default: 305,
		required: true,
		description: 'The kind of document to issue (e.g. 305 = tax invoice, 320 = invoice + receipt, 400 = receipt)',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['create', 'preview'],
			},
		},
		routing: {
			send: { type: 'body', property: 'type' },
		},
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		required: true,
		description: 'Title/description shown on the document',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['create', 'preview'],
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
				resource: ['document'],
				operation: ['create', 'preview'],
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
				resource: ['document'],
				operation: ['create', 'preview'],
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
			{ name: '0 — Price BEFORE VAT (amount = post-VAT)', value: 0 },
			{ name: '1 — VAT INCLUDED in price (amount = price sum)', value: 1 },
			{ name: '2 — VAT exempt', value: 2 },
		],
		default: 1,
		description: 'How line prices relate to VAT: 0 = before VAT, 1 = VAT included, 2 = exempt',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['create', 'preview'],
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
		default: '{\n  "name": "",\n  "emails": [""]\n}',
		description:
			'Client object. Pass {"id":"<existing-uuid>"} or full {"add":true,"name":...,"emails":[...]} to auto-create.',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['create', 'preview'],
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
				resource: ['document'],
				operation: ['create', 'preview'],
			},
		},
		routing: {
			send: { type: 'body', property: 'income' },
		},
	},
	{
		displayName: 'Linked Document IDs',
		name: 'linkedDocumentIds',
		type: 'string',
		default: '',
		description: 'Comma-separated UUIDs of related documents (required for credit notes, type 330)',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['create'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'linkedDocumentIds',
				value:
					'={{ $value ? $value.split(",").map(s => s.trim()).filter(Boolean) : undefined }}',
			},
		},
	},
	{
		displayName: 'Payment Lines (JSON Array)',
		name: 'payment',
		type: 'json',
		default: '[]',
		description:
			'Payment lines (field is singular "payment", not "payments"). REQUIRED for types 320, 400, 405.',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['create', 'preview'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'payment',
				value: '={{ $value && $value.length > 0 ? $value : undefined }}',
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
				resource: ['document'],
				operation: ['create', 'preview'],
			},
		},
		routing: {
			send: { type: 'body', property: 'remarks' },
		},
	},

	// ─── Email operation: recipients ─────────────────────────────────────────────
	{
		displayName: 'Recipient Emails',
		name: 'emails',
		type: 'string',
		default: '',
		description: 'Comma-separated email addresses (sent as array)',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['email'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'emails',
				value:
					'={{ $value ? $value.split(",").map(s => s.trim()).filter(Boolean) : [] }}',
			},
		},
	},
	{
		displayName: 'Email Subject',
		name: 'emailSubject',
		type: 'string',
		default: '',
		description: 'Subject line of the email sending the document',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['email'],
			},
		},
		routing: {
			send: { type: 'body', property: 'subject' },
		},
	},
	{
		displayName: 'Email Message',
		name: 'emailMessage',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		description: 'Body text of the email sending the document',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['email'],
			},
		},
		routing: {
			send: { type: 'body', property: 'message' },
		},
	},
	{
		displayName: 'Send Original Copy',
		name: 'original',
		type: 'boolean',
		default: false,
		description: 'Whether to send the original document (true) rather than a copy (false)',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['email'],
			},
		},
		routing: {
			send: { type: 'body', property: 'original' },
		},
	},

	// ─── Search operation ────────────────────────────────────────────────────────
	{
		displayName: 'From Date',
		name: 'fromDate',
		type: 'dateTime',
		default: '',
		description: 'Only return documents dated on or after this ISO date (YYYY-MM-DD)',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['search'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'fromDate',
				value: '={{ $value ? $value.split("T")[0] : undefined }}',
			},
		},
	},
	{
		displayName: 'To Date',
		name: 'toDate',
		type: 'dateTime',
		default: '',
		description: 'Only return documents dated on or before this ISO date (YYYY-MM-DD)',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['search'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'toDate',
				value: '={{ $value ? $value.split("T")[0] : undefined }}',
			},
		},
	},
	{
		displayName: 'Document Types',
		name: 'searchTypes',
		type: 'multiOptions',
		options: documentTypeOptions,
		default: [],
		description: 'Filter results to these document type codes; leave empty for all types',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['search'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'type',
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
				resource: ['document'],
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
				resource: ['document'],
				operation: ['search'],
			},
		},
		routing: {
			send: { type: 'body', property: 'pageSize' },
		},
	},
];

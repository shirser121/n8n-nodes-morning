import { INodeProperties } from 'n8n-workflow';
import { autoComputeAmountPreSend } from '../helpers';

export const paymentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['payment'],
			},
		},
		options: [
			{
				name: 'Create Payment Form',
				value: 'createForm',
				action: 'Create a hosted checkout payment link',
				description: 'Generates a Meshulam-hosted checkout URL. Auto-issues a tax invoice + receipt on success.',
				routing: {
					request: {
						method: 'POST',
						url: '/payments/form',
					},
					send: {
						preSend: [autoComputeAmountPreSend],
					},
				},
			},
			{
				name: 'Search Payment Links',
				value: 'searchLinks',
				action: 'Search existing payment links',
				routing: {
					request: {
						method: 'POST',
						url: '/payments/links/search',
					},
				},
			},
			{
				name: 'Get Payment Link',
				value: 'getLink',
				action: 'Get a payment link by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/payments/links/{{ $parameter["linkId"] }}',
					},
				},
			},
			{
				name: 'Search Saved Tokens',
				value: 'searchTokens',
				action: 'Search saved credit-card tokens',
				routing: {
					request: {
						method: 'POST',
						url: '/payments/tokens/search',
					},
				},
			},
			{
				name: 'Charge Token',
				value: 'chargeToken',
				action: 'Charge a saved credit-card token',
				description: 'Charge a previously-saved card without re-entering details',
				routing: {
					request: {
						method: 'POST',
						url: '=/payments/tokens/{{ $parameter["tokenId"] }}/charge',
					},
				},
			},
		],
		default: 'createForm',
	},
];

export const paymentFields: INodeProperties[] = [
	// ─── Payment Form (the main flow) ────────────────────────────────────────────
	{
		displayName: 'Document Type to Auto-Issue',
		name: 'type',
		type: 'options',
		options: [
			{ name: 'Tax Invoice + Receipt (320) — Recommended', value: 320 },
			{ name: 'Receipt only (400)', value: 400 },
			{ name: 'Donation Receipt (405)', value: 405 },
		],
		default: 320,
		required: true,
		description: 'Document type automatically issued once the payment succeeds',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
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
		description: 'Internal description (e.g. order number)',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
			},
		},
		routing: {
			send: { type: 'body', property: 'description' },
		},
	},
	{
		displayName: 'Auto-Compute Amount from Income',
		name: 'autoComputeAmount',
		type: 'boolean',
		default: false,
		description: 'Whether to compute amount from income lines × VAT rate automatically. When enabled, the Amount field below is overwritten before sending.',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
			},
		},
	},
	{
		displayName: 'VAT Rate',
		name: 'vatRate',
		type: 'number',
		default: 0.18,
		typeOptions: { numberPrecision: 4 },
		description: 'Used only when Auto-Compute is on. Default 0.18 (18%, Israel 2026). For historical periods, set to 0.17, etc.',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
				autoComputeAmount: [true],
			},
		},
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		default: 0,
		required: true,
		description: 'Total customer pays. Ignored when Auto-Compute is on. Must match the income array based on vatType.',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
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
				resource: ['payment'],
				operation: ['createForm'],
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
		description: 'Language of the hosted checkout page and issued document',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
			},
		},
		routing: {
			send: { type: 'body', property: 'lang' },
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
		description: 'How income line prices relate to VAT: 0 = before VAT, 1 = VAT included, 2 = exempt',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
			},
		},
		routing: {
			send: { type: 'body', property: 'vatType' },
		},
	},
	{
		displayName: 'Plugin ID',
		name: 'pluginId',
		type: 'string',
		default: '',
		required: true,
		description:
			'Payment processor UUID. Discover via Document → Get Info (type 320) → paymentPlugins[0].id',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
			},
		},
		routing: {
			send: { type: 'body', property: 'pluginId' },
		},
	},
	{
		displayName: 'Payment Method Group',
		name: 'group',
		type: 'options',
		options: [
			{ name: 'Credit Card (100)', value: 100 },
			{ name: 'Bit (120)', value: 120 },
			{ name: 'Apple Pay (150)', value: 150 },
			{ name: 'Google Pay (160)', value: 160 },
		],
		default: 100,
		required: true,
		description: 'Which payment method to offer on the hosted checkout page',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
			},
		},
		routing: {
			send: { type: 'body', property: 'group' },
		},
	},
	{
		displayName: 'Max Payments',
		name: 'maxPayments',
		type: 'number',
		default: 1,
		description: '1 = single charge. > 1 = installments (תשלומים).',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
			},
		},
		routing: {
			send: { type: 'body', property: 'maxPayments' },
		},
	},
	{
		displayName: 'Client (JSON)',
		name: 'client',
		type: 'json',
		default: '{\n  "name": "",\n  "emails": [""]\n}',
		description: 'Client object as JSON. Pass {"id":"<uuid>"} for an existing client, or {"name":...,"emails":[...]} to create one.',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
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
		description: 'Line items as a JSON array; each has description, quantity, price, currency and vatType',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
			},
		},
		routing: {
			send: { type: 'body', property: 'income' },
		},
	},
	{
		displayName: 'Success URL',
		name: 'successUrl',
		type: 'string',
		default: '',
		description: 'Customer is redirected here after a successful payment',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'successUrl',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'Failure URL',
		name: 'failureUrl',
		type: 'string',
		default: '',
		description: 'Customer is redirected here after a failed or cancelled payment',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'failureUrl',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'Notify URL (server-to-server)',
		name: 'notifyUrl',
		type: 'string',
		default: '',
		description:
			'Webhook URL Morning will POST to with the issued document (form-urlencoded). Use the Morning Trigger node to receive these.',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'notifyUrl',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'Custom Correlation Key',
		name: 'custom',
		type: 'string',
		default: '',
		description:
			'Your own order key. Comes back in the webhook as "external_data". Use it to correlate the payment back to your order.',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['createForm'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'custom',
				value: '={{ $value || undefined }}',
			},
		},
	},

	// ─── Get / Search Link ───────────────────────────────────────────────────────
	{
		displayName: 'Link ID',
		name: 'linkId',
		type: 'string',
		required: true,
		default: '',
		description: 'The UUID of the payment link to retrieve',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['getLink'],
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
				resource: ['payment'],
				operation: ['searchLinks', 'searchTokens'],
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
				resource: ['payment'],
				operation: ['searchLinks', 'searchTokens'],
			},
		},
		routing: {
			send: { type: 'body', property: 'pageSize' },
		},
	},

	// ─── Charge Token ────────────────────────────────────────────────────────────
	{
		displayName: 'Token ID',
		name: 'tokenId',
		type: 'string',
		required: true,
		default: '',
		description: 'The UUID of the saved credit-card token to charge',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['chargeToken'],
			},
		},
	},
	{
		displayName: 'Amount',
		name: 'chargeAmount',
		type: 'number',
		default: 0,
		required: true,
		description: 'Amount to charge the saved token, in the document currency',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['chargeToken'],
			},
		},
		routing: {
			send: { type: 'body', property: 'amount' },
		},
	},
	{
		displayName: 'Description',
		name: 'chargeDescription',
		type: 'string',
		default: '',
		description: 'Description for the token charge (e.g. order number)',
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['chargeToken'],
			},
		},
		routing: {
			send: { type: 'body', property: 'description' },
		},
	},
];

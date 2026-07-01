import { INodeProperties } from 'n8n-workflow';

/**
 * Payment Transaction (עסקה) — `/payments/transactions`.
 *
 * The actual charge records produced by Morning's payment plugins (credit-card, Bit, …):
 * every charge behind a payment form, a token charge or a recurring-payment run lands here.
 * Distinct from the Payment resource — Payment *creates* the checkout links/forms/tokens,
 * Transaction *reads and reverses* their results.
 *
 * Endpoints taken verbatim from Morning's own web-app payment service:
 *   searchTransactions → POST /payments/transactions/search        (body: { documentId, from, to, page, pageSize })
 *   fetchById          → GET  /payments/transactions/{id}
 *   cancelTransaction  → POST /payments/transactions/{id}/cancel    (no body — full void of an unsettled charge)
 *   refundTransaction  → POST /payments/transactions/{id}/refund    (body: { amount } — omit for a full refund)
 *   count              → GET  /payments/transactions/count
 *
 * Cancel and Refund both return a NEW, linked reversal transaction (type 25, negative amount)
 * that references the original via `relatedTransactionId`. Only transactions with
 * `cancellable: true` can be voided; `Get` returns the full `paymentData` (card number, expiry,
 * security token) that `Search` omits.
 */
export const transactionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['transaction'],
			},
		},
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search payment transactions',
				description: 'List charge records, optionally filtered by document and creation-date range',
				routing: {
					request: {
						method: 'POST',
						url: '/payments/transactions/search',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a payment transaction',
				description: 'Fetch a single transaction by UUID, including its full paymentData',
				routing: {
					request: {
						method: 'GET',
						url: '=/payments/transactions/{{ $parameter["transactionId"] }}',
					},
				},
			},
			{
				name: 'Cancel',
				value: 'cancel',
				action: 'Cancel (void) a payment transaction',
				description:
					'Fully void a cancellable transaction; returns a new linked reversal transaction',
				routing: {
					request: {
						method: 'POST',
						url: '=/payments/transactions/{{ $parameter["transactionId"] }}/cancel',
					},
				},
			},
			{
				name: 'Refund',
				value: 'refund',
				action: 'Refund a payment transaction',
				description:
					'Refund a settled transaction — full, or partial when a Refund Amount is given',
				routing: {
					request: {
						method: 'POST',
						url: '=/payments/transactions/{{ $parameter["transactionId"] }}/refund',
					},
				},
			},
			{
				name: 'Count',
				value: 'count',
				action: 'Count payment transactions',
				description: 'Return the total number of transactions on the business',
				routing: {
					request: {
						method: 'GET',
						url: '/payments/transactions/count',
					},
				},
			},
		],
		default: 'search',
	},
];

export const transactionFields: INodeProperties[] = [
	// ─── Transaction ID (Get / Cancel / Refund) ───────────────────────────────────
	{
		displayName: 'Transaction ID',
		name: 'transactionId',
		type: 'string',
		required: true,
		default: '',
		description: 'The UUID of the transaction to act on (the "id" field returned by Search)',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['get', 'cancel', 'refund'],
			},
		},
	},

	// ─── Refund ────────────────────────────────────────────────────────────────────
	{
		displayName: 'Refund Amount',
		name: 'refundAmount',
		type: 'number',
		default: 0,
		description:
			'Amount to refund, in the transaction currency. Leave 0 (empty) to refund the full transaction amount.',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['refund'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'amount',
				value: '={{ $value || undefined }}',
			},
		},
	},

	// ─── Search ────────────────────────────────────────────────────────────────────
	{
		displayName: 'Document ID',
		name: 'documentId',
		type: 'string',
		default: '',
		description:
			'Only return transactions belonging to this document UUID. Leave empty to search across all documents.',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['search'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'documentId',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'From Date',
		name: 'from',
		type: 'dateTime',
		default: '',
		description: 'Start of the creation-date range, inclusive (sent as YYYY-MM-DD)',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['search'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'from',
				value: '={{ $value ? $value.split("T")[0] : undefined }}',
			},
		},
	},
	{
		displayName: 'To Date',
		name: 'to',
		type: 'dateTime',
		default: '',
		description: 'End of the creation-date range, inclusive (sent as YYYY-MM-DD)',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['search'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'to',
				value: '={{ $value ? $value.split("T")[0] : undefined }}',
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
				resource: ['transaction'],
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
				resource: ['transaction'],
				operation: ['search'],
			},
		},
		routing: {
			send: { type: 'body', property: 'pageSize' },
		},
	},
];

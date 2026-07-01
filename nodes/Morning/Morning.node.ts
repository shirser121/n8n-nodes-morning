import type { INodeType, INodeTypeDescription } from 'n8n-workflow';

import {
	accountingFields,
	accountingOperations,
	businessFields,
	businessOperations,
	clientFields,
	clientOperations,
	documentFields,
	documentOperations,
	expenseFields,
	expenseOperations,
	itemFields,
	itemOperations,
	paymentFields,
	paymentOperations,
	recurringFields,
	recurringOperations,
	retainerFields,
	retainerOperations,
	supplierFields,
	supplierOperations,
	transactionFields,
	transactionOperations,
} from './descriptions';

export class Morning implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Morning',
		name: 'morning',
		icon: 'file:morning.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Morning (Green Invoice / חשבונית ירוקה) — Israeli accounting and invoicing',
		usableAsTool: {
			replacements: {
				description:
					'Israeli accounting & invoicing via Morning (Green Invoice). Create and search clients, suppliers and catalog items; issue documents (tax invoices, receipts, invoice-receipts); record expenses; create payment links and charge saved cards; manage recurring payments (הוראת קבע) and retainers (ריטיינר). Use for any Morning bookkeeping or invoicing action.',
			},
		},
		defaults: {
			name: 'Morning',
		},
		inputs: ['main'] as INodeTypeDescription['inputs'],
		outputs: ['main'] as INodeTypeDescription['outputs'],
		credentials: [
			{
				name: 'morningApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL:
				'={{ $credentials.environment === "production" ? "https://api.greeninvoice.co.il/api/v1" : "https://sandbox.d.greeninvoice.co.il/api/v1" }}',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Document', value: 'document' },
					{ name: 'Client', value: 'client' },
					{ name: 'Supplier', value: 'supplier' },
					{ name: 'Item (Catalog)', value: 'item' },
					{ name: 'Expense', value: 'expense' },
					{ name: 'Payment', value: 'payment' },
					{ name: 'Transaction (עסקה)', value: 'transaction' },
					{ name: 'Recurring Payment (הוראת קבע)', value: 'recurring' },
					{ name: 'Retainer (ריטיינר)', value: 'retainer' },
					{ name: 'Accounting', value: 'accounting' },
					{ name: 'Business', value: 'business' },
				],
				default: 'document',
			},
			...documentOperations,
			...documentFields,
			...clientOperations,
			...clientFields,
			...supplierOperations,
			...supplierFields,
			...itemOperations,
			...itemFields,
			...expenseOperations,
			...expenseFields,
			...paymentOperations,
			...paymentFields,
			...transactionOperations,
			...transactionFields,
			...recurringOperations,
			...recurringFields,
			...retainerOperations,
			...retainerFields,
			...accountingOperations,
			...accountingFields,
			...businessOperations,
			...businessFields,
		],
	};
}

import { INodeProperties } from 'n8n-workflow';
import { validateTaxIdPreSend } from '../helpers';

export const supplierOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['supplier'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a supplier',
				routing: { request: { method: 'POST', url: '/suppliers' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a supplier',
				routing: {
					request: { method: 'GET', url: '=/suppliers/{{ $parameter["supplierId"] }}' },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a supplier',
				routing: {
					request: { method: 'PUT', url: '=/suppliers/{{ $parameter["supplierId"] }}' },
				},
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search suppliers',
				routing: { request: { method: 'POST', url: '/suppliers/search' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a supplier (only if no expenses)',
				routing: {
					request: { method: 'DELETE', url: '=/suppliers/{{ $parameter["supplierId"] }}' },
				},
			},
		],
		default: 'create',
	},
];

export const supplierFields: INodeProperties[] = [
	{
		displayName: 'Supplier ID',
		name: 'supplierId',
		type: 'string',
		required: true,
		default: '',
		description: 'The UUID of the supplier to act on',
		displayOptions: {
			show: { resource: ['supplier'], operation: ['get', 'update', 'delete'] },
		},
	},
	{
		displayName: 'Name',
		name: 'supplierName',
		type: 'string',
		default: '',
		required: true,
		description: "The supplier's display name (person or company)",
		displayOptions: {
			show: { resource: ['supplier'], operation: ['create', 'update'] },
		},
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Emails',
		name: 'emails',
		type: 'string',
		default: '',
		required: true,
		description: 'Comma-separated email addresses (sent as array)',
		displayOptions: {
			show: { resource: ['supplier'], operation: ['create', 'update'] },
		},
		routing: {
			send: {
				type: 'body',
				property: 'emails',
				value: '={{ $value ? $value.split(",").map(s => s.trim()).filter(Boolean) : [] }}',
			},
		},
	},
	{
		displayName: 'Tax ID',
		name: 'taxId',
		type: 'string',
		default: '',
		description: 'Israeli ח.פ / ת.ז — validated client-side via mod-10 before sending',
		displayOptions: {
			show: { resource: ['supplier'], operation: ['create', 'update'] },
		},
		routing: {
			send: {
				type: 'body',
				property: 'taxId',
				value: '={{ $value || undefined }}',
				preSend: [validateTaxIdPreSend],
			},
		},
	},
	{
		displayName: 'Phone',
		name: 'phone',
		type: 'string',
		default: '',
		description: 'Contact phone number, e.g. "03-1234567" or "+972-50-1234567"',
		displayOptions: { show: { resource: ['supplier'], operation: ['create', 'update'] } },
		routing: {
			send: { type: 'body', property: 'phone', value: '={{ $value || undefined }}' },
		},
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		description: 'Street address (street and house number)',
		displayOptions: { show: { resource: ['supplier'], operation: ['create', 'update'] } },
		routing: {
			send: { type: 'body', property: 'address', value: '={{ $value || undefined }}' },
		},
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		default: '',
		description: 'City name',
		displayOptions: { show: { resource: ['supplier'], operation: ['create', 'update'] } },
		routing: {
			send: { type: 'body', property: 'city', value: '={{ $value || undefined }}' },
		},
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'string',
		default: 'IL',
		description: 'ISO 3166-1 alpha-2 country code (e.g. "IL" for Israel, "US")',
		displayOptions: { show: { resource: ['supplier'], operation: ['create', 'update'] } },
		routing: { send: { type: 'body', property: 'country' } },
	},
	{
		displayName: 'Active',
		name: 'active',
		type: 'boolean',
		default: true,
		description: 'Set to false to deactivate (preferred over delete for suppliers with expenses)',
		displayOptions: { show: { resource: ['supplier'], operation: ['update'] } },
		routing: { send: { type: 'body', property: 'active' } },
	},
	{
		displayName: 'Search Term',
		name: 'searchTerm',
		type: 'string',
		default: '',
		description: 'Free-text term to search suppliers by name',
		displayOptions: { show: { resource: ['supplier'], operation: ['search'] } },
		routing: {
			send: { type: 'body', property: 'name', value: '={{ $value || undefined }}' },
		},
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		description: 'Page number of search results to return (1-based)',
		displayOptions: { show: { resource: ['supplier'], operation: ['search'] } },
		routing: { send: { type: 'body', property: 'page' } },
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 100 },
		description: 'Number of results per page (1-100)',
		displayOptions: { show: { resource: ['supplier'], operation: ['search'] } },
		routing: { send: { type: 'body', property: 'pageSize' } },
	},
];

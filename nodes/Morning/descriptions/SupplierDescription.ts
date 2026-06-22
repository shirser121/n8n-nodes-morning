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
		displayOptions: {
			show: { resource: ['supplier'], operation: ['get', 'update', 'delete'] },
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
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
		displayOptions: { show: { resource: ['supplier'], operation: ['search'] } },
		routing: { send: { type: 'body', property: 'page' } },
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 100 },
		displayOptions: { show: { resource: ['supplier'], operation: ['search'] } },
		routing: { send: { type: 'body', property: 'pageSize' } },
	},
];

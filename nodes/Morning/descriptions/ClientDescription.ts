import { INodeProperties } from 'n8n-workflow';
import { validateTaxIdPreSend } from '../helpers';

export const clientOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['client'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a client',
				routing: {
					request: {
						method: 'POST',
						url: '/clients',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a client',
				routing: {
					request: {
						method: 'GET',
						url: '=/clients/{{ $parameter["clientId"] }}',
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a client',
				description: 'Full replace — pass all fields you want to keep',
				routing: {
					request: {
						method: 'PUT',
						url: '=/clients/{{ $parameter["clientId"] }}',
					},
				},
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search clients',
				routing: {
					request: {
						method: 'POST',
						url: '/clients/search',
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a client (only if no documents)',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/clients/{{ $parameter["clientId"] }}',
					},
				},
			},
		],
		default: 'create',
	},
];

export const clientFields: INodeProperties[] = [
	{
		displayName: 'Client ID',
		name: 'clientId',
		type: 'string',
		required: true,
		default: '',
		description: 'The UUID of the client to act on',
		displayOptions: {
			show: {
				resource: ['client'],
				operation: ['get', 'update', 'delete'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'clientName',
		type: 'string',
		default: '',
		required: true,
		description: "The client's display name (person or company)",
		displayOptions: {
			show: {
				resource: ['client'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'name' },
		},
	},
	{
		displayName: 'Emails',
		name: 'emails',
		type: 'string',
		default: '',
		required: true,
		description: 'Comma-separated email addresses (sent as array; required by Morning API)',
		displayOptions: {
			show: {
				resource: ['client'],
				operation: ['create', 'update'],
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
		displayName: 'Tax ID',
		name: 'taxId',
		type: 'string',
		default: '',
		description:
			'Israeli ח.פ / ת.ז — must pass Israeli mod-10 checksum (e.g. "000000018" is valid; "123456789" is not)',
		displayOptions: {
			show: {
				resource: ['client'],
				operation: ['create', 'update'],
			},
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
		displayOptions: {
			show: {
				resource: ['client'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'phone',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		description: 'Street address (street and house number)',
		displayOptions: {
			show: {
				resource: ['client'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'address',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		default: '',
		description: 'City name',
		displayOptions: {
			show: {
				resource: ['client'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'city',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'string',
		default: 'IL',
		description: 'ISO 3166-1 alpha-2 country code (e.g. "IL" for Israel, "US")',
		displayOptions: {
			show: {
				resource: ['client'],
				operation: ['create', 'update'],
			},
		},
		routing: {
			send: { type: 'body', property: 'country' },
		},
	},
	{
		displayName: 'Remarks',
		name: 'remarks',
		type: 'string',
		default: '',
		description: 'Free-text internal notes about the client',
		displayOptions: {
			show: {
				resource: ['client'],
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

	// Search fields
	{
		displayName: 'Search Term',
		name: 'searchTerm',
		type: 'string',
		default: '',
		description: 'Free-text search across client names',
		displayOptions: {
			show: {
				resource: ['client'],
				operation: ['search'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'name',
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
				resource: ['client'],
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
				resource: ['client'],
				operation: ['search'],
			},
		},
		routing: {
			send: { type: 'body', property: 'pageSize' },
		},
	},
];

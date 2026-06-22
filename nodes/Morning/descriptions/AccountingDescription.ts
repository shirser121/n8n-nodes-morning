import { INodeProperties } from 'n8n-workflow';

export const accountingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['accounting'],
			},
		},
		options: [
			{
				name: 'Get Classifications Map',
				value: 'classificationsMap',
				action: 'Get the Israeli chart of accounts',
				description:
					'Returns the parent/child classification tree. Use the id (UUID) when referencing in expense create.',
				routing: {
					request: {
						method: 'GET',
						url: '/accounting/classifications/map',
					},
				},
			},
		],
		default: 'classificationsMap',
	},
];

export const accountingFields: INodeProperties[] = [];

// ─── Business resource (handy reads) ─────────────────────────────────────────
export const businessOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['business'],
			},
		},
		options: [
			{
				name: 'Get Me',
				value: 'getMe',
				action: 'Get the business this API key is scoped to',
				routing: {
					request: {
						method: 'GET',
						url: '/businesses/me',
					},
				},
			},
			{
				name: 'Get Numbering',
				value: 'getNumbering',
				action: 'Per-type next document number',
				routing: {
					request: {
						method: 'GET',
						url: '/businesses/numbering',
					},
				},
			},
			{
				name: 'Get Footer',
				value: 'getFooter',
				action: 'Get default document footer text',
				routing: {
					request: {
						method: 'GET',
						url: '/businesses/footer',
					},
				},
			},
			{
				name: 'Get Business Types',
				value: 'getTypes',
				action: 'List Israeli business types',
				routing: {
					request: {
						method: 'GET',
						url: '/businesses/types',
						qs: {
							lang: '={{ $parameter["lang"] }}',
						},
					},
				},
			},
		],
		default: 'getMe',
	},
];

export const businessFields: INodeProperties[] = [
	{
		displayName: 'Language',
		name: 'lang',
		type: 'options',
		options: [
			{ name: 'Hebrew', value: 'he' },
			{ name: 'English', value: 'en' },
		],
		default: 'en',
		displayOptions: {
			show: {
				resource: ['business'],
				operation: ['getTypes'],
			},
		},
	},
];

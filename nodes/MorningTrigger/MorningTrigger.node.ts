import type {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

interface MorningWebhookBody {
	id?: string;
	document_id?: string;
	number?: string;
	type?: string;
	external_data?: string;
	transaction_id?: string;
	url?: string;
	original_doc_url?: string;
	copy_doc_url?: string;
	[key: string]: unknown;
}

export class MorningTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Morning Trigger',
		name: 'morningTrigger',
		icon: 'file:morning.svg',
		group: ['trigger'],
		version: 1,
		description:
			'Receives webhooks from Morning (Green Invoice) — set this URL as notifyUrl on a /payments/form call',
		defaults: {
			name: 'Morning Trigger',
		},
		inputs: [],
		outputs: ['main'] as INodeTypeDescription['outputs'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'morning',
			},
		],
		properties: [
			{
				displayName: 'Verification Token (Query Param)',
				name: 'verifyToken',
				type: 'string',
				default: '',
				description:
					'Optional. Append ?token=<value> to the webhook URL when configuring notifyUrl. Requests without a matching token will be rejected. Morning does not sign webhooks, so this guards against forged callbacks.',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				options: [
					{
						name: 'Parsed (Recommended)',
						value: 'parsed',
						description:
							'Normalize the form-urlencoded body into a clean JSON object with camelCase keys',
					},
					{
						name: 'Raw',
						value: 'raw',
						description: 'Pass the form-urlencoded body through untouched',
					},
				],
				default: 'parsed',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const body = (req.body ?? {}) as MorningWebhookBody;
		const headers = this.getHeaderData() as IDataObject;
		const query = this.getQueryData() as IDataObject;

		const verifyToken = this.getNodeParameter('verifyToken', '') as string;
		if (verifyToken) {
			const provided = (query.token as string) || '';
			if (provided !== verifyToken) {
				return {
					webhookResponse: {
						status: 403,
						body: 'Forbidden — verification token mismatch',
					},
					noWebhookResponse: true,
				};
			}
		}

		const outputFormat = this.getNodeParameter('outputFormat', 'parsed') as string;
		const correlationId =
			(headers['x-correlation-id'] as string) || (headers['X-Correlation-Id'] as string) || '';

		let output: IDataObject;
		if (outputFormat === 'parsed') {
			output = {
				documentId: body.id ?? null,
				documentNumber: body.document_id ?? body.number ?? null,
				documentType: body.type !== undefined ? Number(body.type) : null,
				externalData: body.external_data ?? null,
				transactionId: body.transaction_id ?? null,
				pdfUrl: body.url ?? null,
				originalDocUrl: body.original_doc_url ?? null,
				copyDocUrl: body.copy_doc_url ?? null,
				correlationId,
				raw: body as unknown as IDataObject,
			};
		} else {
			output = {
				body: body as unknown as IDataObject,
				correlationId,
			};
		}

		return {
			workflowData: [this.helpers.returnJsonArray([output])],
		};
	}
}

import {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';

const SANDBOX_BASE = 'https://sandbox.d.greeninvoice.co.il/api/v1';
const PRODUCTION_BASE = 'https://api.greeninvoice.co.il/api/v1';

export class MorningApi implements ICredentialType {
	name = 'morningApi';
	displayName = 'Morning (Green Invoice) API';
	documentationUrl = 'https://www.greeninvoice.co.il/api-docs/';

	properties: INodeProperties[] = [
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{ name: 'Sandbox', value: 'sandbox' },
				{ name: 'Production', value: 'production' },
			],
			default: 'sandbox',
			description: 'Sandbox and production use separate API keys. Generate them at app.greeninvoice.co.il → המשתמש שלי → כלי מפתחים → API Keys.',
		},
		{
			displayName: 'API Key ID',
			name: 'apiKeyId',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'API Key Secret',
			name: 'apiKeySecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'Session Token',
			name: 'sessionToken',
			type: 'hidden',
			typeOptions: {
				expirable: true,
			},
			default: '',
		},
	];

	async preAuthentication(
		this: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
	): Promise<{ sessionToken: string }> {
		const baseUrl =
			(credentials.environment as string) === 'production' ? PRODUCTION_BASE : SANDBOX_BASE;

		const response = (await this.helpers.httpRequest({
			method: 'POST',
			url: `${baseUrl}/account/token`,
			body: {
				id: credentials.apiKeyId,
				secret: credentials.apiKeySecret,
			},
			json: true,
		})) as { token: string; expires: number };

		if (!response?.token) {
			throw new Error('Morning /account/token did not return a token. Check API key id/secret.');
		}

		return { sessionToken: response.token };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{ $credentials.sessionToken }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{ $credentials.environment === "production" ? "https://api.greeninvoice.co.il/api/v1" : "https://sandbox.d.greeninvoice.co.il/api/v1" }}',
			url: '/businesses/me',
			method: 'GET',
		},
	};
}

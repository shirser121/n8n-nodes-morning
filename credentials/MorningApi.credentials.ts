import {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';

// The OAuth token endpoint lives on a dedicated auth host, separate from the
// resource API base (https://api.greeninvoice.co.il/api/v1) used by every
// other call — see https://developers.morning.co.
const SANDBOX_AUTH_BASE = 'https://api.sandbox.morning.dev';
const PRODUCTION_AUTH_BASE = 'https://api.morning.co';

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
		const authBase =
			(credentials.environment as string) === 'production'
				? PRODUCTION_AUTH_BASE
				: SANDBOX_AUTH_BASE;

		const response = (await this.helpers.httpRequest({
			method: 'POST',
			url: `${authBase}/idp/v1/oauth/token`,
			body: {
				grant_type: 'client_credentials',
				client_id: credentials.apiKeyId,
				client_secret: credentials.apiKeySecret,
			},
			json: true,
		})) as { accessToken: string; tokenType: string; expiresAt: number };

		if (!response?.accessToken) {
			throw new Error(
				'Morning /idp/v1/oauth/token did not return an access token. Check API key id/secret.',
			);
		}

		return { sessionToken: response.accessToken };
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

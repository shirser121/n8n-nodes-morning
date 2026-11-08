import { createHash } from 'node:crypto';
import {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

// The OAuth token endpoint lives on a dedicated auth host, separate from the
// resource API base (https://api.greeninvoice.co.il/api/v1) used by every
// other call — see https://developers.morning.co.
const SANDBOX_AUTH_BASE = 'https://api.sandbox.morning.dev';
const PRODUCTION_AUTH_BASE = 'https://api.morning.co';

const TOKEN_TIMEOUT_MS = 15000;
const REFRESH_MARGIN_MS = 5 * 60 * 1000;
const FALLBACK_LIFETIME_MS = 50 * 60 * 1000;

type CachedToken = { token: string; expiresAtMs: number };
const tokenCache = new Map<string, CachedToken>();
const inFlight = new Map<string, Promise<CachedToken>>();

function cacheKey(credentials: ICredentialDataDecryptedObject): string {
	const secretHash = createHash('sha256').update(String(credentials.apiKeySecret)).digest('hex');
	return `${credentials.environment}:${credentials.apiKeyId}:${secretHash.slice(0, 16)}`;
}

/** Drop the cached bearer token so the next request fetches a fresh one. */
export function clearMorningToken(credentials: ICredentialDataDecryptedObject): void {
	tokenCache.delete(cacheKey(credentials));
}

/** Morning returns `expiresAt` as epoch seconds; milliseconds and missing values are tolerated. */
function expiryToMs(expiresAt: unknown): number {
	const n = Number(expiresAt);
	if (!Number.isFinite(n) || n <= 0) return Date.now() + FALLBACK_LIFETIME_MS;
	return n < 1e12 ? n * 1000 : n;
}

async function fetchToken(credentials: ICredentialDataDecryptedObject): Promise<CachedToken> {
	const authBase =
		credentials.environment === 'production' ? PRODUCTION_AUTH_BASE : SANDBOX_AUTH_BASE;
	let res: Response;
	try {
		res = await fetch(`${authBase}/idp/v1/oauth/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify({
				grant_type: 'client_credentials',
				client_id: credentials.apiKeyId,
				client_secret: credentials.apiKeySecret,
			}),
			signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
		});
	} catch (error) {
		const reason = (error as Error).name === 'TimeoutError' ? `timed out after ${TOKEN_TIMEOUT_MS / 1000}s` : (error as Error).message;
		throw new Error(`Morning token request failed: ${reason}`);
	}
	const text = await res.text();
	let data: Record<string, unknown> = {};
	try {
		data = JSON.parse(text) as Record<string, unknown>;
	} catch {
		// non-JSON body: reported through the status below
	}
	if (!res.ok || typeof data.accessToken !== 'string' || data.accessToken === '') {
		const detail = data.errorMessage ?? data.message ?? (text.slice(0, 200) || `HTTP ${res.status}`);
		const code = data.errorCode ?? res.status;
		throw new Error(`Morning token request failed (${code}): ${String(detail)}. Check API key id/secret.`);
	}
	return { token: data.accessToken, expiresAtMs: expiryToMs(data.expiresAt) };
}

async function getMorningToken(credentials: ICredentialDataDecryptedObject): Promise<string> {
	const key = cacheKey(credentials);
	const cached = tokenCache.get(key);
	if (cached && cached.expiresAtMs - Date.now() > REFRESH_MARGIN_MS) return cached.token;

	let pending = inFlight.get(key);
	if (!pending) {
		pending = fetchToken(credentials)
			.then((fresh) => {
				tokenCache.set(key, fresh);
				return fresh;
			})
			.finally(() => inFlight.delete(key));
		inFlight.set(key, pending);
	}
	return (await pending).token;
}

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
	];

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const token = await getMorningToken(credentials);
		requestOptions.headers = { ...requestOptions.headers, Authorization: `Bearer ${token}` };
		return requestOptions;
	}

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{ $credentials.environment === "production" ? "https://api.greeninvoice.co.il/api/v1" : "https://sandbox.d.greeninvoice.co.il/api/v1" }}',
			url: '/businesses/me',
			method: 'GET',
		},
	};
}

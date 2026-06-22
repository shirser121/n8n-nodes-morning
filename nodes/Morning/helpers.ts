import {
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	NodeOperationError,
} from 'n8n-workflow';

/**
 * Validate an Israeli tax ID (ת.ז or ח.פ) against the official mod-10 checksum.
 * Pad-left to 9 digits, multiply digits by (1,2,1,2,1,2,1,2,1), sum (subtract 9 from products > 9), sum % 10 === 0.
 */
export function isValidIsraeliTaxId(input: string | number | null | undefined): boolean {
	if (input === null || input === undefined) return false;
	const digits = String(input).trim().replace(/\D/g, '');
	if (digits.length === 0 || digits.length > 9) return false;
	const padded = digits.padStart(9, '0');

	let sum = 0;
	for (let i = 0; i < 9; i++) {
		const digit = parseInt(padded[i], 10);
		let product = digit * ((i % 2) + 1);
		if (product > 9) product -= 9;
		sum += product;
	}
	return sum % 10 === 0;
}

export type IncomeLine = {
	price?: number;
	quantity?: number;
};

/**
 * Compute the `amount` field of a Morning document/payment-form payload from `income[]`,
 * applying VAT according to vatType. Returns a number rounded to 2 decimal places.
 *
 * - vatType 0: price is BEFORE VAT → amount = sum(price*qty) * (1 + vatRate)
 * - vatType 1: price INCLUDES VAT  → amount = sum(price*qty)
 * - vatType 2: VAT exempt          → amount = sum(price*qty)
 *
 * vatRate defaults to 0.18 (18% — Israel as of 2026). Override via the node's vatRate field for past rates.
 */
export function computeAmount(
	income: IncomeLine[] | null | undefined,
	vatType: 0 | 1 | 2,
	vatRate: number = 0.18,
): number {
	if (!Array.isArray(income) || income.length === 0) return 0;
	const sumIncome = income.reduce((acc, line) => {
		const price = Number(line?.price ?? 0);
		const qty = Number(line?.quantity ?? 1);
		return acc + price * qty;
	}, 0);

	if (vatType === 0) {
		return Math.round(sumIncome * (1 + vatRate) * 100) / 100;
	}
	return Math.round(sumIncome * 100) / 100;
}

/** PreSend hook: validate taxId mod-10 before the request goes out. Attached to the `taxId` field's routing. */
export async function validateTaxIdPreSend(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = (requestOptions.body ?? {}) as Record<string, unknown>;
	const taxId = body.taxId;
	if (typeof taxId === 'string' && taxId.length > 0 && !isValidIsraeliTaxId(taxId)) {
		throw new NodeOperationError(
			this.getNode(),
			`Invalid Israeli tax ID "${taxId}". Must pass mod-10 checksum. Test value: "000000018".`,
		);
	}
	return requestOptions;
}

/** PreSend hook: compute `amount` from `income[]` when the user opted into auto-compute. Reads vatType and vatRate from node parameters. */
export async function autoComputeAmountPreSend(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const auto = this.getNodeParameter('autoComputeAmount', false) as boolean;
	if (!auto) return requestOptions;

	const income = this.getNodeParameter('income', []) as IncomeLine[];
	const vatType = this.getNodeParameter('vatType', 1) as 0 | 1 | 2;
	const vatRate = this.getNodeParameter('vatRate', 0.18) as number;

	const body = (requestOptions.body ?? {}) as Record<string, unknown>;
	body.amount = computeAmount(income, vatType, vatRate);
	requestOptions.body = body;
	return requestOptions;
}

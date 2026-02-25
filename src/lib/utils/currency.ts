export function formatCurrency(
	amount: number,
	locale = 'en-US',
	currency = 'USD'
): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(amount);
}

export function formatCurrencyCompact(amount: number, locale = 'en-US', currency = 'USD'): string {
	if (Math.abs(amount) >= 1_000_000) {
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency,
			notation: 'compact',
			maximumFractionDigits: 1
		}).format(amount);
	}
	return formatCurrency(amount, locale, currency);
}

export function parseCurrency(str: string): number {
	const cleaned = str.replace(/[^0-9.-]/g, '');
	const value = parseFloat(cleaned);
	return isNaN(value) ? 0 : value;
}

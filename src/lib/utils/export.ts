import { validateEnvelope, type ExportEnvelope } from '$lib/persistence/localStorage';

export function exportToFile(envelope: ExportEnvelope): void {
	const json = JSON.stringify(envelope, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	const date = new Date().toISOString().split('T')[0];
	a.href = url;
	a.download = `accountly-export-${date}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export async function importFromFile(file: File): Promise<ExportEnvelope> {
	const text = await file.text();
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		throw new Error('Invalid JSON file');
	}
	if (!validateEnvelope(data)) {
		throw new Error('File does not appear to be a valid Accountly export');
	}
	return data;
}

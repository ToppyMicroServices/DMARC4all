export function downloadJson(filename, value) {
	const safeName = String(filename || 'dmarc4all-export.json').replace(/[^A-Za-z0-9._-]+/g, '-');
	const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	try {
		const link = document.createElement('a');
		link.href = url;
		link.download = safeName;
		link.click();
	} finally {
		setTimeout(() => URL.revokeObjectURL(url), 0);
	}
}

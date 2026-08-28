import { expect, test } from '@playwright/test';

const LANGUAGES = ['ja', 'en', 'es', 'de', 'ko', 'vi', 'th', 'km', 'my', 'id', 'et', 'zh', 'ru', 'bn'];

test('mobile landing keeps tools and every language accessible', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/index.html?lang=ja');

	await expect(page.locator('.brand-tool-link')).toHaveCount(2);
	for (const link of await page.locator('.brand-tool-link').all()) {
		await expect(link).toBeVisible();
		const box = await link.boundingBox();
		expect(box?.width || 0).toBeGreaterThan(70);
		expect(box?.height || 0).toBeLessThan(48);
	}

	for (const lang of LANGUAGES) {
		await expect(page.locator(`[data-lang-choice="${lang}"]`)).toBeVisible();
	}
	await expect(page.locator('.lang-btn')).toHaveCount(LANGUAGES.length);

	const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
	expect(horizontalOverflow).toBeLessThanOrEqual(1);
});

test('beginner form hides optional network and scan controls by default', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/index.html?lang=en');

	const advanced = page.locator('.advanced-options');
	await expect(advanced).not.toHaveAttribute('open', '');
	await expect(page.locator('#consent')).toBeVisible();
	await expect(page.locator('#go-deep-btn')).toBeVisible();
	await expect(page.locator('#subdomain-scan')).not.toBeVisible();
	await expect(page.locator('#external-probes')).not.toBeVisible();

	await advanced.locator('summary').click();
	await expect(page.locator('#subdomain-scan')).toBeVisible();
	await expect(page.locator('#external-probes')).toBeVisible();
});

test('RUA page states availability before collapsed design material', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/rua_service.html?lang=en');

	await expect(page.locator('.rua-status-card')).toBeVisible();
	await expect(page.locator('.rua-status-card')).toContainText('does not provide enrollment or activation');
	await expect(page.locator('.rua-status-action')).toHaveAttribute('href', /^rua_analyzer\.html(?:\?lang=en)?$/);
	await expect(page.locator('.rua-technical-details')).not.toHaveAttribute('open', '');
	await expect(page.locator('.rua-technical-details > summary')).toBeVisible();
});

test('desktop page loads the pinned sanitizer and localized form', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/index.html?lang=bn');

	await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
	await expect(page.locator('.advanced-options > summary')).toHaveText('উন্নত সেটিংস');
	expect(await page.evaluate(() => typeof window.DOMPurify?.sanitize)).toBe('function');
});

test('diagnosis keeps conclusions before collapsed raw DNS evidence', async ({ page }) => {
	await page.route('https://cloudflare-dns.com/dns-query?*', async (route) => {
		const requestUrl = new URL(route.request().url());
		const name = requestUrl.searchParams.get('name');
		const type = requestUrl.searchParams.get('type');
		const answers = [];
		if (name === 'example.com' && type === 'NS') answers.push({ type: 2, TTL: 300, data: 'ns1.example.net.' });
		if (name === '_dmarc.example.com' && type === 'TXT') answers.push({ type: 16, TTL: 300, data: '"v=DMARC1; p=none; rua=mailto:dmarc@example.com"' });
		if (name === 'example.com' && type === 'TXT') answers.push({ type: 16, TTL: 300, data: '"v=spf1 -all"' });
		if (name === 'example.com' && type === 'MX') answers.push({ type: 15, TTL: 300, data: '10 mail.example.com.' });
		await route.fulfill({
			status: 200,
			contentType: 'application/dns-json',
			body: JSON.stringify({ Status: 0, Answer: answers })
		});
	});

	await page.goto('/index.html?lang=ja');
	await page.locator('#domain').fill('example.com');
	await page.locator('#go-deep-btn').click();
	await expect(page.locator('.score-banner')).toBeVisible();
	await expect(page.locator('.repro-details')).not.toHaveAttribute('open', '');
	await expect(page.locator('#report')).not.toContainText('設定OK');
	await expect(page.locator('.score-breakdown')).not.toContainText(/missing|not applicable|Inbound mail/i);

	const hierarchy = await page.evaluate(() => {
		const report = document.querySelector('#report');
		return [...report.children].map((element) => element.className);
	});
	expect(hierarchy.findIndex((value) => value.includes('report-grid')))
		.toBeLessThan(hierarchy.findIndex((value) => value.includes('repro-details')));
});

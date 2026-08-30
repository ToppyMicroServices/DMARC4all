import { expect, test } from '@playwright/test';

const LANGUAGES = ['ja', 'en', 'es', 'de', 'ko', 'vi', 'th', 'km', 'my', 'id', 'et', 'zh', 'ru', 'bn'];
const PUBLIC_PAGES = [
	'index.html',
	'index_enterprise.html',
	'header_analyzer.html',
	'rua_analyzer.html',
	'authentication_graph.html',
	'rua_service.html',
	'rua_service_enterprise.html',
	'ai_usage.html',
	'standards_privacy.html',
	'dns_provider_guides.html',
	'offline.html'
];

test('all public pages keep the monitor shell within responsive viewports', async ({ page }) => {
	for (const width of [1280, 700, 390]) {
		await page.setViewportSize({ width, height: 844 });
		for (const path of PUBLIC_PAGES) {
			await page.goto(`/${path}?lang=en`);
			const state = await page.evaluate(() => ({
				background: getComputedStyle(document.body).backgroundColor,
				overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
				stylesheet: document.querySelector('link[href*="styles.css"]')?.getAttribute('href') || ''
			}));
			expect(state.background, `${path} background at ${width}px`).toBe('rgb(14, 27, 50)');
			expect(state.overflow, `${path} overflow at ${width}px`).toBeLessThanOrEqual(1);
			expect(state.stylesheet, `${path} stylesheet at ${width}px`).toContain('styles.css?v=21');
		}
	}
});

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
	const titleFontSize = await page.locator('.hero h1').evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
	expect(titleFontSize).toBeGreaterThanOrEqual(24);
	expect(titleFontSize).toBeLessThanOrEqual(32);

	await page.setViewportSize({ width: 700, height: 800 });
	await page.reload();
	expect(await page.locator('.brandbar').evaluate((element) => getComputedStyle(element).position)).toBe('static');
	for (const link of await page.locator('.brand-tool-link').all()) {
		const box = await link.boundingBox();
		expect(box?.height || 0).toBeLessThan(48);
	}
	expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('beginner flow is direct and hides optional network and scan controls by default', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/index.html?lang=en');

	const advanced = page.locator('.advanced-options');
	await expect(advanced).not.toHaveAttribute('open', '');
	await expect(page.locator('#consent')).toHaveCount(0);
	await expect(page.locator('#go-deep-btn')).toBeVisible();
	await expect(page.locator('.hero-steps')).toHaveCount(0);
	await expect(page.locator('.hero-proof-grid, .hero-badges')).toHaveCount(0);
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

test('technical monitor visual tokens render on the app and offline shell', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/index.html?lang=en');

	const appDesign = await page.evaluate(() => {
		const body = getComputedStyle(document.body);
		const hero = getComputedStyle(document.querySelector('.hero'));
		const title = getComputedStyle(document.querySelector('.hero h1'));
		const orbit = getComputedStyle(document.querySelector('.hero'), '::before');
		const card = getComputedStyle(document.querySelector('.form-card'));
		const button = getComputedStyle(document.querySelector('#go-deep-btn'));
		const logo = document.querySelector('.brandbar img');
		return {
			bodyBackground: body.backgroundColor,
			bodyColor: body.color,
			titleFontSize: Number.parseFloat(title.fontSize),
			stepCount: document.querySelectorAll('.hero-steps').length,
			caveatCardCount: document.querySelectorAll('.hero-proof-grid, .proof-card').length,
			heroGrid: hero.backgroundImage,
			orbitBorder: orbit.borderTopStyle,
			cardBackground: card.backgroundColor,
			cardRadius: card.borderRadius,
			buttonBackground: button.backgroundColor,
			buttonHeight: button.minHeight,
			logoPath: new URL(logo.src).pathname,
			logoWidth: getComputedStyle(logo).width
		};
	});

	const { titleFontSize, ...appTokens } = appDesign;
	expect(titleFontSize).toBeGreaterThanOrEqual(24);
	expect(titleFontSize).toBeLessThanOrEqual(32);
	expect(appTokens).toEqual({
		bodyBackground: 'rgb(14, 27, 50)',
		bodyColor: 'rgb(247, 251, 255)',
		stepCount: 0,
		caveatCardCount: 0,
		heroGrid: expect.stringContaining('linear-gradient'),
		orbitBorder: 'dashed',
		cardBackground: 'rgb(20, 38, 62)',
		cardRadius: '8px',
		buttonBackground: 'rgb(13, 113, 147)',
		buttonHeight: '44px',
		logoPath: '/assets/toppy-logo.png',
		logoWidth: '30px'
	});
	await page.locator('#domain').focus();
	expect(await page.locator('#domain').evaluate((element) => getComputedStyle(element).outlineColor)).toBe('rgb(151, 202, 237)');

	await page.goto('/offline.html');
	await expect(page.locator('.page-shell .hero')).toBeVisible();
	await expect(page.locator('.hero-actions .btn')).toHaveCount(2);
	const offlineCardBackground = await page.locator('.page-shell .hero').evaluate((element) => getComputedStyle(element).backgroundColor);
	expect(offlineCardBackground).toBe('rgb(24, 43, 69)');
});

test('authentication graph fits the Toppy shell with visible relationships', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/authentication_graph.html?lang=en');
	await page.locator('#authentication-graph-example').click();
	const graphInput = JSON.parse(await page.locator('#authentication-graph-input').inputValue());
	graphInput.ruaReports = [{
		policy: { domain: 'example.com' },
		records: [{
			sourceIp: '198.51.100.10',
			dkim: { results: [{ domain: 'mailer.example.net' }] },
			spf: { results: [{ domain: 'bounce.example.net' }] }
		}]
	}];
	await page.locator('#authentication-graph-input').fill(JSON.stringify(graphInput));
	await page.locator('#authentication-graph-submit').click();
	await expect(page.locator('.authentication-graph-svg')).toBeVisible();

	const graphDesign = await page.evaluate(() => {
		const result = document.querySelector('.graph-result');
		const svg = document.querySelector('.authentication-graph-svg');
		const style = getComputedStyle(result);
		const contentWidth = result.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
		const parseRgb = (value) => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
		const luminance = (value) => {
			const channels = parseRgb(value).map((channel) => {
				const normalized = channel / 255;
				return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
			});
			return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
		};
		const contrast = (first, second) => {
			const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
			return (lighter + 0.05) / (darker + 0.05);
		};
		const background = style.backgroundColor;
		const edges = ['declared', 'observed', 'unresolved'].map((state) => {
			const edge = document.querySelector(`.graph-edge-${state}`);
			return { state, contrast: edge ? contrast(getComputedStyle(edge).stroke, background) : 0 };
		});
		return {
			contentWidth,
			svgWidth: svg.getBoundingClientRect().width,
			pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
			edges
		};
	});

	expect(graphDesign.svgWidth).toBeLessThanOrEqual(graphDesign.contentWidth + 1);
	expect(graphDesign.pageOverflow).toBeLessThanOrEqual(1);
	for (const edge of graphDesign.edges) {
		expect(edge.contrast, `${edge.state} edge contrast`).toBeGreaterThanOrEqual(3);
	}
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

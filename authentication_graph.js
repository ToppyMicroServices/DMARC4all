import { MAX_GRAPH_INPUTS, buildAuthenticationGraph } from './src/authentication-graph.js?v=21';
import { AUTHENTICATION_GRAPH_MESSAGES, authenticationGraphErrorKey } from './src/authentication-graph-i18n.js?v=21';
import { LANG_STORAGE_KEY } from './src/i18n.js?v=21';
import { registerPwa } from './src/pwa.js?v=21';
import { createToolI18n } from './src/tool-i18n.js?v=21';

const SVG_NS = 'http://www.w3.org/2000/svg';
const form = document.getElementById('authentication-graph-form');
const input = document.getElementById('authentication-graph-input');
const filesInput = document.getElementById('authentication-graph-files');
const fileName = document.getElementById('authentication-graph-file-name');
const example = document.getElementById('authentication-graph-example');
const result = document.getElementById('authentication-graph-result');
const submit = document.getElementById('authentication-graph-submit');
const MAX_GRAPH_INPUT_BYTES = 2 * 1024 * 1024;
const t = createToolI18n(AUTHENTICATION_GRAPH_MESSAGES);
const language = document.documentElement.lang;
let building = false;

registerPwa();

const description = document.getElementById('authentication-graph-description');
if (description) description.setAttribute('content', t('page.description'));

for (const button of document.querySelectorAll('[data-lang-choice]')) {
	const selected = button.getAttribute('data-lang-choice') === language;
	button.classList.toggle('active', selected);
	button.setAttribute('aria-pressed', String(selected));
	button.addEventListener('click', () => {
		const nextLanguage = button.getAttribute('data-lang-choice');
		try { localStorage.setItem(LANG_STORAGE_KEY, nextLanguage); } catch { /* storage can be unavailable */ }
		const url = new URL(location.href);
		url.searchParams.set('lang', nextLanguage);
		location.assign(url.href);
	});
}

for (const link of document.querySelectorAll('a[href]')) {
	const url = new URL(link.getAttribute('href'), location.href);
	if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol)) continue;
	url.searchParams.set('lang', language);
	link.setAttribute('href', url.href);
}

const exampleInput = {
	domain: 'example.com',
	spfRecords: [
		{ domain: 'example.com', record: 'v=spf1 include:_spf.example.net ip4:192.0.2.0/24 -all' },
		{ domain: '_spf.example.net', record: 'v=spf1 ip4:198.51.100.0/24 -all' }
	],
	dkimSelectors: [
		{ domain: 'example.com', selector: 'selector1', status: 'present' },
		{ domain: 'example.com', selector: 'retired', status: 'missing' }
	],
	ruaReports: []
};

function element(name, text = '', className = '') {
	const node = document.createElement(name);
	if (className) node.className = className;
	if (text) node.textContent = text;
	return node;
}

function svgElement(name, attributes = {}) {
	const node = document.createElementNS(SVG_NS, name);
	for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
	return node;
}

function localizedValue(category, value) {
	const key = `${category}.${String(value || '')}`;
	const translated = t(key);
	return translated === key ? String(value || '') : translated;
}

function localizedValues(category, values) {
	return values.map((value) => localizedValue(category, value)).join(', ');
}

function coordinates(graph) {
	const columns = { declared: 170, mixed: 520, observed: 850, unresolved: 1130 };
	const counts = { declared: 0, mixed: 0, observed: 0, unresolved: 0 };
	const positions = new Map();
	for (const node of graph.nodes) {
		if (node.id === `domain:${graph.domain}`) {
			positions.set(node.id, { x: 600, y: 54, column: 'mixed' });
			continue;
		}
		const column = node.states.length > 1 ? 'mixed' : node.states[0] === 'observed' ? 'observed' : node.states[0] === 'unresolved' ? 'unresolved' : 'declared';
		positions.set(node.id, { x: columns[column], y: 142 + counts[column] * 88, column });
		counts[column] += 1;
	}
	return { positions, height: Math.max(320, 210 + Math.max(...Object.values(counts)) * 88) };
}

function renderSvg(graph) {
	const { positions, height } = coordinates(graph);
	const svg = svgElement('svg', { viewBox: `0 0 1300 ${height}`, role: 'img', 'aria-label': t('graph.svg', { domain: graph.domain }), class: 'authentication-graph-svg' });
	for (const edge of graph.edges) {
		const from = positions.get(edge.from);
		const to = positions.get(edge.to);
		if (!from || !to) continue;
		svg.append(svgElement('line', { x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: `graph-edge graph-edge-${edge.state}` }));
		const label = svgElement('text', { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - 5, class: 'graph-edge-label' });
		label.textContent = localizedValue('relation', edge.relation);
		svg.append(label);
	}
	for (const node of graph.nodes) {
		const point = positions.get(node.id);
		const group = svgElement('g', { class: `graph-node graph-node-${point.column}` });
		const title = svgElement('title');
		title.textContent = `${localizedValue('kind', node.kind)}: ${node.label}; ${localizedValues('state', node.states)}`;
		group.append(title);
		group.append(svgElement('rect', { x: point.x - 125, y: point.y - 28, width: 250, height: 56, rx: 8 }));
		const kind = svgElement('text', { x: point.x, y: point.y - 5, 'text-anchor': 'middle', class: 'graph-node-kind' });
		kind.textContent = localizedValue('kind', node.kind);
		const label = svgElement('text', { x: point.x, y: point.y + 15, 'text-anchor': 'middle', class: 'graph-node-label' });
		label.textContent = node.label.length > 38 ? `${node.label.slice(0, 35)}...` : node.label;
		group.append(kind, label);
		svg.append(group);
	}
	return svg;
}

function renderTable(graph) {
	const section = element('section', '', 'rua-analysis-section');
	section.append(element('h2', t('graph.tableTitle')));
	const table = element('table', '', 'graph-table');
	const caption = element('caption', t('graph.tableCaption', { domain: graph.domain }));
	table.append(caption);
	const head = element('thead');
	const headerRow = element('tr');
	for (const title of [t('graph.type'), t('graph.value'), t('graph.state'), t('graph.confidence'), t('graph.evidence')]) {
		const cell = element('th', title);
		cell.scope = 'col';
		headerRow.append(cell);
	}
	head.append(headerRow);
	table.append(head);
	const body = element('tbody');
	for (const row of graph.tableRows) {
		const tableRow = element('tr');
		const states = String(row.states || '').split(',').map((value) => value.trim()).filter(Boolean);
		for (const value of [localizedValue('kind', row.type), row.value, localizedValues('state', states), localizedValue('confidence', row.confidence), row.evidence || t('graph.notSupplied')]) tableRow.append(element('td', value));
		body.append(tableRow);
	}
	table.append(body);
	section.append(table);
	return section;
}

function renderRelationshipTable(graph) {
	const section = element('section', '', 'rua-analysis-section');
	section.append(element('h2', t('graph.relationshipsTitle')));
	const table = element('table', '', 'graph-table graph-relationship-table');
	table.append(element('caption', t('graph.relationshipsCaption', { domain: graph.domain })));
	const head = element('thead');
	const headerRow = element('tr');
	for (const title of [t('graph.source'), t('graph.relation'), t('graph.target'), t('graph.state'), t('graph.evidence')]) {
		const cell = element('th', title);
		cell.scope = 'col';
		headerRow.append(cell);
	}
	head.append(headerRow);
	table.append(head);
	const body = element('tbody');
	const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
	const endpoint = (id) => {
		const node = nodes.get(id);
		return node ? `${localizedValue('kind', node.kind)}: ${node.label}` : id;
	};
	for (const edge of graph.edges) {
		const row = element('tr');
		for (const value of [
			endpoint(edge.from),
			localizedValue('relation', edge.relation),
			endpoint(edge.to),
			localizedValue('state', edge.state),
			edge.evidence && edge.evidence.length ? edge.evidence.join(', ') : t('graph.notSupplied')
		]) row.append(element('td', value));
		body.append(row);
	}
	table.append(body);
	section.append(table);
	return section;
}

function renderGraph(graph) {
	result.replaceChildren();
	const legend = element('p', '', 'graph-legend');
	for (const state of Object.keys(graph.legend)) {
		legend.append(element('span', `${localizedValue('state', state)}: ${localizedValue('legend', state)}`, `graph-legend-${state}`));
	}
	result.append(legend, renderSvg(graph));
	if (graph.findings.length) {
		const findings = element('section', '', 'rua-analysis-section');
		findings.append(element('h2', t('graph.findings')));
		const list = element('ul', '', 'list');
		for (const finding of graph.findings) list.append(element('li', `${finding.code} (${localizedValue('severity', finding.severity)}) — ${finding.evidence.join(', ')}`));
		findings.append(list);
		result.append(findings);
	}
	result.append(renderTable(graph), renderRelationshipTable(graph));
}

function renderError(error) {
	result.replaceChildren();
	const panel = element('section', '', 'rua-analysis-error');
	const key = error && error.i18nKey || authenticationGraphErrorKey(error);
	const variables = error && error.i18nVariables || (key === 'graph.inputCount' ? { count: MAX_GRAPH_INPUTS } : {});
	panel.append(element('h2', t('graph.errorTitle')), element('p', t(key, variables)));
	result.append(panel);
}

if (example) example.addEventListener('click', () => { input.value = JSON.stringify(exampleInput, null, 2); });
if (filesInput) {
	filesInput.addEventListener('change', () => {
		const files = [...(filesInput.files || [])];
		fileName.textContent = files.length ? files.map((file) => file.name).join(', ') : t('graph.none');
	});
}

async function selectedPayloads() {
	const files = [...(filesInput && filesInput.files || [])];
	const localizedError = (key, variables = {}, ErrorType = TypeError) => {
		const error = new ErrorType(t(key, variables));
		error.i18nKey = key;
		error.i18nVariables = variables;
		return error;
	};
	if (files.length > MAX_GRAPH_INPUTS) throw localizedError('graph.selectLimit', { count: MAX_GRAPH_INPUTS }, RangeError);
	let totalBytes = new TextEncoder().encode(input.value).length;
	if (totalBytes > MAX_GRAPH_INPUT_BYTES) throw localizedError('graph.byteLimit', {}, RangeError);
	const payloads = [];
	const parseJson = (value, source) => {
		try {
			return JSON.parse(value);
		} catch (error) {
			if (error instanceof SyntaxError) throw localizedError('graph.invalidJson', { source });
			throw error;
		}
	};
	if (input.value.trim()) payloads.push(parseJson(input.value, t('page.input')));
	for (const file of files) {
		totalBytes += file.size;
		if (totalBytes > MAX_GRAPH_INPUT_BYTES) throw localizedError('graph.byteLimit', {}, RangeError);
		payloads.push(parseJson(await file.text(), file.name));
	}
	if (!payloads.length) throw localizedError('graph.noInput');
	return payloads;
}

if (form) form.addEventListener('submit', async (event) => {
	event.preventDefault();
	if (building) return;
	building = true;
	form.setAttribute('aria-busy', 'true');
	result.setAttribute('aria-busy', 'true');
	if (submit) {
		submit.disabled = true;
		submit.textContent = t('page.building');
	}
	try {
		renderGraph(buildAuthenticationGraph(await selectedPayloads()));
	} catch (error) {
		renderError(error);
	} finally {
		building = false;
		form.removeAttribute('aria-busy');
		result.removeAttribute('aria-busy');
		if (submit) {
			submit.disabled = false;
			submit.textContent = t('page.build');
		}
	}
});

import { MAX_GRAPH_INPUTS, buildAuthenticationGraph } from './src/authentication-graph.js';
import { AUTHENTICATION_GRAPH_MESSAGES } from './src/authentication-graph-i18n.js';
import { registerPwa } from './src/pwa.js';
import { createToolI18n } from './src/tool-i18n.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const form = document.getElementById('authentication-graph-form');
const input = document.getElementById('authentication-graph-input');
const filesInput = document.getElementById('authentication-graph-files');
const fileName = document.getElementById('authentication-graph-file-name');
const example = document.getElementById('authentication-graph-example');
const result = document.getElementById('authentication-graph-result');
const MAX_GRAPH_INPUT_BYTES = 2 * 1024 * 1024;
const t = createToolI18n(AUTHENTICATION_GRAPH_MESSAGES);

registerPwa();

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
		label.textContent = edge.relation;
		svg.append(label);
	}
	for (const node of graph.nodes) {
		const point = positions.get(node.id);
		const group = svgElement('g', { class: `graph-node graph-node-${point.column}` });
		const title = svgElement('title');
		title.textContent = `${node.kind}: ${node.label}; ${node.states.join(', ')}`;
		group.append(title);
		group.append(svgElement('rect', { x: point.x - 125, y: point.y - 28, width: 250, height: 56, rx: 8 }));
		const kind = svgElement('text', { x: point.x, y: point.y - 5, 'text-anchor': 'middle', class: 'graph-node-kind' });
		kind.textContent = node.kind;
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
		for (const value of [row.type, row.value, row.states, row.confidence, row.evidence || t('graph.notSupplied')]) tableRow.append(element('td', value));
		body.append(tableRow);
	}
	table.append(body);
	section.append(table);
	return section;
}

function renderGraph(graph) {
	result.replaceChildren();
	const legend = element('p', '', 'graph-legend');
	for (const [state, description] of Object.entries(graph.legend)) legend.append(element('span', `${state}: ${description}`, `graph-legend-${state}`));
	result.append(legend, renderSvg(graph));
	if (graph.findings.length) {
		const findings = element('section', '', 'rua-analysis-section');
		findings.append(element('h2', t('graph.findings')));
		const list = element('ul', '', 'list');
		for (const finding of graph.findings) list.append(element('li', `${finding.code} (${finding.severity}) — ${finding.evidence.join(', ')}`));
		findings.append(list);
		result.append(findings);
	}
	result.append(renderTable(graph));
}

function renderError(error) {
	result.replaceChildren();
	const panel = element('section', '', 'rua-analysis-error');
	panel.append(element('h2', t('graph.errorTitle')), element('p', String(error && error.message || error)));
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
	if (files.length > MAX_GRAPH_INPUTS) throw new RangeError(t('graph.selectLimit', { count: MAX_GRAPH_INPUTS }));
	let totalBytes = new TextEncoder().encode(input.value).length;
	if (totalBytes > MAX_GRAPH_INPUT_BYTES) throw new RangeError(t('graph.byteLimit'));
	const payloads = [];
	if (input.value.trim()) payloads.push(JSON.parse(input.value));
	for (const file of files) {
		totalBytes += file.size;
		if (totalBytes > MAX_GRAPH_INPUT_BYTES) throw new RangeError(t('graph.byteLimit'));
		payloads.push(JSON.parse(await file.text()));
	}
	if (!payloads.length) throw new TypeError(t('graph.noInput'));
	return payloads;
}

if (form) form.addEventListener('submit', async (event) => {
	event.preventDefault();
	try {
		renderGraph(buildAuthenticationGraph(await selectedPayloads()));
	} catch (error) {
		renderError(error);
	}
});

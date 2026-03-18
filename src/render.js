/*
 * Copyright 2026 ToppyMicroServices OÜ
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export function createRenderer(deps) {
	const {
		esc,
		getDmarcRuaExampleHtml,
		isJa,
		report,
		sanitizeUrl,
		setSafeInnerHTML,
		statusText,
		t,
		tr
	} = deps;

	function mkDetail(state, reason, advice, options = {}) {
		return {
			state,
			reason,
			advice,
			stateHtml: options.stateHtml,
			reasonHtml: options.reasonHtml,
			adviceHtml: options.adviceHtml
		};
	}

	function detailJaOr(jaDetail, fallbackDetail) {
		return isJa() ? jaDetail : fallbackDetail;
	}

	function buildFindingDetail(detail, options = {}) {
		const allowHtml = !!options.allowHtml;
		const whyLabel = esc(t('label.why'));
		const stateLabel = esc(t('label.state'));
		const adviceLabel = esc(t('label.advice'));
		if (!detail || typeof detail === 'string') {
			const content = allowHtml ? String(detail || '') : esc(detail || '');
			return `<div class="muted"><strong>${whyLabel}:</strong> ${content}</div>`;
		}
		const lines = [];
		const pushLine = (label, value, isHtml) => {
			if (!value) return;
			lines.push(`<div><strong>${label}:</strong> ${isHtml ? value : esc(value)}</div>`);
		};
		if (detail.stateHtml) pushLine(stateLabel, detail.stateHtml, true);
		else pushLine(stateLabel, detail.state, false);
		if (detail.reasonHtml) pushLine(whyLabel, detail.reasonHtml, true);
		else pushLine(whyLabel, detail.reason, false);
		if (detail.adviceHtml) pushLine(adviceLabel, detail.adviceHtml, true);
		else pushLine(adviceLabel, detail.advice, false);
		if (!lines.length) return `<div class="muted"><strong>${whyLabel}:</strong> </div>`;
		return `<div class="muted">${lines.join('')}</div>`;
	}

	function mkFinding(level, title, detail, evidence) {
		const cls = level === 'high' ? 'finding high' : level === 'med' ? 'finding med' : 'finding low';
		const ev = evidence ? `<div class="mini-title">${esc(t('label.evidence'))}</div><div class="mono">${esc(evidence)}</div>` : '';
		const confidence = evidence ? 'high' : 'low';
		const confLabel = esc(t('label.confidence'));
		const confText = esc(t(`confidence.${confidence}`));
		const detailHtml = buildFindingDetail(detail, { allowHtml: false });
		return `
			<div class="${cls}">
				<div><strong>${esc(title)}</strong></div>
				${detailHtml}
				<div class="tiny muted"><strong>${confLabel}:</strong> ${confText}</div>
				${ev}
			</div>
		`;
	}

	function mkFindingRich(level, title, detail, evidence, showConfidence = true) {
		const cls = level === 'high' ? 'finding high' : level === 'med' ? 'finding med' : 'finding low';
		const ev = evidence ? `<div class="mini-title">${esc(t('label.evidence'))}</div><div class="mono">${esc(evidence)}</div>` : '';
		const confidence = evidence ? 'high' : 'low';
		const confLabel = esc(t('label.confidence'));
		const confText = esc(t(`confidence.${confidence}`));
		const detailHtml = buildFindingDetail(detail, { allowHtml: true });
		return `
			<div class="${cls}">
				<div><strong>${esc(title)}</strong></div>
				${detailHtml}
				${showConfidence ? `<div class="tiny muted"><strong>${confLabel}:</strong> ${confText}</div>` : ''}
				${ev}
			</div>
		`;
	}

	function hasIssueFinding(html) {
		return /finding\s+(high|med)/.test(String(html || ''));
	}

	function prependOkFinding(bodyHtml, ok) {
		if (!ok) return bodyHtml;
		const okTitle = tr('設定OK', 'Configured');
		const okDetail = tr('適切に設定されています', 'Properly configured.');
		return mkFinding('low', okTitle, okDetail, '') + bodyHtml;
	}

	function formatTtl(ttl) {
		if (Number.isFinite(ttl) && ttl >= 0) return `${ttl}s`;
		return t('report.repro.ttlUnknown');
	}

	function exportFileBase(domain) {
		const safeDomain = String(domain || 'report').replace(/[^a-z0-9._-]+/gi, '_');
		const stamp = new Date().toISOString().replace(/[:.]/g, '-');
		return `${safeDomain}_${stamp}`;
	}

	function downloadText(filename, text, mime) {
		const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = filename;
		document.body.appendChild(anchor);
		anchor.click();
		requestAnimationFrame(() => {
			URL.revokeObjectURL(url);
			anchor.remove();
		});
	}

	function buildJsonExport(results) {
		return JSON.stringify(results, null, 2);
	}

	function buildMarkdownReport(results) {
		const meta = results && results.meta ? results.meta : {};
		const timestamp = meta.timestamp || new Date().toISOString();
		const resolver = meta.resolver || t('report.repro.resolverUnknown');
		const overall = (results.score && typeof results.score.overall === 'number') ? results.score.overall : '';

		const top = (results.priority && Array.isArray(results.priority)) ? results.priority : [];
		const topSorted = top
			.slice(0)
			.sort((a, b) => {
				const weight = { high: 3, med: 2, low: 1 };
				return (weight[b.level] || 0) - (weight[a.level] || 0);
			})
			.slice(0, 3);
		const topLines = topSorted.length
			? topSorted.map((item) => `- ${item.title}: ${item.action}`)
			: [`- ${t('label.noneParen')}`];

		const sections = [
			{ name: 'DMARC', status: (results.dmarc && results.dmarc.record) ? statusText('configured') : statusText('missing') },
			{ name: 'SPF', status: (results.spf && results.spf.records && results.spf.records.length) ? `TXT ${results.spf.records.length}` : statusText('missing') },
			{ name: 'DKIM', status: (results.dkim && results.dkim.selectors && results.dkim.selectors.length) ? t('status.candidates').replace('{n}', String(results.dkim.selectors.length)) : statusText('unverified') },
			{ name: 'BIMI', status: (results.bimi && results.bimi.record) ? statusText('configured') : statusText('optionalMissing') },
			{ name: 'MX', status: (results.mx && results.mx.records && results.mx.records.length) ? `MX ${results.mx.records.length}` : statusText('none') },
			{ name: 'MTA-STS / TLS-RPT', status: (results.mta_sts && results.mta_sts.record && results.mta_sts.tlsrpt) ? statusText('configured') : statusText('missing') }
		];
		const sectionLines = sections.map((section) => `- ${section.name}: ${section.status}`);

		const records = (meta.records && Array.isArray(meta.records)) ? meta.records : [];
		const recordLines = records.length
			? records.map((record) => {
				const ttl = formatTtl(record.ttl);
				const header = `- ${record.name} ${record.type} (${t('report.repro.ttl')}: ${ttl})`;
				const value = record.value ? `\n  \`\`\`\n  ${record.value}\n  \`\`\`` : '';
				return `${header}${value}`;
			})
			: [`- ${t('report.repro.none')}`];

		return [
			`# ${t('report.export.md.title')}`,
			'',
			`- ${t('form.domain')}: ${results.domain}`,
			`- ${t('report.repro.time')}: ${timestamp}`,
			`- ${t('report.repro.resolver')}: ${resolver}`,
			`- ${t('report.overallPostureTitle')}: ${overall}`,
			'',
			`## ${t('report.top3Title')}`,
			...topLines,
			'',
			`## ${t('report.export.sectionStatus')}`,
			...sectionLines,
			'',
			`## ${t('report.repro.records')}`,
			...recordLines
		].join('\n');
	}

	function wireExportButtons(results) {
		if (!report) return;
		const jsonBtn = report.querySelector('.export-json');
		const mdBtn = report.querySelector('.export-md');
		const base = exportFileBase(results.domain);
		if (jsonBtn) {
			jsonBtn.addEventListener('click', () => {
				downloadText(`${base}.json`, buildJsonExport(results), 'application/json;charset=utf-8');
			});
		}
		if (mdBtn) {
			mdBtn.addEventListener('click', () => {
				downloadText(`${base}.md`, buildMarkdownReport(results), 'text/markdown;charset=utf-8');
			});
		}
	}

	function mkSection(title, sectionStatus, bodyHtml) {
		return `
			<div class="card p-16">
				<div class="flex-space-between">
					<div class="mini-title m-0">${esc(title)}</div>
					<span class="status">${esc(sectionStatus)}</span>
				</div>
				<div class="report mt-10">${bodyHtml}</div>
			</div>
		`;
	}

	function classifyScore(score) {
		if (score >= 85) return 'good';
		if (score >= 60) return 'warn';
		return 'bad';
	}

	function ensureDnsblContainer(reportEl) {
		const id = 'toppy-dnsbl-section';
		let el = document.getElementById(id);
		if (!el && reportEl) {
			el = document.createElement('div');
			el.id = id;
			el.className = 'card';
			reportEl.appendChild(el);
		}
		return el;
	}

	function renderDnsbl(el, dnsbl) {
		if (!el) return;
		const dnsblTitle = t('dnsbl.title');
		if (!dnsbl || !dnsbl.ips || dnsbl.ips.length === 0) {
			setSafeInnerHTML(el, `
				<div class="mini-title">${esc(dnsblTitle)}</div>
				<div class="muted">${esc(t('dnsbl.noCandidateIps'))}</div>
			`);
			return;
		}

		const rows = dnsbl.results.map((result) => {
			const listed = result.perZone.filter((zone) => zone.listed === true);
			const unknown = result.perZone.filter((zone) => zone.listed === null);
			let cls = 'low';
			let summary = tr('未掲載の可能性が高い', 'Likely not listed');
			if (listed.length > 0) {
				cls = 'high';
				summary = isJa()
					? `掲載の可能性あり（${listed.map((item) => esc(item.zone)).join(', ')}）`
					: `Possibly listed (${listed.map((item) => esc(item.zone)).join(', ')})`;
			} else if (unknown.length > 0) {
				cls = 'med';
				summary = isJa()
					? `一部照会不可（${unknown.map((item) => esc(item.zone)).join(', ')}）`
					: `Some lookups failed (${unknown.map((item) => esc(item.zone)).join(', ')})`;
			}

			const detail = result.perZone.map((zone) => {
				if (zone.listed === true) return `<li><strong>${esc(zone.zone)}</strong>: LISTED (${esc(zone.detail || 'A')})</li>`;
				if (zone.listed === false) return `<li><strong>${esc(zone.zone)}</strong>: not listed</li>`;
				return `<li><strong>${esc(zone.zone)}</strong>: unknown (${esc(String(zone.detail || ''))})</li>`;
			}).join('');

			const ptrLine = (result.ptrs && result.ptrs.length)
				? `<div class="tiny muted">PTR: ${esc(result.ptrs.join(', '))}</div>`
				: '';

			return `
				<div class="finding ${cls}">
					<div class="mini-title">IP: <span class="mono mono-inline">${esc(result.ip)}</span></div>
					<div class="muted">${summary}</div>
					${ptrLine}
					<ul class="list mt-8">${detail}</ul>
				</div>
			`;
		}).join('');

		setSafeInnerHTML(el, `
			<div class="mini-title">${esc(dnsblTitle)}</div>
			<div class="muted">${esc(t('dnsbl.about'))}</div>
			${rows}
		`);
	}

	function renderResults(results) {
		const err = (results.errors && results.errors.length)
			? `<div class="finding med">
					 <div><strong>${esc(t('label.note'))}</strong></div>
					 <div class="muted">${esc(t('report.someLookupsFailedNote'))}</div>
				 </div>`
			: '';

		const dnsHostLinks = (results.dnsHosting && Array.isArray(results.dnsHosting.links) && results.dnsHosting.links.length)
			? (() => {
				const items = results.dnsHosting.links.map((item) => {
					const safe = sanitizeUrl(item && item.url);
					const label = esc(item && item.label);
					if (!safe) return `<li>${label}</li>`;
					return `<li><a href="${esc(safe)}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
				}).join('');
				return `<div class="mini-title">${esc(t('report.officialDocs'))}</div><ul class="list">${items}</ul>`;
			})()
			: '';

		const dnsHostBodyRaw = ((results.dnsHosting && results.dnsHosting.findings) ? results.dnsHosting.findings.join('') : '') + dnsHostLinks;
		const registrarBodyRaw = ((results.registrar && results.registrar.findings) ? results.registrar.findings.join('') : '');
		const dmarcBodyRaw = ((results.dmarc && results.dmarc.findings) ? results.dmarc.findings.join('') : '') + getDmarcRuaExampleHtml();
		const spfBodyRaw = ((results.spf && results.spf.findings) ? results.spf.findings.join('') : '');
		const dkimCnameNote = (results.dkim && results.dkim.usesCname)
			? `<div class="tiny muted">${esc(t('dkim.cnameDelegationOtherToolsNote'))}</div>`
			: '';
		const dkimBodyRaw = (((results.dkim && results.dkim.findings) ? results.dkim.findings.join('') : '') + dkimCnameNote);
		const bimiBodyRaw = ((results.bimi && results.bimi.findings) ? results.bimi.findings.join('') : '');
		const mxBodyRaw = ((results.mx && results.mx.findings) ? results.mx.findings.join('') : '');
		const mtaBodyRaw = ((results.mta_sts && results.mta_sts.findings) ? results.mta_sts.findings.join('') : '');
		const caaBodyRaw = ((results.caa && results.caa.findings) ? results.caa.findings.join('') : '');
		const dnssecBodyRaw = ((results.dnssec && results.dnssec.findings) ? results.dnssec.findings.join('') : '');
		const webBodyRaw = ((results.web && results.web.findings) ? results.web.findings.join('') : '');
		const subBodyRaw = ((results.subdomains && results.subdomains.findings) ? results.subdomains.findings.join('') : '');

		const dmarcOk = !!(results.dmarc && results.dmarc.record) && !hasIssueFinding(dmarcBodyRaw);
		const spfOk = !!(results.spf && results.spf.records && results.spf.records.length === 1) && !hasIssueFinding(spfBodyRaw);
		const dkimOk = !!(results.dkim && Array.isArray(results.dkim.confirmedSelectors) && results.dkim.confirmedSelectors.length) && !hasIssueFinding(dkimBodyRaw);
		const bimiOk = !!(results.bimi && results.bimi.record) && !hasIssueFinding(bimiBodyRaw);
		const mxOk = !!(results.mx && results.mx.records && results.mx.records.length) && !hasIssueFinding(mxBodyRaw);
		const mtaOk = !!(results.mta_sts && results.mta_sts.record && results.mta_sts.tlsrpt) && !hasIssueFinding(mtaBodyRaw);
		const dnsHostOk = !!(results.dnsHosting && results.dnsHosting.provider) && !hasIssueFinding(dnsHostBodyRaw);
		const registrarOk = !!(results.registrar && (results.registrar.registrar || (results.registrar.nameservers && results.registrar.nameservers.length))) && !hasIssueFinding(registrarBodyRaw);
		const caaOk = !!(results.caa && results.caa.records && results.caa.records.length) && !hasIssueFinding(caaBodyRaw);
		const dnssecOk = !!(results.dnssec && results.dnssec.ds && results.dnssec.ds.length) && !hasIssueFinding(dnssecBodyRaw);
		const webOk = !!(results.web && Array.isArray(results.web.checks) && results.web.checks.length && results.web.checks.every((item) => item && item.ok)) && !hasIssueFinding(webBodyRaw);
		const subOk = !!(results.subdomains && results.subdomains.enabled) && !hasIssueFinding(subBodyRaw);

		const dnsHostBody = prependOkFinding(dnsHostBodyRaw, dnsHostOk);
		const registrarBody = prependOkFinding(registrarBodyRaw, registrarOk);
		const dmarcBody = prependOkFinding(dmarcBodyRaw, dmarcOk);
		const spfBody = prependOkFinding(spfBodyRaw, spfOk);
		const dkimBody = prependOkFinding(dkimBodyRaw, dkimOk);
		const bimiBody = prependOkFinding(bimiBodyRaw, bimiOk);
		const mxBody = prependOkFinding(mxBodyRaw, mxOk);
		const mtaBody = prependOkFinding(mtaBodyRaw, mtaOk);
		const caaBody = prependOkFinding(caaBodyRaw, caaOk);
		const dnssecBody = prependOkFinding(dnssecBodyRaw, dnssecOk);
		const webBody = prependOkFinding(webBodyRaw, webOk);
		const subBody = prependOkFinding(subBodyRaw, subOk);

		const dnsHostStatus = (results.dnsHosting && results.dnsHosting.provider)
			? `${t('status.estimated')}: ${results.dnsHosting.provider}`
			: t('status.unknown');
		const registrarStatus = (results.registrar && (results.registrar.registrar || (results.registrar.nameservers && results.registrar.nameservers.length)))
			? t('status.ok')
			: t('status.unavailableUnknown');
		const mtaStatus = (results.mta_sts && results.mta_sts.record && results.mta_sts.tlsrpt)
			? statusText('configured')
			: (results.mta_sts && results.mta_sts.record)
				? statusText('partial')
				: statusText('missing');

		const overall = (results.score && typeof results.score.overall === 'number') ? results.score.overall : 0;
		const scoreCls = classifyScore(overall);
		const chips = (results.score && Array.isArray(results.score.chips)) ? results.score.chips : [];
		const chipHtml = chips.slice(0, 10).map((chip) => `<span class="score-chip">${esc(chip)}</span>`).join('');

		const top = (results.priority && Array.isArray(results.priority)) ? results.priority : [];
		const topSorted = top
			.slice(0)
			.sort((a, b) => {
				const weight = { high: 3, med: 2, low: 1 };
				return (weight[b.level] || 0) - (weight[a.level] || 0);
			})
			.slice(0, 3);
		const topHtml = topSorted.length
			? `<div class="card p-16">
				<div class="mini-title m-0">${esc(t('report.top3Title'))}</div>
				<ul class="list mt-10">
					${topSorted.map((item) => `<li><strong>${esc(item.title)}</strong><div class="muted">${esc(item.action)}</div></li>`).join('')}
				</ul>
			</div>`
			: '';

		const meta = results.meta || {};
		const metaTimestamp = meta.timestamp || '';
		const metaResolver = meta.resolver || t('report.repro.resolverUnknown');
		const metaRecords = Array.isArray(meta.records) ? meta.records : [];
		const recordLines = metaRecords.map((record) => {
			const ttl = formatTtl(record.ttl);
			const value = record.value ? `\n${record.value}` : '';
			return `${record.name} ${record.type} ttl=${ttl}${value}`;
		});
		const recordHtml = recordLines.length
			? `<div class="mono tiny">${esc(recordLines.join('\n\n'))}</div>`
			: `<div class="muted">${esc(t('report.repro.none'))}</div>`;
		const reproHtml = `
			<div class="card p-16">
				<div class="mini-title m-0">${esc(t('report.repro.title'))}</div>
				<div class="muted">${esc(t('report.repro.time'))}: <span class="mono mono-inline">${esc(metaTimestamp || t('label.noneParen'))}</span></div>
				<div class="muted">${esc(t('report.repro.resolver'))}: <span class="mono mono-inline">${esc(metaResolver || t('label.noneParen'))}</span></div>
				<div class="mini-title mt-10">${esc(t('report.repro.records'))}</div>
				${recordHtml}
				<div class="export-actions">
					<button type="button" class="btn-ghost export-json">${esc(t('report.export.json'))}</button>
					<button type="button" class="btn-ghost export-md">${esc(t('report.export.md'))}</button>
				</div>
				<div class="tiny muted">${esc(t('report.export.note'))}</div>
			</div>
		`;

		setSafeInnerHTML(report, `
			<div class="mini-title m-0-0-8">${esc(t('report.resultsTitle'))} <span class="status">${esc(results.domain)}</span></div>
			<div class="score-banner">
				<div class="score-left">
					<div class="score-title">${esc(t('report.overallPostureTitle'))}</div>
					<div class="score-sub">${esc(t('report.scoreSub'))}</div>
				</div>
				<div class="score-number ${esc(scoreCls)}">${esc(overall)}</div>
			</div>
			<div class="score-breakdown">${chipHtml}</div>
			${topHtml}
			${err}
			${reproHtml}
			<div class="grid two mt-12">
				${mkSection('DMARC', results.dmarc && results.dmarc.record ? statusText('configured') : statusText('missing'), dmarcBody)}
				${mkSection('SPF', (results.spf && results.spf.records && results.spf.records.length) ? `TXT ${results.spf.records.length}` : statusText('missing'), spfBody)}
				${mkSection(
					'DKIM',
					(results.dkim && Array.isArray(results.dkim.selectors) && results.dkim.selectors.length)
						? t('status.candidates').replace('{n}', String(results.dkim.selectors.length))
						: statusText('unverified'),
					dkimBody
				)}
				${mkSection('BIMI', (results.bimi && results.bimi.record) ? statusText('configured') : statusText('optionalMissing'), bimiBody)}
				${mkSection('MX', (results.mx && results.mx.records && results.mx.records.length) ? `MX ${results.mx.records.length}` : statusText('none'), mxBody)}
				${mkSection('MTA-STS / TLS-RPT', mtaStatus, mtaBody)}
				${mkSection(t('section.dnsHosting'), dnsHostStatus, dnsHostBody)}
				${mkSection(t('section.registrar'), registrarStatus, registrarBody)}
				${mkSection('CAA', (results.caa && results.caa.records && results.caa.records.length) ? statusText('configured') : statusText('optionalNone'), caaBody)}
				${mkSection('DNSSEC', (results.dnssec && results.dnssec.ds && results.dnssec.ds.length) ? statusText('likelyEnabled') : statusText('optionalMissing'), dnssecBody)}
				${mkSection(t('section.httpsReference'), statusText('lightcheck'), webBody)}
				${mkSection(t('section.subdomainOptional'), (results.subdomains && results.subdomains.enabled) ? statusText('enabled') : statusText('disabled'), subBody)}
			</div>
			<p class="footnote">${esc(t('report.publicDnsOnlyFootnote'))}</p>
		`);

		wireExportButtons(results);
	}

	return {
		detailJaOr,
		ensureDnsblContainer,
		mkDetail,
		mkFinding,
		mkFindingRich,
		renderDnsbl,
		renderResults
	};
}

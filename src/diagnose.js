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

import {
	analyzeCaaRecords,
	analyzeSpf,
	approxByteLength,
	buildSpfExpansion,
	checkBimiSvgRequirements,
	computeOverallScore,
	detectDnsHostingProviderFromNS,
	detectMailProvider,
	dkimLookupHints,
	extractA,
	extractAAAA,
	extractCAA,
	extractCNAME,
	extractDS,
	extractDNSKEY,
	extractMX,
	extractNS,
	extractTXTRecords,
	firstRecordStartingWith,
	firstTxtRecordStartingWith,
	formatCnameChain,
	fetchHeadCors,
	fetchTextCors,
	longestTxtSegment,
	looksLikeSvgUrl,
	parseBimiTags,
	parseDkimKeyBits,
	parseDmarcTags,
	parseTagValue,
	parseSvgDimensions,
	probeHttps,
	probeImage,
	probeUrlNoCors,
	rdapExtractRegistrar,
	rdapLookupDomain,
	resolveCnameChain,
	spfEstimateLookupRisk,
	spfHasAllQualifier,
	spfIsIpOnly
} from './diagnostics.js';
import { esc } from './safe-html.js';

export function createDiagnosisRunner(deps) {
	const {
		ENTERPRISE_MODE,
		DKIM_SELECTOR_CANDIDATES,
		detailJaOr,
		dohQuery,
		getActiveResolverLabel,
		isJa,
		mkDetail,
		mkFinding,
		mkFindingRich,
		sanitizeUrl,
		t,
		tr,
		trf
	} = deps;

	return async function runDiagnosis(domain, opts = {}) {
		const buildTxtFixRecord = (name, value, ttl = 3600) => `${name}. ${ttl} IN TXT "${value.replace(/"/g, '\\"')}"`;
		const dmarcTagsToRecord = (tags) => {
			const preferred = ['v', 'p', 'sp', 'pct', 'adkim', 'aspf', 'fo', 'ri', 'rua', 'ruf'];
			const entries = Object.entries(tags || {})
				.filter(([, value]) => String(value || '').trim() !== '');
			const ordered = [];
			for (const key of preferred) {
				const hit = entries.find(([entryKey]) => entryKey === key);
				if (hit) ordered.push(hit);
			}
			for (const entry of entries) {
				if (!preferred.includes(entry[0])) ordered.push(entry);
			}
			return ordered.map(([key, value]) => `${key}=${String(value).trim()}`).join('; ');
		};
		const spfDraftFromRecords = (records = []) => {
			const tokens = [];
			const seen = new Set();
			for (const record of records) {
				const rawTokens = String(record || '').trim().split(/\s+/);
				for (const token of rawTokens) {
					if (!token || /^v=spf1$/i.test(token)) continue;
					if (/^[~?+\-]all$/i.test(token)) continue;
					const normalized = token.toLowerCase();
					if (seen.has(normalized)) continue;
					seen.add(normalized);
					tokens.push(token);
				}
			}
			return `v=spf1 ${tokens.join(' ')} ~all`.replace(/\s+/g, ' ').trim();
		};
		const remediation = [];
		const pushFixup = (item) => {
			if (!item) return;
			remediation.push(item);
		};
		const results = {
			domain,
			meta: {
				timestamp: new Date().toISOString(),
				resolver: getActiveResolverLabel(),
				records: []
			},
			priority: [],
			fixups: [],
			mailProvider: { id: 'generic', name: 'Generic / custom mail stack', confidence: 'Low', reason: '', signals: [] },
			registrar: { registrar: '', registrarUrl: '', registrarIana: '', nameservers: [], rdapUrl: '', findings: [] },
			dnsHosting: { ns: [], provider: '', confidence: '', reason: '', links: [], findings: [] },
			subdomains: { enabled: false, found: [], findings: [] },
			dmarc: { record: '', findings: [] },
			spf: { records: [], findings: [] },
			dkim: { selectors: [], findings: [], usesCname: false },
			bimi: { name: '', record: '', l: '', a: '', findings: [] },
			mx: { records: [], findings: [] },
			mta_sts: { record: '', tlsrpt: '', findings: [] },
			caa: { records: [], findings: [] },
			dnssec: { ds: [], dnskey: [], findings: [] },
			web: { checks: [], findings: [] },
			score: { overall: null, spf: null, chips: [], spfChips: [] },
			errors: []
		};

		if (!ENTERPRISE_MODE) {
			try {
				const { url, json } = await rdapLookupDomain(domain);
				results.registrar.rdapUrl = url;
				const x = rdapExtractRegistrar(json);
				results.registrar.registrar = x.registrar;
				results.registrar.registrarUrl = x.registrarUrl;
				results.registrar.registrarIana = x.registrarIana;
				results.registrar.nameservers = x.nameservers;

				const lines = [];
				if (x.registrar) lines.push(`Registrar: ${x.registrar}`);
				if (x.registrarUrl) lines.push(`Registrar URL: ${x.registrarUrl}`);
				if (x.registrarIana) lines.push(`Registrar IANA: ${x.registrarIana}`);
				if (x.nameservers && x.nameservers.length) {
					for (const ns of x.nameservers.slice(0, 12)) lines.push(`Name Server: ${ns}`);
					if (x.nameservers.length > 12) lines.push(`Name Server: ... (+${x.nameservers.length - 12})`);
				}
				if (!lines.length) lines.push(tr('RDAPからレジストラ情報を抽出できなかった', 'Could not extract registrar info from RDAP'));

				results.registrar.findings.push(
					mkFinding(
						x.registrar ? 'low' : 'med',
						x.registrar ? tr('レジストラを取得', 'Registrar found') : tr('レジストラ情報が不明', 'Registrar unknown'),
						tr('RDAP（HTTPS）で取得.環境によってはCORS/ネットワーク制限で失敗する場合がある', 'Fetched via RDAP (HTTPS). May fail due to CORS or network restrictions.'),
						lines.join('\n') + `\n\nRDAP: ${url}`
					)
				);
			} catch (error) {
				results.errors.push(`RDAP 取得に失敗: ${String(error)}`);
				results.registrar.findings.push(
					mkFinding(
						'med',
						tr('レジストラ（WHOIS/RDAP）の取得に失敗', 'Failed to retrieve registrar (WHOIS/RDAP)'),
						tr('RDAP(HTTPS)の照会がブロック/失敗した可能性.ローカルで whois を実行して確認する', 'RDAP (HTTPS) lookup may be blocked/failed. Verify with local whois.'),
						`whois ${domain} | egrep -i 'Registrar|Sponsoring Registrar|Registrar URL|Registrar IANA|Name Server'`
					)
				);
			}
		} else {
			results.registrar.findings.push(
				mkFinding(
					'low',
					tr('レジストラ照会を省略', 'Registrar lookup skipped'),
					tr('EnterpriseモードではRDAP照会を行わず,第三者通信を抑制', 'RDAP lookup is disabled in enterprise mode to reduce third-party requests.'),
					''
				)
			);
		}

		try {
			const jsonNS = await dohQuery(domain, 'NS');
			const ns = extractNS(jsonNS);
			results.dnsHosting.ns = ns;

			const estimate = detectDnsHostingProviderFromNS(ns, { tr, trf });
			results.dnsHosting.provider = estimate.provider;
			results.dnsHosting.confidence = estimate.confidence;
			results.dnsHosting.reason = estimate.reason;
			results.dnsHosting.links = estimate.links;

			const evidence = (ns && ns.length) ? ns.join('\n') : '';
			if (String(estimate.provider).startsWith('不明') || String(estimate.provider).toLowerCase().startsWith('unknown')) {
				results.dnsHosting.findings.push(
					mkFinding(
						'med',
						tr('DNSホスティング（権威DNS）の推定: 不明', 'DNS hosting (authoritative): Unknown'),
						tr('NSレコードから一般的なDNSサービスを特定できない.レジストラ/管理画面でネームサーバの委任先を確認する', 'Could not identify a common DNS provider from NS. Check delegated name servers in your registrar/DNS console.'),
						evidence
					)
				);
			} else {
				results.dnsHosting.findings.push(
					mkFinding(
						'low',
						isJa()
							? `DNSホスティング（権威DNS）の推定: ${estimate.provider}（信頼度:${estimate.confidence}）`
							: `DNS hosting (authoritative): ${estimate.provider} (confidence: ${estimate.confidence})`,
						isJa()
							? `${estimate.reason}.DNSレコード追加/変更はこのサービスの管理画面で行う`
							: `${estimate.reason}. ${tr('DNSレコード追加/変更はこのサービスの管理画面で行う', "Manage DNS records in this provider's console.")}`,
						evidence
					)
				);
			}
		} catch (error) {
			results.errors.push(`NS 取得に失敗: ${String(error)}`);
			results.dnsHosting.findings.push(
				mkFinding(
					'med',
					tr('NS（権威DNS）の取得に失敗', 'Failed to retrieve NS (authoritative DNS)'),
					tr('ネットワーク制限やDNS応答の問題の可能性', 'Possibly due to network restrictions or DNS response issues'),
					`dig NS ${domain}`
				)
			);
		}

		try {
			const json = await dohQuery(`_dmarc.${domain}`, 'TXT');
			const txtRecords = extractTXTRecords(json);
			const txt = txtRecords.map((record) => record.data);
			const record = firstRecordStartingWith(txt, 'v=DMARC1');
			results.dmarc.record = record;
			if (record) {
				const ttl = (txtRecords.find((item) => item.data === record) || {}).ttl ?? null;
				results.meta.records.push({ name: `_dmarc.${domain}`, type: 'TXT', ttl, value: record });
			}

			if (!record) {
				results.dmarc.findings.push(
					mkFinding(
						'high',
						tr('DMARC なし（なりすまし耐性が弱い）', 'DMARC missing (weak anti-spoofing)'),
						detailJaOr(
							mkDetail(
								'DMARC未設定',
								'受信側に方針が伝わらず,なりすまし対策が弱い',
								'p=none で開始し,段階的に強化する'
							),
							tr('DMARCレコードが見つからない.まずは監視用(p=none)で開始し,段階的に強化する', 'No DMARC record found. Start with monitoring (p=none) and tighten gradually.')
						),
						`dig +short TXT _dmarc.${domain}`
					)
				);
				results.dmarc.findings.push(
					mkFinding(
						'med',
						tr('推奨（安全な初手）', 'Recommendation (safe first step)'),
						detailJaOr(
							mkDetail(
								'導入の初手',
								'誤判定を抑えながら強化できる',
								'p=none で rua を受け取り,quarantine/reject へ段階移行'
							),
							tr('p=none で開始し,集計レポート(rua)を受け取れるメールボックスを用意してから quarantine/reject へ段階移行する', 'Start with p=none, set up a mailbox for aggregate reports (rua), then move to quarantine/reject in stages.')
						),
						isJa()
							? `例:\n_dmarc.${domain}. 3600 IN TXT "v=DMARC1; p=none; rua=mailto:postmaster@${domain}; fo=1"\n\n検証:\ndig +short TXT _dmarc.${domain}\n\n戻す:\n追加したTXTを削除`
							: `Example:\n_dmarc.${domain}. 3600 IN TXT "v=DMARC1; p=none; rua=mailto:postmaster@${domain}; fo=1"\n\nVerify:\ndig +short TXT _dmarc.${domain}\n\nRollback:\nRemove the TXT record you added`
					)
				);
			} else {
				const tags = parseDmarcTags(record);
				const p = (tags.p || '').toLowerCase();
				const rua = tags.rua || '';
				const pct = tags.pct || '';
				const sp = tags.sp || '';
				const adkim = (tags.adkim || '').toLowerCase();
				const aspf = (tags.aspf || '').toLowerCase();

				let level = 'low';
				const pLabel = p || tr('(不明)', '(unknown)');
				let title = `DMARC: p=${pLabel}`;
				let legacyDetail = tr('DMARCが設定されている.段階移行・例外の取り扱い・アラインメントを確認する', 'DMARC is configured. Review staged rollout, exceptions, and alignment.');
				if (p === 'none') {
					level = 'med';
					legacyDetail = tr('監視のみ(p=none).集計(rua)を確認しつつ quarantine/reject へ段階的に強化する', 'Monitoring only (p=none). Review rua reports and tighten to quarantine/reject in stages.');
				}
				if (p === 'quarantine') {
					level = 'med';
					legacyDetail = tr('隔離(quarantine).運用影響を確認しつつ reject への段階移行を検討する', 'Quarantine. Review impact and consider moving to reject.');
				}
				if (p === 'reject') {
					level = 'low';
					legacyDetail = tr('不整合のメールは拒否に指定されている。sp の明示的な指定を定義することを勧める', 'Reject. Review exceptions, forwarding, and subdomain (sp) policy.');
				}
				if (!rua) {
					level = level === 'low' ? 'med' : level;
					legacyDetail += isJa()
						? '（rua が無い/空のため,運用上の可視化が弱い）'
						: ' (rua is missing/empty; operational visibility is limited)';
				}
				if (sp && sp.toLowerCase() === 'none') level = level === 'low' ? 'med' : level;
				if (adkim === 's' || aspf === 's') {
					// strict alignment is acceptable
				}
				if (pct && pct !== '100') legacyDetail += `（pct=${pct}）`;

				let advice = '運用方針と例外を確認';
				if (p === 'none') advice = 'ruaを確認しつつ段階強化';
				if (p === 'quarantine') advice = '運用影響を見つつrejectを検討';
				if (p === 'reject') advice = 'sp/例外/アラインメントを確認';
				if (!rua) advice += ' / rua追加を検討';
				if (sp && sp.toLowerCase() === 'none') advice += ' / spを見直し';
				if (pct && pct !== '100') advice += ` / pct=${pct}`;
				const detail = detailJaOr(
					mkDetail(
						`p=${pLabel}`,
						'DMARC方針が受信時の扱いに直結する',
						advice
					),
					legacyDetail
				);

				results.dmarc.findings.push(
					mkFinding(level, title, detail, `TXT _dmarc.${domain}\n${record}`)
				);
			}
			results.dmarc.findings.push(
				mkFindingRich(
					'low',
					t('dmarc.staged.title'),
					detailJaOr(
						mkDetail(
							'段階導入の推奨ステップ',
							'誤判定と運用影響を抑えながら強化できる',
							'',
							{ adviceHtml: t('dmarc.staged.detailHtml') }
						),
						t('dmarc.staged.detailHtml')
					),
					'',
					false
				)
			);
		} catch (error) {
			results.errors.push(`DMARC 取得に失敗: ${String(error)}`);
			results.dmarc.findings.push(
				mkFinding(
					'med',
					tr('DMARCの取得に失敗', 'Failed to retrieve DMARC'),
					detailJaOr(
						mkDetail(
							'DMARC取得失敗',
							'DNS照会に失敗した可能性',
							'再実行かdigで確認'
						),
						tr('公開DNS照会が失敗した可能性', 'Public DNS lookup may have failed')
					),
					`dig +short TXT _dmarc.${domain}`
				)
			);
		}

		try {
			const json = await dohQuery(domain, 'TXT');
			const txtRecords = extractTXTRecords(json);
			const txt = txtRecords.map((record) => record.data);
			const spfRecordObjs = txtRecords.filter((record) => String(record.data).toLowerCase().startsWith('v=spf1'));
			const spfRecords = spfRecordObjs.map((record) => record.data);
			results.spf.records = spfRecords;
			if (spfRecordObjs.length) {
				for (const rec of spfRecordObjs) {
					results.meta.records.push({ name: domain, type: 'TXT', ttl: rec.ttl ?? null, value: rec.data });
				}
			}

			if (spfRecords.length === 0) {
				results.spf.findings.push(
					mkFinding(
						'med',
						tr('SPF なし', 'SPF missing'),
						detailJaOr(
							mkDetail(
								'SPF未設定',
								'送信元の制御ができない',
								'送信元を棚卸ししてSPFを作成'
							),
							tr('SPFが無いと SPF 単体での送信元制御はできない.送信元（Microsoft 365/Google/各種SaaS）を洗い出してから安全に設計する', 'Without SPF you cannot control senders via SPF alone. Inventory your senders (Microsoft 365/Google/SaaS) and design safely.')
						),
						`dig +short TXT ${domain}`
					)
				);
				results.spf.findings.push(
					mkFinding(
						'low',
						tr('推奨（安全な進め方）', 'Recommendation (safe rollout)'),
						detailJaOr(
							mkDetail(
								'導入の推奨手順',
								'誤判定を避けて導入できる',
								'送信元確認→include/IP追加→最後に~all/-all'
							),
							tr('まず送信元を棚卸し→ include/送信IP を追加→ 最後に ~all/-all を確定する（いきなり -all を入れると正規メールが落ちる可能性）', 'Inventory senders → add include/sender IPs → then finalize ~all/-all. Avoid jumping straight to -all to prevent dropping legitimate mail.')
						),
						isJa()
							? `検証:\ndig +short TXT ${domain}\n\n戻す:\n追加したTXTを削除 or 以前のTXTへ戻す`
							: `Verify:\ndig +short TXT ${domain}\n\nRollback:\nRemove the TXT record you added, or restore the previous TXT`
					)
				);
			} else if (spfRecords.length > 1) {
				results.spf.findings.push(
					mkFinding(
						'high',
						tr('SPF が複数（無効/不定の可能性）', 'Multiple SPF records (may be invalid/ambiguous)'),
						detailJaOr(
							mkDetail(
								'SPFが複数',
								'評価が不定になりやすい',
								'1レコードに統合する'
							),
							tr('SPFは通常1レコードにまとめる必要がある.複数あると評価が不定になりやすい', 'SPF should usually be consolidated into a single record; multiple records can lead to ambiguous evaluation.')
						),
						spfRecords.join('\n')
					)
				);
			} else {
				const spf = spfRecords[0];
				const analysis = analyzeSpf(spf);
				const lookup = spfEstimateLookupRisk(spf);
				const maxSeg = longestTxtSegment(spf);

				if (spfIsIpOnly(spf)) {
					results.spf.findings.push(
						mkFinding(
							'med',
							tr('SPF: IP直書きのみ（運用リスク）', 'SPF: IP-only (operational risk)'),
							detailJaOr(
								mkDetail(
									'IP直書きのみ',
									'IP変更に弱く誤判定が起きやすい',
									'include設計か変更管理を整備'
								),
								tr('IP直書きだけのSPFは,送信基盤のIP変更/追加に追随できないと正規メールがFailしやすい.複数SaaS（Microsoft 365/Google/配信サービス等）を使う場合は include/送信経路の棚卸しを推奨.固定IP運用なら,変更管理（追加/廃止時の手順）と段階導入（~all→-all）をセットで運用する', 'IP-only SPF is brittle: if sender IPs change and SPF is not updated, legitimate mail may fail. If you use multiple SaaS senders, prefer include-based design and a sender inventory. If you truly have fixed IPs, pair it with change-management and staged rollout (~all → -all).')
							),
							spf
						)
					);
				}

				if (spfHasAllQualifier(spf, '+')) {
					results.spf.findings.push(
						mkFinding(
							'high',
							t('spf.all.plus.title'),
							detailJaOr(
								mkDetail('+all', '誰でも送信可能になる', '+allをやめて送信元を限定'),
								t('spf.all.plus.detail')
							),
							spf
						)
					);
				} else if (spfHasAllQualifier(spf, '?')) {
					results.spf.findings.push(
						mkFinding(
							'med',
							t('spf.all.qmark.title'),
							detailJaOr(
								mkDetail('?all', '判定が弱く効果が薄い', '~all/-allへの移行を検討'),
								t('spf.all.qmark.detail')
							),
							spf
						)
					);
				} else if (spfHasAllQualifier(spf, '~')) {
					results.spf.findings.push(
						mkFinding(
							'low',
							t('spf.all.tilde.title'),
							detailJaOr(
								mkDetail('~all', 'ソフトFailで監視寄り', '運用確認後に-allを検討'),
								t('spf.all.tilde.detail')
							),
							spf
						)
					);
				} else if (spfHasAllQualifier(spf, '-')) {
					results.spf.findings.push(
						mkFinding(
							'low',
							t('spf.all.minus.title'),
							detailJaOr(
								mkDetail('-all', 'Failで拒否される', '送信元の漏れがないか確認'),
								t('spf.all.minus.detail')
							),
							spf
						)
					);
				} else {
					results.spf.findings.push(
						mkFinding(
							'med',
							t('spf.all.missing.title'),
							detailJaOr(
								mkDetail('all指定なし', '評価が曖昧になる', 'allを明示する'),
								t('spf.all.missing.detail')
							),
							spf
						)
					);
				}

				if (analysis.ptr) {
					results.spf.findings.push(
						mkFinding(
							'med',
							tr('SPF: ptr を使用', 'SPF: uses ptr'),
							detailJaOr(
								mkDetail('ptr使用', '不安定/誤判定の原因になりやすい', '削除/代替を検討'),
								tr('ptr は推奨されないことが多い（不安定/コスト/誤判定の原因）.可能なら削除/代替を検討', 'ptr is often discouraged (unstable/costly/false positives). Consider removing or replacing it.')
							),
							spf
						)
					);
				}
				if (analysis.exists) {
					results.spf.findings.push(
						mkFinding(
							'med',
							tr('SPF: exists を使用', 'SPF: uses exists'),
							detailJaOr(
								mkDetail('exists使用', '複雑化しやすい', '必要性を確認しlookup上限に注意'),
								tr('exists は複雑化しやすい.意図を明確にし,lookup上限に注意する', 'exists can add complexity. Make intent explicit and watch the lookup limit.')
							),
							spf
						)
					);
				}
				if (analysis.redirect) {
					results.spf.findings.push(
						mkFinding(
							'low',
							tr('SPF: redirect を使用', 'SPF: uses redirect'),
							detailJaOr(
								mkDetail('redirect使用', 'lookup上限に影響する', '上限(10)に注意'),
								tr('一元管理に便利だが,lookup上限(10)に注意する', 'Useful for centralized management, but mind the lookup limit (10).')
							),
							spf
						)
					);
				}
				if (lookup >= 10) {
					const lookupLabel = tr('推定lookup', 'Estimated lookups');
					results.spf.findings.push(
						mkFinding(
							'med',
							t('spf.lookup.limit.title'),
							detailJaOr(
								mkDetail('lookup上限リスク', 'PermErrorの恐れがある', 'include/redirectを整理'),
								t('spf.lookup.limit.detail')
							),
							`${lookupLabel}=${lookup}\n${spf}`
						)
					);
				}
				if (maxSeg > 250) {
					results.spf.findings.push(
						mkFinding(
							'med',
							tr('SPF: 文字列が長い', 'SPF: record is long'),
							detailJaOr(
								mkDetail('SPFが長い', 'TXT分割で誤結合の恐れ', '分割仕様を確認'),
								tr('TXTは分割されることがある.DNS応答の結合や設定画面の分割仕様に注意', 'TXT records may be split. Ensure your tooling/UI correctly joins segments.')
							),
							`maxSegmentLen≈${maxSeg}\n${spf}`
						)
					);
				}
				try {
					const expansion = await buildSpfExpansion(dohQuery, domain, spf, t, { maxDepth: 4, maxNodes: 24 });
					if (expansion.lines.length) {
						const lookupLabel = tr('推定lookup', 'Estimated lookups');
						const evidence = [`${lookupLabel}=${lookup}`, ...expansion.lines].join('\n');
						results.spf.findings.push(
							mkFinding(
								'low',
								t('spf.tree.title'),
								detailJaOr(
									mkDetail('include/redirect展開', 'lookup増加やループを可視化', '結果を参考に整理'),
									t('spf.tree.detail')
								),
								evidence
							)
						);
					}
					if (expansion.loops && expansion.loops.length) {
						results.spf.findings.push(
							mkFinding(
								'med',
								t('spf.loop.title'),
								detailJaOr(
									mkDetail('参照ループ疑い', '評価が失敗しやすい', '参照チェーンを修正'),
									t('spf.loop.detail')
								),
								expansion.loops.join('\n')
							)
						);
					}
					if (expansion.truncated) {
						results.spf.findings.push(
							mkFinding(
								'low',
								t('spf.tree.truncated.title'),
								detailJaOr(
									mkDetail('展開打ち切り', '深さ/件数の上限に到達', '必要なら参照を整理'),
									t('spf.tree.truncated.detail')
								),
								''
							)
						);
					}
				} catch {
					// ignore SPF expansion errors
				}
			}
		} catch (error) {
			results.errors.push(`SPF 取得に失敗: ${String(error)}`);
			results.spf.findings.push(
				mkFinding(
					'med',
					tr('SPFの取得に失敗', 'Failed to retrieve SPF'),
					detailJaOr(
						mkDetail('SPF取得失敗', 'DNS照会に失敗した可能性', '再実行かdigで確認'),
						tr('公開DNS照会が失敗した可能性', 'Public DNS lookup may have failed')
					),
					`dig +short TXT ${domain}`
				)
			);
		}

		try {
			const found = [];
			const cnameOnly = [];
			for (const sel of DKIM_SELECTOR_CANDIDATES) {
				const name = `${sel}._domainkey.${domain}`;
				let txtRecords = [];
				let cnameInfo = { chain: [], target: '', loop: false, truncated: false };
				let delegatedTxtRecord = null;
				try {
					const jTxt = await dohQuery(name, 'TXT');
					txtRecords = extractTXTRecords(jTxt);
				} catch {
					// ignore individual selector misses
				}
				const dkimTxtRecord = firstTxtRecordStartingWith(txtRecords, 'v=DKIM1');
				const dkimTxt = dkimTxtRecord ? dkimTxtRecord.data : '';
				if (dkimTxtRecord) {
					results.meta.records.push({ name, type: 'TXT', ttl: dkimTxtRecord.ttl ?? null, value: dkimTxtRecord.data });
				}

				if (!dkimTxt) {
					cnameInfo = await resolveCnameChain(dohQuery, name, { maxDepth: 3 });
					if (cnameInfo.chain.length) {
						for (const hop of cnameInfo.chain) {
							results.meta.records.push({ name: hop.from, type: 'CNAME', ttl: hop.ttl ?? null, value: hop.to });
						}
					}
					if (cnameInfo.target) {
						try {
							const delegated = await dohQuery(cnameInfo.target, 'TXT');
							const delegatedRecords = extractTXTRecords(delegated);
							delegatedTxtRecord = firstTxtRecordStartingWith(delegatedRecords, 'v=DKIM1');
							if (delegatedTxtRecord) {
								results.meta.records.push({ name: cnameInfo.target, type: 'TXT', ttl: delegatedTxtRecord.ttl ?? null, value: delegatedTxtRecord.data });
							}
						} catch {
							delegatedTxtRecord = null;
						}
					}
				}

				const delegatedTxt = delegatedTxtRecord ? delegatedTxtRecord.data : '';
				const cnameTarget = cnameInfo.target || '';
				if (dkimTxt || delegatedTxt) {
					found.push({
						selector: sel,
						name,
						txt: dkimTxt || '',
						cn: cnameTarget,
						delegatedTxt,
						cnameChain: cnameInfo.chain || []
					});
				} else if (cnameTarget) {
					cnameOnly.push({ selector: sel, name, cn: cnameTarget, cnameChain: cnameInfo.chain || [] });
				}
			}

			results.dkim.selectors = found.map((item) => item.selector);
			results.dkim.confirmedSelectors = found.map((item) => item.selector);
			results.dkim.usesCname = found.some((item) => !!item.cn) || cnameOnly.length > 0;
			if (!found.length) {
				if (cnameOnly.length) {
					results.dkim.selectors = cnameOnly.map((item) => item.selector);
					results.dkim.findings.push(
						mkFinding(
							'med',
							t('dkim.cnameDelegationDetectedUnverified.title'),
							detailJaOr(
								mkDetail('CNAME委任を検出（未確認）', 'DNS上で v=DKIM1 を確認できない', '送信基盤の設定やヘッダで確認'),
								t('dkim.cnameDelegationDetectedUnverified.detail')
							),
							cnameOnly.map((item) => formatCnameChain(item.cnameChain || []) || `CNAME ${item.name} -> ${item.cn}`).join('\n')
						)
					);
				}
				if (!cnameOnly.length) {
					results.dkim.findings.push(
						mkFinding(
							'high',
							tr('DKIM の公開キーが確認できない', 'DKIM public key not confirmed'),
							detailJaOr(
								mkDetail(
									'DKIMキー未確認',
									'署名の検証ができない',
									'送信基盤でselectorを確認し公開'
								),
								tr('一般的な selector（selector1/selector2/default/google）の TXT/CNAME では v=DKIM1 を確認できなかった.DKIM は <selector>._domainkey.<your-domain> 配下に公開し,apex の TXT/SPF に DKIM が出ないのは仕様.Microsoft 365 は selector1/selector2 の CNAME が多く,Google Workspace は google._domainkey の TXT が一般的.送信基盤の設定で実際の selector を確認.※DKIM selector は DNS から列挙できないため,カスタム selector だと本ツールでは検出できず FN の可能性がある', 'No v=DKIM1 found on common selectors (selector1/selector2/default/google) via TXT/CNAME. DKIM is published under <selector>._domainkey.<your-domain> and does not appear in apex TXT/SPF by design. Microsoft 365 often uses CNAMEs (selector1/selector2) and Google Workspace often uses TXT (e.g. google._domainkey). Confirm the actual selector in your sender settings. Note: DKIM selectors are not enumerable via DNS, so custom selectors may cause false negatives in this tool.')
							),
							dkimLookupHints(domain)
						)
					);
				}
			} else {
				for (const item of found) {
					const chainText = formatCnameChain(item.cnameChain || []);
					const evidence = item.txt
						? `TXT ${item.name}\n${item.txt}`
						: (item.delegatedTxt
							? `${chainText}\n\nTXT ${item.cn}\n${item.delegatedTxt}`.trim()
							: `${chainText || `CNAME ${item.name} -> ${item.cn}`}`);
					let detail = item.txt
						? tr('DKIMキー(TXT)が存在', 'DKIM key (TXT) present')
						: (item.delegatedTxt
							? tr('DKIMはCNAME委任（委任先TXTで v=DKIM1 を確認）', 'DKIM delegated via CNAME (v=DKIM1 found at target)')
							: tr('DKIMはCNAME委任（プロバイダ側でキー管理）の可能性', 'DKIM delegated via CNAME (provider-managed key possible)'));
					const keyForBits = item.txt || item.delegatedTxt;
					if (keyForBits) {
						const bits = parseDkimKeyBits(keyForBits);
						if (bits && bits < 1024) detail += trf('（鍵長が短い可能性: ~{bits}bit）', ' (key size may be short: ~{bits}bit)', { bits });
						else if (bits && bits >= 2048) detail += trf('（鍵長推定: ~{bits}bit）', ' (estimated key size: ~{bits}bit)', { bits });
					}
					results.dkim.findings.push(
						mkFinding(
							'low',
							`DKIM: ${item.selector}`,
							detailJaOr(
								mkDetail(detail, '送信者認証に必要', '鍵長/更新方針を確認'),
								detail
							),
							evidence
						)
					);
				}
				if (cnameOnly.length) {
					results.dkim.findings.push(
						mkFinding(
							'low',
							t('dkim.cnameDelegationUnverified.title'),
							detailJaOr(
								mkDetail('CNAME委任（未確認セレクタあり）', 'DNSだけでは署名の有無が確定できない', '送信基盤やヘッダで確認'),
								t('dkim.cnameDelegationUnverified.detail')
							),
							cnameOnly.map((item) => formatCnameChain(item.cnameChain || []) || `CNAME ${item.name} -> ${item.cn}`).join('\n')
						)
					);
				}
			}
			results.dkim.findings.push(
				mkFinding(
					'low',
					t('dkim.messageUnverified.title'),
					detailJaOr(
						mkDetail('実メール未検証', 'DNSだけでは整合を確定できない', 'DKIM-Signatureヘッダで確認'),
						t('dkim.messageUnverified.detail')
					),
					''
				)
			);
		} catch (error) {
			results.errors.push(`DKIM 取得に失敗: ${String(error)}`);
			results.dkim.findings.push(
				mkFinding(
					'med',
					tr('DKIMの取得に失敗', 'Failed to retrieve DKIM'),
					detailJaOr(
						mkDetail('DKIM取得失敗', 'DNS照会に失敗した可能性', '再実行かdigで確認'),
						tr('公開DNS照会が失敗した可能性', 'Public DNS lookup may have failed')
					),
					dkimLookupHints(domain)
				)
			);
		}

		try {
			const candidates = [`default._bimi.${domain}`, `_bimi.${domain}`];
			let record = '';
			let usedName = '';
			let recordInfo = null;
			for (const name of candidates) {
				const json = await dohQuery(name, 'TXT');
				const txtRecords = extractTXTRecords(json);
				const foundRecord = firstTxtRecordStartingWith(txtRecords, 'v=BIMI1');
				if (foundRecord) {
					record = foundRecord.data;
					usedName = name;
					recordInfo = { name, ttl: foundRecord.ttl ?? null, value: foundRecord.data };
					break;
				}
			}
			results.bimi.record = record;
			results.bimi.name = usedName || candidates[0];
			if (recordInfo) {
				results.meta.records.push({ name: recordInfo.name, type: 'TXT', ttl: recordInfo.ttl, value: recordInfo.value });
			}

			if (!record) {
				results.bimi.findings.push(
					mkFinding(
						'low',
						tr('BIMI なし（任意）', 'BIMI missing (optional)'),
						tr('BIMIはメールクライアントのロゴ表示（ブランド表示）に関係する仕組み.必須ではないが,導入すると受信者の視認性が上がる場合がある', 'BIMI is used by some mail clients to display a brand logo. It is optional, but can improve recognition for recipients.'),
						`dig +short TXT default._bimi.${domain}\n(did not find v=BIMI1; also checked _bimi.${domain})`
					)
				);
			} else {
				const tags = parseBimiTags(record);
				results.bimi.l = tags.l;
				results.bimi.a = tags.a;

				let level = 'low';
				const problems = [];
				const extra = [];
				if (!tags.l) {
					level = 'med';
					problems.push(tr('l=（ロゴURL）が無い', 'Missing l= (logo URL)'));
				}
				if (!tags.a) problems.push(tr('a=（VMC/証明書URL）が無い', 'Missing a= (VMC/certificate URL)'));
				if (tags.l && !String(tags.l).toLowerCase().startsWith('https://')) {
					level = 'med';
					problems.push(tr('l= が https:// ではない', 'l= is not https://'));
				}
				if (tags.a) {
					const aLower = String(tags.a).toLowerCase();
					const isKnownNonUrl = aLower === 'self' || aLower === 'none';
					if (!isKnownNonUrl && !aLower.startsWith('https://')) {
						level = 'med';
						problems.push(tr('a= が https:// ではない', 'a= is not https://'));
					}
				}

				const safeLogo = sanitizeUrl(tags.l);
				const safeA = sanitizeUrl(tags.a);
				const aLower = String(tags.a || '').toLowerCase();
				const aIsKnownNonUrl = aLower === 'self' || aLower === 'none';
				const allowExternalBimiFetch = !ENTERPRISE_MODE;

				if (!allowExternalBimiFetch && tags.l) {
					extra.push(tr('外部ロゴ取得はEnterpriseモードで無効', 'External logo fetch is disabled in enterprise mode.'));
				}
				if (allowExternalBimiFetch && tags.l && String(tags.l).toLowerCase().startsWith('https://') && safeLogo) {
					if (!looksLikeSvgUrl(tags.l)) {
						level = 'med';
						problems.push(tr('l= はSVG（.svg）を指すのが一般的', 'l= typically points to an SVG (.svg)'));
					}

					const imgProbe = await probeImage(safeLogo, 6500);
					if (imgProbe.ok) {
						if (imgProbe.width && imgProbe.height) {
							extra.push(trf('ロゴ画像ロード: OK（{w}x{h}）', 'Logo image load: OK ({w}x{h})', { w: imgProbe.width, h: imgProbe.height }));
							const ratio = imgProbe.width / imgProbe.height;
							if (!Number.isFinite(ratio) || Math.abs(ratio - 1) > 0.05) {
								level = 'med';
								problems.push(tr('ロゴ画像が正方形でない可能性（推奨は正方形）', 'Logo may not be square (square is recommended)'));
							}
						} else {
							extra.push(tr('ロゴ画像ロード: OK（寸法は取得できず）', 'Logo image load: OK (dimensions unavailable)'));
						}
					} else {
						level = 'med';
						problems.push(tr('ロゴ画像が読み込めない（URL/存在/到達性を確認）', 'Logo image failed to load (check URL/existence/reachability)'));
					}

					const fetched = await fetchTextCors(safeLogo, 6500);
					if (fetched.ok) {
						const ct = String(fetched.ct || '').toLowerCase();
						const looksSvg = ct.includes('image/svg+xml') || /<svg[\s>]/i.test(fetched.text || '');
						if (!looksSvg) {
							level = 'med';
							problems.push(tr('ロゴをSVGとして取得できない（Content-Type/内容を確認）', 'Logo does not look like SVG (check Content-Type/content)'));
						} else {
							let sizeBytes = null;
							let sizeLabel = tr('SVGサイズ（推定）', 'SVG size (approx)');
							const head = await fetchHeadCors(safeLogo, 4500);
							if (head && head.ok && Number.isFinite(head.contentLength)) {
								sizeBytes = head.contentLength;
								sizeLabel = tr('SVGサイズ（Content-Length）', 'SVG size (Content-Length)');
							} else {
								sizeBytes = approxByteLength(fetched.text || '');
							}
							if (sizeBytes > 32 * 1024) {
								level = 'med';
								problems.push(trf('{label}が大きい可能性（{kb}KB）', '{label} may be too large ({kb}KB)', { label: sizeLabel, kb: (sizeBytes / 1024).toFixed(1) }));
							} else {
								extra.push(trf('{label}: {kb}KB', '{label}: {kb}KB', { label: sizeLabel, kb: (sizeBytes / 1024).toFixed(1) }));
							}

							const dim = parseSvgDimensions(fetched.text || '');
							if (dim.viewBox && dim.viewBox.width && dim.viewBox.height) {
								const vbRatio = dim.viewBox.width / dim.viewBox.height;
								extra.push(trf('SVG viewBox: {viewBox}', 'SVG viewBox: {viewBox}', { viewBox: dim.viewBoxRaw }));
								if (Math.abs(vbRatio - 1) > 0.05) {
									level = 'med';
									problems.push(tr('SVG viewBoxが正方形ではない可能性', 'SVG viewBox may not be square'));
								}
							}

							const issues = checkBimiSvgRequirements(fetched.text, tr);
							if (issues.length) {
								level = 'med';
								problems.push(tr('SVG要件（簡易）に抵触の可能性', 'SVG sanity checks found potential issues'));
								extra.push(...issues.slice(0, 4));
							} else {
								extra.push(tr('ロゴSVG: 取得OK / 簡易チェックOK（CORS許可時のみ）', 'Logo SVG: fetched OK / sanity checks OK (only when CORS allows)'));
							}
						}
					} else if (typeof fetched.status === 'number') {
						level = 'med';
						problems.push(trf('ロゴURLが HTTP {code} を返した', 'Logo URL returned HTTP {code}', { code: fetched.status }));
					} else {
						const probe = await probeUrlNoCors(safeLogo, 5500);
						if (probe.ok) {
							extra.push(tr('ロゴURL到達性: OK（CORSのため内容/サイズは未検証）', 'Logo URL reachable (content/size not verified due to CORS)'));
						} else {
							level = 'med';
							problems.push(tr('ロゴURLに到達できない可能性', 'Logo URL may be unreachable'));
						}
					}
				}

				if (tags.a && !aIsKnownNonUrl && String(tags.a).toLowerCase().startsWith('https://') && safeA) {
					const fetched = await fetchTextCors(safeA, 6500, 180_000);
					if (fetched.ok) {
						const text = String(fetched.text || '');
						if (/-----BEGIN CERTIFICATE-----/i.test(text)) {
							extra.push(tr('a= (VMC): 証明書(PEM)らしき内容を取得（CORS許可時のみ）', 'a= (VMC): looks like a PEM certificate (only when CORS allows)'));
						} else {
							level = 'med';
							problems.push(tr('a= は証明書(PEM)として取得できない可能性', 'a= may not be a certificate (PEM)'));
						}
					} else if (typeof fetched.status === 'number') {
						level = 'med';
						problems.push(trf('a= URLが HTTP {code} を返した', 'a= URL returned HTTP {code}', { code: fetched.status }));
					} else {
						const probe = await probeUrlNoCors(safeA, 5500);
						if (probe.ok) extra.push(tr('a= URL到達性: OK（CORSのため内容未検証）', 'a= URL reachable (content not verified due to CORS)'));
						else {
							level = 'med';
							problems.push(tr('a= URLに到達できない可能性', 'a= URL may be unreachable'));
						}
					}
				}

				if (tags.l && (!tags.a || aIsKnownNonUrl)) {
					extra.push(tr('ガイダンス: ロゴ表示にはVMCが必要になる受信環境が多い（a= の用意を検討）', 'Guidance: many inbox providers require a VMC for logo display (consider providing a=)'));
				}
				const logoLine = safeLogo
					? `<div><strong>l=</strong> <a href="${esc(safeLogo)}" target="_blank" rel="noopener noreferrer">${esc(tags.l)}</a></div>`
					: `<div><strong>l=</strong> <span class="mono mono-inline">${esc(tags.l || t('label.noneParen'))}</span></div>`;
				const aLine = safeA
					? `<div class="mt-6"><strong>a=</strong><a href="${esc(safeA)}" target="_blank" rel="noopener noreferrer">${esc(tags.a)}</a></div>`
					: `<div class="mt-6"><strong>a=</strong><span class="mono mono-inline">${esc(tags.a || t('label.noneParen'))}</span></div>`;
				const preview = safeLogo
					? `<img src="${esc(safeLogo)}" alt="BIMI logo" loading="lazy" referrerpolicy="no-referrer" class="bimi-logo">`
					: '';
				const checksBlock = extra.length
					? `<div class="mt-10"><div class="mini-title">${esc(t('label.additionalChecks'))}</div><ul>${extra.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>`
					: '';
				const note = problems.length
					? `<div class="mt-8">${esc(t('label.note'))}: ${esc(problems.join(' / '))}</div>${checksBlock}`
					: `<div class="mt-8">${esc(tr('BIMIレコードを検出しました.', 'BIMI record detected.'))}</div>${checksBlock}`;
				results.bimi.findings.push(
					mkFindingRich(
						level,
						`BIMI: v=BIMI1 (${usedName})`,
						`${logoLine}${aLine}${preview}${note}`,
						`TXT ${usedName}\n${record}`
					)
				);
			}
		} catch (error) {
			results.errors.push(`BIMI 取得に失敗: ${String(error)}`);
			results.bimi.findings.push(mkFinding('low', tr('BIMIの取得に失敗（任意）', 'Failed to retrieve BIMI (optional)'), tr('公開DNS照会が失敗した可能性（BIMIは任意）.ネットワーク制限の可能性もある', 'Public DNS lookup may have failed (BIMI is optional). Network restrictions may apply.'), `dig +short TXT default._bimi.${domain}\ndig +short TXT _bimi.${domain}`));
		}

		try {
			const mx = extractMX(await dohQuery(domain, 'MX'));
			results.mx.records = mx;
			if (!mx.length) {
				results.mx.findings.push(mkFinding('med', tr('MX が見つからない', 'MX not found'), tr('業務メール用ドメインでMXが無い場合,受信が別ドメイン/別経路の可能性.設計を確認する', 'If this is a mail domain and MX is missing, inbound mail may use another domain/path. Review the design.'), `dig +short MX ${domain}`));
			} else {
				results.mx.findings.push(mkFinding('low', tr('MX を確認', 'Check MX'), tr('MXは受信先（メールサーバ）を示す.利用SaaS（Microsoft 365/Google等）と整合するか確認する', 'MX indicates inbound mail servers. Confirm it matches your provider (Microsoft 365/Google/etc.).'), mx.join('\n')));
			}
		} catch (error) {
			results.errors.push(`MX 取得に失敗: ${String(error)}`);
			results.mx.findings.push(mkFinding('med', tr('MXの取得に失敗', 'Failed to retrieve MX'), tr('公開DNS照会が失敗した可能性', 'Public DNS lookup may have failed'), `dig +short MX ${domain}`));
		}

		try {
			const stsRecords = extractTXTRecords(await dohQuery(`_mta-sts.${domain}`, 'TXT'));
			const stsRecord = firstTxtRecordStartingWith(stsRecords, 'v=STSv1');
			results.mta_sts.record = stsRecord ? stsRecord.data : '';
			if (stsRecord) {
				results.meta.records.push({ name: `_mta-sts.${domain}`, type: 'TXT', ttl: stsRecord.ttl ?? null, value: stsRecord.data });
			}
		} catch {
			results.mta_sts.record = '';
		}

		try {
			const tlsRecords = extractTXTRecords(await dohQuery(`_smtp._tls.${domain}`, 'TXT'));
			const tlsRecord = firstTxtRecordStartingWith(tlsRecords, 'v=TLSRPTv1');
			results.mta_sts.tlsrpt = tlsRecord ? tlsRecord.data : '';
			if (tlsRecord) {
				results.meta.records.push({ name: `_smtp._tls.${domain}`, type: 'TXT', ttl: tlsRecord.ttl ?? null, value: tlsRecord.data });
			}
		} catch {
			results.mta_sts.tlsrpt = '';
		}

		if (!results.mta_sts.record) {
			results.mta_sts.findings.push(mkFinding('med', tr('MTA-STS なし（TLS強制の仕組みなし）', 'MTA-STS missing (no TLS enforcement)'), tr('受信側のTLSを強制したい場合に有効.まずはTLS-RPTと併せて段階導入を検討', 'Useful if you want to enforce TLS for inbound mail. Consider staged rollout alongside TLS-RPT.'), `dig +short TXT _mta-sts.${domain}`));
		} else {
			results.mta_sts.findings.push(mkFinding('low', tr('MTA-STS: TXTあり', 'MTA-STS: TXT present'), tr('TXT（id）設定を確認.別途 https://mta-sts.<domain>/.well-known/mta-sts.txt の公開が必要', 'Confirm the TXT (id). You also need to host https://mta-sts.<domain>/.well-known/mta-sts.txt'), `TXT _mta-sts.${domain}\n${results.mta_sts.record}`));
		}

		if (!results.mta_sts.tlsrpt) {
			results.mta_sts.findings.push(mkFinding('low', tr('TLS-RPT なし（任意）', 'TLS-RPT missing (optional)'), tr('TLSの失敗レポートを受けたい場合はTLS-RPTを追加する', 'Add TLS-RPT if you want reports about TLS failures.'), `dig +short TXT _smtp._tls.${domain}`));
		} else {
			results.mta_sts.findings.push(mkFinding('low', tr('TLS-RPT: TXTあり', 'TLS-RPT: TXT present'), tr('rua の宛先が運用可能か確認する', 'Confirm the rua address is deliverable and monitored.'), `TXT _smtp._tls.${domain}\n${results.mta_sts.tlsrpt}`));
		}

		try {
			const caa = extractCAA(await dohQuery(domain, 'CAA'));
			results.caa.records = caa;
			if (!caa.length) {
				results.caa.findings.push(mkFinding('low', tr('CAA なし（任意/ガバナンス）', 'CAA missing (optional/governance)'), tr('発行を許可するCAを制限したい場合に有効.成熟度に応じて導入を検討', 'Useful if you want to restrict which CAs may issue certificates. Consider adoption based on maturity.'), `dig +short CAA ${domain}`));
			} else {
				const analysis = analyzeCaaRecords(caa);
				const yes = tr('あり', 'yes');
				const unknown = tr('不明', 'unknown');
				const detail = trf(
					'CAAが設定されている（issue={issue} / issuewild={issuewild} / iodef={iodef}）',
					'CAA is present (issue={issue} / issuewild={issuewild} / iodef={iodef})',
					{
						issue: analysis.hasIssue ? yes : unknown,
						issuewild: analysis.hasIssueWild ? yes : unknown,
						iodef: analysis.hasIodef ? yes : unknown
					}
				);
				results.caa.findings.push(mkFinding('low', tr('CAA を確認', 'Check CAA'), detail, caa.join('\n')));
			}
		} catch {
			results.caa.records = [];
			results.caa.findings.push(mkFinding('low', tr('CAA 未確認（応答なし）', 'CAA unverified (no response)'), tr('CAAは任意.DNS応答の都合で取得できない場合がある', 'CAA is optional. It may be unavailable due to DNS response issues.'), `dig +short CAA ${domain}`));
		}

		try {
			results.dnssec.ds = extractDS(await dohQuery(domain, 'DS'));
		} catch {
			results.dnssec.ds = [];
		}
		try {
			results.dnssec.dnskey = extractDNSKEY(await dohQuery(domain, 'DNSKEY'));
		} catch {
			results.dnssec.dnskey = [];
		}

		if (results.dnssec.ds && results.dnssec.ds.length) {
			results.dnssec.findings.push(mkFinding('low', tr('DNSSEC: DSあり', 'DNSSEC: DS present'), tr('DNSSECが有効の可能性.運用・更新（KSK/ZSK）手順を確認する', 'DNSSEC may be enabled. Ensure you have procedures for operation and key rollover (KSK/ZSK).'), results.dnssec.ds.slice(0, 3).join('\n')));
		} else {
			results.dnssec.findings.push(mkFinding('low', tr('DNSSEC: DSなし（任意/方針次第）', 'DNSSEC: DS missing (optional/policy)'), tr('ポリシーや要件により導入判断.メール認証（SPF/DKIM/DMARC）とは別軸', 'Adoption depends on policy/requirements. Separate concern from email auth (SPF/DKIM/DMARC).'), `dig +short DS ${domain}`));
		}

		try {
			const webTargets = [`${domain}`, `www.${domain}`, `mta-sts.${domain}`];
			const checks = [];
			for (const host of webTargets) {
				checks.push(await probeHttps(host));
			}
			results.web.checks = checks;
			const okCount = checks.filter((item) => item.ok).length;
			results.web.findings.push(
				mkFinding(
					'low',
					tr('HTTPS到達性（参考）', 'HTTPS reachability (reference)'),
					trf(
						'https:// への到達性を確認（no-corsのため厳密な判定ではない）.OK={ok}/{total}',
						'Check basic reachability over https:// (not strict due to no-cors). OK={ok}/{total}',
						{ ok: okCount, total: checks.length }
					),
					checks.map((item) => `${item.ok ? 'OK' : 'NG'} ${item.evidence}`).join('\n')
				)
			);
		} catch {
			// ignore best-effort web probe errors
		}

		const doSub = !!(opts && opts.subdomainScan);
		results.subdomains.enabled = doSub;
		if (doSub) {
			try {
				const candidates = [
					`autodiscover.${domain}`,
					`mta-sts.${domain}`,
					`mail.${domain}`,
					`smtp.${domain}`,
					`imap.${domain}`,
					`pop.${domain}`
				];
				const found = [];
				for (const name of candidates) {
					let a = [];
					let aaaa = [];
					let cn = [];
					try { a = extractA(await dohQuery(name, 'A')); } catch { a = []; }
					try { aaaa = extractAAAA(await dohQuery(name, 'AAAA')); } catch { aaaa = []; }
					try { cn = extractCNAME(await dohQuery(name, 'CNAME')); } catch { cn = []; }
					if (a.length || aaaa.length || cn.length) found.push({ name, a, aaaa, cn });
				}
				results.subdomains.found = found;
				if (!found.length) {
					results.subdomains.findings.push(mkFinding('low', tr('サブドメイン探索: 該当なし', 'Subdomain check: none found'), tr('代表的なサブドメインは見つからなかった（このチェックは網羅的ではない）', 'No common subdomains were found (this check is not exhaustive).'), candidates.join('\n')));
				} else {
					const evidence = found.map((item) => {
						const lines = [];
						if (item.cn && item.cn.length) lines.push(`CNAME ${item.cn[0]}`);
						if (item.a && item.a.length) lines.push(`A ${item.a.slice(0, 3).join(', ')}`);
						if (item.aaaa && item.aaaa.length) lines.push(`AAAA ${item.aaaa.slice(0, 2).join(', ')}`);
						return `${item.name}\n  ${lines.join('\n  ')}`;
					}).join('\n\n');
					results.subdomains.findings.push(mkFinding('low', tr('サブドメイン探索（小規模）', 'Subdomain check (small)'), tr('代表的な候補だけを確認した.管理下ドメイン,または許可を得た範囲でのみ使用する', 'Checked only a small set of common names. Use only on domains you manage or have permission to test.'), evidence));
				}
			} catch (error) {
				results.errors.push(`サブドメイン探索に失敗: ${String(error)}`);
				results.subdomains.findings.push(mkFinding('low', tr('サブドメイン探索: 失敗', 'Subdomain check: failed'), tr('一部のDNS照会に失敗した可能性', 'Some DNS lookups may have failed.'), ''));
			}
		}

		const score = computeOverallScore(results);
		results.score.overall = score.score;
		results.score.spf = score.spfScore;
		results.score.chips = score.chips;
		results.score.spfChips = score.spfChips;

		try {
			if (!results.dmarc.record) {
				results.priority.push({
					level: 'high',
					title: tr('DMARC が未設定', 'DMARC missing'),
					action: tr('まず p=none で開始し,rua を受け取れる状態にしてから段階的に強化', 'Start with p=none, set up rua reporting, then tighten in stages')
				});
				const dmarcValue = `v=DMARC1; p=none; rua=mailto:postmaster@${domain}; fo=1`;
				pushFixup({
					level: 'high',
					title: tr('安全な初手: DMARC を公開', 'Safe first step: publish DMARC'),
					summary: tr('まずは監視用の p=none で導入し、集計レポートを受け取れる状態を作る', 'Start with monitoring-only p=none and make sure aggregate reports can be received.'),
					records: [{
						label: 'DMARC',
						host: `_dmarc.${domain}`,
						type: 'TXT',
						currentValue: tr('未設定', 'Not set'),
						suggestedValue: dmarcValue,
						copyText: buildTxtFixRecord(`_dmarc.${domain}`, dmarcValue)
					}],
					verify: `dig +short TXT _dmarc.${domain}`,
					rollback: tr('追加した TXT を削除するか、直前の値に戻す', 'Remove the TXT you added, or restore the previous value.')
				});
			} else {
				const p = (parseTagValue(results.dmarc.record, 'p') || '').toLowerCase();
				const ruaValue = parseTagValue(results.dmarc.record, 'rua');
				const dmarcTags = parseDmarcTags(results.dmarc.record);
				if (p === 'none') {
					results.priority.push({
						level: 'med',
						title: tr('DMARC が p=none', 'DMARC is p=none'),
						action: tr('監視結果を見ながら quarantine/reject へ段階移行を検討', 'Review reports and consider staged move to quarantine/reject')
					});
					const stagedTags = { ...dmarcTags, p: 'quarantine', pct: dmarcTags.pct || '25' };
					if (!stagedTags.rua) stagedTags.rua = `mailto:postmaster@${domain}`;
					if (!stagedTags.v) stagedTags.v = 'DMARC1';
					const stagedValue = dmarcTagsToRecord(stagedTags);
					pushFixup({
						level: 'med',
						title: tr('次の候補: DMARC を quarantine へ段階強化', 'Next candidate: move DMARC toward quarantine'),
						summary: tr('rua を見ながら誤判定が少ないことを確認できたら、まずは pct を小さくして quarantine を試す', 'Once rua reports look clean, try quarantine first with a smaller pct before going broader.'),
						records: [{
							label: 'DMARC',
							host: `_dmarc.${domain}`,
							type: 'TXT',
							currentValue: results.dmarc.record,
							suggestedValue: stagedValue,
							copyText: buildTxtFixRecord(`_dmarc.${domain}`, stagedValue)
						}],
						verify: `dig +short TXT _dmarc.${domain}`,
						rollback: tr('値を直前の p=none レコードへ戻す', 'Restore the previous p=none record if you see false positives.')
					});
				}
				if (!ruaValue) {
					results.priority.push({
						level: 'med',
						title: tr('DMARC rua が未設定', 'DMARC rua missing'),
						action: tr('集計レポートを受け取れるメールボックスを用意して rua を設定', 'Set up a mailbox for aggregate reports and configure rua')
					});
					const ruaTags = { ...dmarcTags, v: dmarcTags.v || 'DMARC1', rua: `mailto:postmaster@${domain}` };
					const ruaRecord = dmarcTagsToRecord(ruaTags);
					pushFixup({
						level: 'med',
						title: tr('DMARC に rua を追加', 'Add rua to DMARC'),
						summary: tr('既存ポリシーは維持したまま、集計レポートの送信先だけを追加する', 'Keep the current policy and add only an aggregate report destination.'),
						records: [{
							label: 'DMARC',
							host: `_dmarc.${domain}`,
							type: 'TXT',
							currentValue: results.dmarc.record,
							suggestedValue: ruaRecord,
							copyText: buildTxtFixRecord(`_dmarc.${domain}`, ruaRecord)
						}],
						verify: `dig +short TXT _dmarc.${domain}`,
						rollback: tr('rua を追加する前の DMARC 値へ戻す', 'Restore the previous DMARC value without rua.')
					});
				}
			}

			const spf = (results.spf.records && results.spf.records.length === 1) ? results.spf.records[0] : '';
			if (!results.spf.records || results.spf.records.length === 0) {
				results.priority.push({
					level: 'med',
					title: tr('SPF が未設定', 'SPF missing'),
					action: tr('送信元を棚卸しして SPF を設計（いきなり -all は避ける）', 'Inventory senders and design SPF (avoid jumping straight to -all)')
				});
				pushFixup({
					level: 'med',
					title: tr('SPF のたたき台を作る', 'Create an SPF starting draft'),
					summary: tr('利用中の送信元を洗い出して include / ip4 を埋める。最初は ~all にして、確認後に厳格化する', 'List your real senders, fill in include / ip4, and start with ~all before tightening later.'),
					records: [{
						label: 'SPF draft',
						host: domain,
						type: 'TXT',
						currentValue: tr('未設定', 'Not set'),
						suggestedValue: 'v=spf1 include:MAIL-SERVICE-1 include:MAIL-SERVICE-2 ~all',
						copyText: buildTxtFixRecord(domain, 'v=spf1 include:MAIL-SERVICE-1 include:MAIL-SERVICE-2 ~all')
					}],
					verify: `dig +short TXT ${domain}`,
					rollback: tr('追加した TXT を削除するか、以前の値に戻す', 'Remove the TXT you added, or restore the previous value.')
				});
			} else if (results.spf.records.length > 1) {
				results.priority.push({
					level: 'high',
					title: tr('SPF が複数', 'Multiple SPF records'),
					action: tr('SPF は 1 レコードに統合する（評価が不定になりやすい）', 'Consolidate SPF into a single record (avoid ambiguous evaluation)')
				});
				const draft = spfDraftFromRecords(results.spf.records);
				pushFixup({
					level: 'high',
					title: tr('SPF を 1 レコードへ統合', 'Consolidate SPF into one record'),
					summary: tr('複数の SPF をそのまま残さず、必要な include / ip4 を 1 本へまとめる', 'Do not keep multiple SPF records; combine the needed include / ip4 terms into one record.'),
					records: [{
						label: 'SPF draft',
						host: domain,
						type: 'TXT',
						currentValue: results.spf.records.join('\n'),
						suggestedValue: draft,
						copyText: buildTxtFixRecord(domain, draft)
					}],
					verify: `dig +short TXT ${domain}`,
					rollback: tr('変更前の SPF 値を控えてから差し替える', 'Keep the current SPF values so you can restore them if needed.')
				});
			} else if (spf && spfHasAllQualifier(spf, '+')) {
				results.priority.push({
					level: 'high',
					title: tr('SPF が +all', 'SPF is +all'),
					action: tr('+all をやめて送信元を限定（早急）', 'Remove +all and restrict senders (urgent)')
				});
				const saferSpf = spf.replace(/\+all\b/i, '~all');
				pushFixup({
					level: 'high',
					title: tr('SPF の +all を外す', 'Remove +all from SPF'),
					summary: tr('まずは誰でも送れてしまう状態をやめて、監視寄りの ~all へ下げる', 'First remove the allow-anyone behavior and step down to ~all for a safer rollout.'),
					records: [{
						label: 'SPF',
						host: domain,
						type: 'TXT',
						currentValue: spf,
						suggestedValue: saferSpf,
						copyText: buildTxtFixRecord(domain, saferSpf)
					}],
					verify: `dig +short TXT ${domain}`,
					rollback: tr('直前の SPF 値へ戻す', 'Restore the previous SPF value if needed.')
				});
			} else if (spf && spfEstimateLookupRisk(spf) >= 10) {
				results.priority.push({
					level: 'med',
					title: tr('SPF の lookup 上限リスク', 'SPF lookup limit risk'),
					action: tr('include/redirect の整理で 10 lookup を超えないようにする', 'Simplify include/redirect to stay within 10 lookups')
				});
			}

			const dkimConfirmed = (results.dkim && Array.isArray(results.dkim.confirmedSelectors)) ? results.dkim.confirmedSelectors : [];
			const dkimCandidates = (results.dkim && Array.isArray(results.dkim.selectors)) ? results.dkim.selectors : [];
			if (!dkimConfirmed.length && !dkimCandidates.length) {
				results.priority.push({
					level: 'high',
					title: tr('DKIM が未確認/未設定', 'DKIM unverified/missing'),
					action: tr('利用している送信基盤（Microsoft 365/Google/SaaS）で DKIM 署名を有効化し公開キーを設定', 'Enable DKIM signing in your sender (Microsoft 365/Google/SaaS) and publish the public key')
				});
				pushFixup({
					level: 'med',
					title: tr('DKIM は送信サービス側で有効化する', 'Enable DKIM in your sender'),
					summary: tr('DKIM は provider ごとに selector と公開方法が異なるため、送信基盤の管理画面で selector を確認してから DNS を追加する', 'DKIM selectors and publishing methods vary by provider, so confirm the selector in your sender console before adding DNS records.'),
					verify: dkimLookupHints(domain),
					rollback: tr('送信基盤で DKIM を無効化し、追加した selector レコードを削除する', 'Disable DKIM in the sender console and remove the selector records you added.')
				});
			}

			if (!results.mta_sts.record) {
				const idStamp = results.meta.timestamp.slice(0, 10).replace(/-/g, '') + '01';
				const mtaStsValue = `v=STSv1; id=${idStamp}`;
				pushFixup({
					level: 'low',
					title: tr('MTA-STS の TXT を追加', 'Add the MTA-STS TXT'),
					summary: tr('受信側 TLS を強制したい場合の入口。TXT に加えて policy file の公開も必要', 'This is the DNS entry point if you want inbound TLS enforcement. You also need to host the policy file.'),
					records: [{
						label: 'MTA-STS',
						host: `_mta-sts.${domain}`,
						type: 'TXT',
						currentValue: tr('未設定', 'Not set'),
						suggestedValue: mtaStsValue,
						copyText: buildTxtFixRecord(`_mta-sts.${domain}`, mtaStsValue)
					}],
					verify: `dig +short TXT _mta-sts.${domain}\n\nhttps://mta-sts.${domain}/.well-known/mta-sts.txt`,
					rollback: tr('TXT を削除し、公開した policy file も取り下げる', 'Remove the TXT record and withdraw the hosted policy file.')
				});
			}

			if (!results.mta_sts.tlsrpt) {
				const tlsRptValue = `v=TLSRPTv1; rua=mailto:tlsrpt@${domain}`;
				pushFixup({
					level: 'low',
					title: tr('TLS-RPT を追加', 'Add TLS-RPT'),
					summary: tr('MTA-STS と合わせて使うと、TLS 配送の失敗をレポートで追える', 'When paired with MTA-STS, TLS-RPT helps you track delivery failures related to TLS.'),
					records: [{
						label: 'TLS-RPT',
						host: `_smtp._tls.${domain}`,
						type: 'TXT',
						currentValue: tr('未設定', 'Not set'),
						suggestedValue: tlsRptValue,
						copyText: buildTxtFixRecord(`_smtp._tls.${domain}`, tlsRptValue)
					}],
					verify: `dig +short TXT _smtp._tls.${domain}`,
					rollback: tr('追加した TXT を削除するか、以前の値へ戻す', 'Remove the TXT you added, or restore the previous value.')
				});
			}
		} catch {
			// ignore recommendation synthesis failures
		}

		results.mailProvider = detectMailProvider({
			mxRecords: results.mx.records,
			spfRecords: results.spf.records,
			dkimSelectors: results.dkim.selectors || [],
			dkimUsesCname: !!results.dkim.usesCname
		});
		results.fixups = remediation;
		return results;
	};
}

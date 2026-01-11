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

/* RUA service page i18n additions (customer-facing). */
/* replace RFC 7489 §7.1 */
(function () {
  window.I18N = window.I18N || {};
  function add(lang, entries) {
    window.I18N[lang] = Object.assign(window.I18N[lang] || {}, entries);
  }

  function onlyRuaKeys(dict) {
    const out = {};
    for (const [k, v] of Object.entries(dict || {})) {
      if (String(k).startsWith('rua.')) out[k] = v;
    }
    return out;
  }

  // Japanese
  add('ja', {
    'rua.pageTitle': 'Toppy DNS / RUA サービス仕様',
    'rua.pill': 'RUA（DMARC 集計レポート）サービス — 仕様（要点）',
    'rua.h1': 'RUA の受け口 / 停止設計 / データ扱い',
    'rua.tagline': '無料トライアルは 30 日で自動停止します.継続には明示的な opt-in が必要です.停止後は、新たな RUA レポートを（外部宛て承認 DNS の無効化により）受け取らない設計です.',

    'rua.setup.title': 'RUA の設定（顧客側）',
    'rua.setup.intro.html': 'DMARC レコードの <span class="code">rua=</span> に、当サービスで発行される RUA 受信先（<span class="code">mailto:</span>）を設定します<strong>既存の DMARC 設定（p= / sp= / adkim= / aspf= など）は維持したまま</strong>、<span class="code">rua=</span> だけを追加（または更新）してください.',
    'rua.setup.step1.html': '<strong>1)</strong> あなたのドメインの DMARC レコード（通常 <span class="code">_dmarc</span>）を編集します.',
    'rua.setup.step2.html': '<strong>2)</strong> <span class="code">rua=mailto:{RUA_EMAIL}</span> を追加（または更新）します（すでに <span class="code">rua=</span> がある場合は mailto を追記できます）.',
    'rua.setup.step3.html': '<strong>3)</strong> 一部の受信者は、外部宛て RUA を許可するための承認 DNS を要求します（RFC 7489 §7.1: Verifying External Destinations）.その場合でも、<strong>当サービスが当社ドメイン側で必要な TXT を自動発行</strong>します.あなたの DNS に追加作業は不要です.',
    'rua.setup.step4.html': '<strong>4)</strong> DNS 反映後、通常 24〜48 時間以内にレポートが届き始めます（受信者側のスケジュールにより前後します）.',
    'rua.setup.note': '注意: すでに DMARC レコードがある場合は、他の設定は維持したまま rua= だけを追加してください（複数の mailto を並べることも可能です）.',


    'rua.disclaimer.title': '免責事項',
    'rua.disclaimer.body': '無料トライアル（30日）.継続はワンクリックの明示 opt-in.ベストエフォート（フェアユース制限）、SLA なし.',

    'rua.what.title': 'RUA とは',
    'rua.what.body': 'RUA は DMARC の集計レポート（Aggregate Report）の送信先です.受信側（Gmail / Microsoft / 各社 ISP など）から、通常 1 日 1 回程度、認証結果の集計が XML で届きます.',
    'rua.what.note': '重要: これは「メール本文」ではなく集計メタデータです.ただし、運用上は十分センシティブになり得ます.',
    'rua.what.ruf.html': '参考: DMARC には <span class="code">ruf=</span>（フォレンジック/失敗レポート）もありますが、個別メッセージに関する情報を含み得るため、プライバシー/コンプライアンス上は慎重な扱いが必要です.当サービスは <span class="code">rua=</span>（集計）に限定して扱います.',

    'rua.contains.title': 'RUA に含まれる情報（代表例）',
    'rua.contains.li1': '対象ドメイン（レポート対象）',
    'rua.contains.li2': '送信元 IP と、その IP からの配信通数（count）',
    'rua.contains.li3': 'SPF / DKIM / DMARC の評価結果（pass/fail など）',
    'rua.contains.li4': 'From ドメインの整合（alignment）結果',
    'rua.contains.li5': 'レポート期間（begin/end）とレポーティング組織情報（reporter 名など）',

    'rua.risk.title': '最大のリスク（重要）',
    'rua.risk.p1.html': 'RUA は本文を含みませんが、<strong>送信インフラ（送信元IP・通数・送信サービスの利用状況）</strong>を推測できる材料が含まれます.漏洩すると、攻撃者が送信経路を学習し、標的選定やフィッシング/なりすましの精度向上に悪用される可能性があります.',
    'rua.risk.p2.html': 'つまり「本文がない＝安全」ではなく、<strong>組織のメール運用の地図</strong>になり得る、というのが最大のリスクです.',
    'rua.risk.mitigate.html': 'このリスクを最小限にするため、当社は <strong>データ最小化（原本XMLの非保存）</strong>、<strong>最小権限のアクセス制御</strong>、<strong>自動処理</strong>、<strong>必要最小限の非可逆集計のみ</strong>、および <strong>停止時の削除・流入停止</strong> を徹底します.',

    'rua.data.title': 'データの扱い（非保存・自動処理）',
    'rua.data.li1': 'RUA レポート（XML）は保存しません（永続化なし）.',
    'rua.data.li2': '個別レポートを人が閲覧する運用は想定しません（自動処理）.',
    'rua.data.li3': '表示・改善提案に必要な最小限の「非可逆な集計」のみを生成し、元データは破棄します.',
    'rua.data.li4': '停止時は（もし保存データがあれば）削除し、以後の流入も止めます.',
    'rua.data.note': '※「非可逆な集計」とは、特定の 1 件のレポート内容に戻せない形（例: 日次の合計カウント）を指します.運用上これすら不要な場合は“集計も保持しない”設計にします.',

    'rua.gdpr.title': 'プライバシー / GDPR（要約）',
    'rua.gdpr.intro': '利用者が把握すべき要点と、EU 一般データ保護規則（GDPR）に沿った当社の方針を要約しています（法的助言ではありません）.',

    'rua.gdpr.user.title': '利用者が把握すべきこと（重要）',
    'rua.gdpr.user.li1': '権限と適法性: 管理するドメイン、または明示的に許可を得た範囲でのみ利用してください（RUA 受領先の設定は管理上の行為です）.',
    'rua.gdpr.user.li2': '個人データ該当の可能性: 送信元 IP や（場合により）連絡先メールアドレス等が含まれ、状況によって個人データに該当し得ます.社内ポリシーに従い、必要に応じて法的根拠（正当な利益等）を整理してください.',
    'rua.gdpr.user.li3': '機密扱い: 本文はありませんが、運用状況を推測できる情報です.社内の機密情報として扱うことを推奨します.',
    'rua.gdpr.user.li4': '停止/削除: 停止後は流入を止め、当社側の関連データは原則削除します.DNS 側の停止も必ず実施してください（後述）.',

    'rua.gdpr.us.title': '当社が適切に対応する点（要点）',
    'rua.gdpr.us.li1': 'データ最小化: RUA XML 原本は保存せず、必要最小限の非可逆集計のみを扱います.',
    'rua.gdpr.us.li2': '目的外利用なし: 広告/マーケティングに利用しません（RUA のデータにはこれらの目的に利用できる情報は含まれません.加えて、設計上、個別レポートを保存しないため、その目的に利用できるデータを保持しません）.',
    'rua.gdpr.us.li3': '安全管理措置: アクセス制御、最小権限、暗号化等の安全管理措置により機密性・完全性の確保に努めます.',
    'rua.gdpr.us.li4': '委託管理: 外部委託がある場合は GDPR に沿った契約（DPA 等）と管理を行います.',
    'rua.gdpr.us.li5': '削除と協力: 停止/削除やデータ主体の権利行使は、管理者（顧客）からの要請に協力します.',

    'rua.roles.title': '役割（Controller / Processor）',
    'rua.roles.li1.html': '<strong>顧客（あなた/あなたの組織）:</strong> 通常、RUA の受領・分析の目的と手段を決めるため、GDPR 上の <strong>管理者（Controller）</strong> になります.',
    'rua.roles.li2.html': '<strong>当サービス提供者:</strong> 顧客の指示に従って受領・解析するため、通常 <strong>処理者（Processor）</strong> として行動します（DPA/契約で明確化）.',

    'rua.dataTypes.title': '取り扱う可能性があるデータ（代表例）',
    'rua.dataTypes.li1': '対象ドメイン、レポート期間、認証結果（SPF/DKIM/DMARC の pass/fail など）',
    'rua.dataTypes.li2': '送信元 IP アドレスと通数（集計）',
    'rua.dataTypes.li3': 'レポーティング組織情報（組織名、場合により連絡用メールアドレス等）',
    'rua.dataTypes.note': '注意: IP アドレスや連絡先メールアドレス等は、状況によって個人データ（personal data）に該当し得ます.',

    'rua.purpose.title': '処理目的',
    'rua.purpose.li1': 'なりすまし/誤認証の兆候把握、送信経路の健全性確認（セキュリティ運用）',
    'rua.purpose.li2': 'SPF/DKIM/DMARC の設定改善提案、段階的適用の検証',
    'rua.purpose.li3': '（必要最小限）サービス提供の維持・不正利用防止（レート制御、障害対応）',

    'rua.legal.title': '法的根拠（一般的な例）',
    'rua.legal.li1.html': '<strong>管理者（顧客）側:</strong> 通常は正当な利益（GDPR 6(1)(f): セキュリティ確保）または契約の履行（6(1)(b)）等が想定されます.',
    'rua.legal.li2.html': '<strong>処理者（当サービス）側:</strong> 顧客との契約（DPA）に基づき、顧客の文書化された指示に従って処理します（GDPR 28）.',
    'rua.legal.note': '用途・社内方針により変わるため、正式なプライバシー通知では顧客側での根拠も整理してください.',

    'rua.retention.title': '保持期間と削除',
    'rua.retention.li1.html': '<strong>RUA XML（原本）:</strong> 保存しません（受領後の処理で破棄）.',
    'rua.retention.li2.html': '<strong>非可逆な集計:</strong> 表示/改善提案に必要な範囲に限定し、継続がない場合は <strong>30日（トライアル終了）を上限</strong>として削除します（設計目標）.',
    'rua.retention.li3.html': '<strong>停止後:</strong> 原則として関連データを削除し、以後の流入を止めます（上記の停止設計）.',

    'rua.subprocessors.title': '第三者提供 / 委託（Sub-processors）',
    'rua.subprocessors.body.html': '当サービスがホスティング、ストレージ、監視等を外部事業者に委託する場合、それらは GDPR 上のサブプロセッサ（Sub-processor）になり得ます.正式運用では、<strong>委託先一覧（事業者名/国/目的）</strong>を提示し、必要に応じて契約条項（DPA、SCC 等）を整備します.',

    'rua.transfer.title': '第三国移転（EEA 外への移転）',
    'rua.transfer.body': 'EEA 外に移転される可能性がある構成の場合、適用法に従い、標準契約条項（SCC）等の適切な保護措置を講じます.',

    'rua.rights.title': 'データ主体の権利（請求窓口）',
    'rua.rights.li1': 'アクセス、訂正、消去、処理制限、異議申立て、データポータビリティ等（該当する範囲で）',
    'rua.rights.li2.html': '通常、請求はまず <strong>管理者（顧客）</strong> が窓口になります.当サービスは処理者として、管理者の要請に協力します.',

    'rua.contact.title': '連絡先',
    'rua.contact.body.html': 'プライバシー/データ処理に関する問い合わせ: <strong>privacy@toppymicros.com</strong><br>事業者名: <strong>ToppyMicroServices OÜ</strong>（ドメイン: <strong>toppymicros.com</strong>）',

    'rua.complaints.title': '苦情申立て',
    'rua.complaints.body': 'EU/EEA 居住者は、居住地または関連する監督機関（SA）に苦情を申し立てる権利があります.',

    'rua.trial.title': 'トライアルと停止（要点）',
    'rua.trial.li1.html': '<strong>トライアル開始日:</strong> RUA 受信（有効化）が初めて成功した日',
    'rua.trial.li2.html': '<strong>トライアル終了日:</strong> 開始日から 30 日後（ローカル表示は残日数で提示）',
    'rua.trial.li3.html': '<strong>継続操作:</strong> ワンクリックの明示 opt-in（例: “Keep enabled”）',
    'rua.trial.li4.html': '<strong>デフォルト停止:</strong> 30 日で自動停止（opt-in が無ければ継続しない）',
    'rua.trial.li5.html': '<strong>停止時のデータ:</strong> 原則削除（必要なら匿名の稼働メトリクスのみ）',

    'rua.stop.title': '停止後の RUA 受信を止める方法',
    'rua.stop.intro': '推奨順は次の通りです.',
    'rua.stop.a.title.html': '<strong>A（推奨）:</strong> 外部 RUA 許可 DNS を無効化して送信者側に止めさせる（送信元が“送れない”状態にする）',
    'rua.stop.a.detail': '例: RUA 送信先の許可に使っている TXT / CNAME を無効化し、送信が成立しない状態にする.',
    'rua.stop.b.title.html': '<strong>B:</strong> 受信は受けるが破棄（コスト増、最終手段）',
    'rua.stop.b.detail': '到達したレポートを即時破棄する.停止保証は強いが、ネットワーク/処理コストが増える.',

    'rua.ui.title': 'UI（ダッシュボード上部に固定表示）',
    'rua.ui.li1': '残日数表示: 「あと◯日」',
    'rua.ui.li2': '継続ボタン: “Keep enabled”',
    'rua.ui.li3': '即時停止ボタン: “Stop now”',
    'rua.ui.li4': '状態は常にファーストビューで確認でき、スクロールしても見える位置に固定表示します.',

    'rua.links.back': '← Back to Quick Check',
    'rua.links.spec': 'Service spec (docs)'
  });

  // English
  const ruaEn = {
    'rua.pageTitle': 'Toppy DNS / RUA Service Spec',
    'rua.pill': 'RUA (DMARC Aggregate Reports) Service — Key Spec',
    'rua.h1': 'RUA endpoint / stop design / data handling',
    'rua.tagline': 'The free trial stops automatically after 30 days. Continuing requires an explicit opt-in. After stopping, the system is designed not to receive new RUA reports (by disabling the external-destination authorization DNS).',

    'rua.setup.title': 'How to configure RUA (customer side)',
    'rua.setup.intro.html': 'Set the RUA destination issued by this service (<span class="code">mailto:</span>) in your DMARC record’s <span class="code">rua=</span>. <strong>Keep your existing DMARC settings (p= / sp= / adkim= / aspf=, etc.)</strong> and only add (or update) <span class="code">rua=</span>.',
    'rua.setup.step1.html': '<strong>1)</strong> Edit your domain’s DMARC record (typically <span class="code">_dmarc</span>).',
    'rua.setup.step2.html': '<strong>2)</strong> Add (or update) <span class="code">rua=mailto:{RUA_EMAIL}</span> (if you already have <span class="code">rua=</span>, you can append another mailto destination).',
    'rua.setup.step3.html': '<strong>3)</strong> Some receivers require an authorization DNS record for external RUA destinations (RFC 7489 §7.1: Verifying External Destinations). Even in that case, <strong>this service automatically issues the required TXT under our domain</strong>. No DNS changes are needed on your side.',
    'rua.setup.step4.html': '<strong>4)</strong> After DNS propagation, reports usually start arriving within 24–48 hours (timing varies by receiver).',
    'rua.setup.note': 'Note: if you already have a DMARC record, keep your existing policy/tags and only add the rua= destination (multiple mailto destinations are possible).',


    'rua.disclaimer.title': 'Disclaimer',
    'rua.disclaimer.body': 'Free trial (30 days). Keep enabled with one click (explicit opt-in). Best-effort with fair-use limits; no SLA.',

    'rua.what.title': 'What is RUA?',
    'rua.what.body': 'RUA is the destination for DMARC aggregate reports. Receivers (Gmail / Microsoft / ISPs) send a daily-ish XML summary of authentication results for mail claiming your domain.',
    'rua.what.note': 'Important: this is not email content. It is aggregated metadata, which can still be sensitive in operations.',
    'rua.what.ruf.html': 'Note: DMARC also has <span class="code">ruf=</span> (forensic/failure reports), which may include per-message details and therefore require careful privacy/compliance handling. This service is limited to <span class="code">rua=</span> (aggregate reports).',

    'rua.contains.title': 'What a RUA report typically contains',
    'rua.contains.li1': 'Target domain (the domain being reported)',
    'rua.contains.li2': 'Source IPs and message counts (count)',
    'rua.contains.li3': 'SPF / DKIM / DMARC evaluation results (pass/fail, etc.)',
    'rua.contains.li4': 'From-domain alignment results',
    'rua.contains.li5': 'Report period (begin/end) and reporting organization info',

    'rua.risk.title': 'The biggest risk (important)',
    'rua.risk.p1.html': 'RUA does not include mail bodies, but it can reveal clues about your <strong>sending infrastructure (source IPs, volumes, and sender services)</strong>. If leaked, attackers may learn your sending paths and use that to improve targeting, phishing, or spoofing.',
    'rua.risk.p2.html': 'So it is not “safe because there is no body”. It can become a <strong>map of your organization\'s email operations</strong>.',
    'rua.risk.mitigate.html': 'To minimize this risk, we enforce <strong>data minimization (no raw XML storage)</strong>, <strong>least-privilege access control</strong>, <strong>automated processing</strong>, <strong>only minimal irreversible aggregation</strong>, and <strong>deletion + intake stop on termination</strong>.',

    'rua.data.title': 'Data handling (no storage / automated)',
    'rua.data.li1': 'We do not store the raw RUA XML (no persistence).',
    'rua.data.li2': 'We do not operate on the assumption that humans review individual reports.',
    'rua.data.li3': 'We generate only the minimum irreversible aggregates needed for display/recommendations, then discard the source data.',
    'rua.data.li4': 'When stopped, we delete any related stored data (if any) and stop further intake.',
    'rua.data.note': '“Irreversible aggregation” means outputs that cannot be used to reconstruct an individual report (e.g., daily totals). If even that is unnecessary, we design it to store no aggregates either.',

    'rua.gdpr.title': 'Privacy / GDPR (summary)',
    'rua.gdpr.intro': 'This section summarizes what users should know and how we handle data in line with GDPR (not legal advice).',

    'rua.gdpr.user.title': 'What you should be aware of (important)',
    'rua.gdpr.user.li1': 'Authority & legality: use this service only for domains you control or have explicit permission for (setting a RUA destination is an administrative action).',
    'rua.gdpr.user.li2': 'Potential personal data: source IPs and sometimes contact emails may appear and can be personal data depending on context. Align your lawful basis per your internal policy.',
    'rua.gdpr.user.li3': 'Treat as confidential: no mail bodies, but it can expose operational patterns. Handle as confidential information.',
    'rua.gdpr.user.li4': 'Stop/deletion: after stopping, we stop intake and delete related data by default. Also stop it in DNS (see below) to avoid accidental continued sending.',

    'rua.gdpr.us.title': 'What we do (key points)',
    'rua.gdpr.us.li1': 'Data minimization: no raw XML storage; only minimal irreversible aggregation.',
    'rua.gdpr.us.li2': 'No secondary use: not used for advertising/marketing (RUA is not suitable for those purposes, and we do not retain per-report data that could enable it).',
    'rua.gdpr.us.li3': 'Security measures: we apply access control, least privilege, encryption, etc. to protect confidentiality and integrity.',
    'rua.gdpr.us.li4': 'Sub-processor management: if we use vendors, we manage them under GDPR-aligned terms (e.g., DPA).',
    'rua.gdpr.us.li5': 'Deletion & cooperation: we support deletion/rights requests via the controller (customer).',

    'rua.roles.title': 'Roles (Controller / Processor)',
    'rua.roles.li1.html': '<strong>Customer (you/your organization):</strong> typically the <strong>Controller</strong>, deciding purposes and means of receiving/analyzing RUA.',
    'rua.roles.li2.html': '<strong>Service provider:</strong> typically the <strong>Processor</strong>, processing under documented instructions (per DPA/contract).',

    'rua.dataTypes.title': 'Data we may process (typical)',
    'rua.dataTypes.li1': 'Domain, report period, authentication outcomes (SPF/DKIM/DMARC pass/fail, etc.)',
    'rua.dataTypes.li2': 'Source IPs and counts (aggregated)',
    'rua.dataTypes.li3': 'Reporting organization info (and sometimes contact emails)',
    'rua.dataTypes.note': 'Note: IP addresses and contact emails can be personal data depending on context.',

    'rua.purpose.title': 'Processing purposes',
    'rua.purpose.li1': 'Detect spoofing / mis-auth signals and validate sender health (security operations)',
    'rua.purpose.li2': 'Provide SPF/DKIM/DMARC improvement guidance and validate staged rollout',
    'rua.purpose.li3': 'Maintain service and prevent abuse (rate limiting, incident response) with minimal data',

    'rua.legal.title': 'Legal basis (general examples)',
    'rua.legal.li1.html': '<strong>Controller (customer):</strong> often legitimate interests (GDPR 6(1)(f): security) or contract (6(1)(b)), depending on use.',
    'rua.legal.li2.html': '<strong>Processor (this service):</strong> processes under contract/DPA and documented instructions (GDPR 28).',
    'rua.legal.note': 'This depends on your use case and internal policy. For formal notices, define your lawful basis accordingly.',

    'rua.retention.title': 'Retention & deletion',
    'rua.retention.li1.html': '<strong>Raw RUA XML:</strong> not stored; discarded after processing.',
    'rua.retention.li2.html': '<strong>Irreversible aggregates:</strong> limited to what is needed; deleted up to <strong>30 days (trial end)</strong> if not continued (design target).',
    'rua.retention.li3.html': '<strong>After stopping:</strong> related data is deleted by default and further intake is stopped.',

    'rua.subprocessors.title': 'Third parties / sub-processors',
    'rua.subprocessors.body.html': 'If we use vendors for hosting/storage/monitoring, they may be GDPR sub-processors. In production, we provide a <strong>vendor list (name/country/purpose)</strong> and put appropriate terms in place (DPA, SCC, etc.) as needed.',

    'rua.transfer.title': 'International transfers (outside EEA)',
    'rua.transfer.body': 'If data may be transferred outside the EEA, we apply appropriate safeguards such as Standard Contractual Clauses (SCC), as required.',

    'rua.rights.title': 'Data subject rights (request channel)',
    'rua.rights.li1': 'Access, rectification, erasure, restriction, objection, portability, etc. (as applicable)',
    'rua.rights.li2.html': 'Requests are typically handled by the <strong>Controller (customer)</strong>. As a processor, we cooperate on the controller\'s request.',

    'rua.contact.title': 'Contact',
    'rua.contact.body.html': 'Privacy/data processing inquiries: <strong>privacy@toppymicros.com</strong><br>Operator: <strong>ToppyMicroServices OÜ</strong> (domain: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'Complaints',
    'rua.complaints.body': 'EU/EEA residents have the right to lodge a complaint with their local supervisory authority (SA).',

    'rua.trial.title': 'Trial & stopping (key points)',
    'rua.trial.li1.html': '<strong>Trial starts:</strong> first successful intake (activation) of RUA',
    'rua.trial.li2.html': '<strong>Trial ends:</strong> 30 days after start (show remaining days in UI)',
    'rua.trial.li3.html': '<strong>Continue:</strong> explicit opt-in with one click (e.g., “Keep enabled”)',
    'rua.trial.li4.html': '<strong>Default:</strong> stop automatically at day 30 (no opt-in, no continuation)',
    'rua.trial.li5.html': '<strong>Data on stop:</strong> deleted by default (optionally keep anonymous service metrics)',

    'rua.stop.title': 'How to stop RUA after termination',
    'rua.stop.intro': 'Recommended order:',
    'rua.stop.a.title.html': '<strong>A (recommended):</strong> disable the external RUA authorization DNS so senders cannot deliver',
    'rua.stop.a.detail': 'Example: disable the TXT/CNAME used to authorize the RUA destination so delivery cannot succeed.',
    'rua.stop.b.title.html': '<strong>B:</strong> accept but discard (higher cost; last resort)',
    'rua.stop.b.detail': 'Discard on arrival. Strong stop guarantee but increases network/processing costs.',

    'rua.ui.title': 'UI (fixed at top of dashboard)',
    'rua.ui.li1': 'Remaining days: “◯ days left”',
    'rua.ui.li2': 'Continue button: “Keep enabled”',
    'rua.ui.li3': 'Stop now button: “Stop now”',
    'rua.ui.li4': 'Status stays visible above the fold and remains fixed while scrolling.',

    'rua.links.back': '← Back to Quick Check',
    'rua.links.spec': 'Service spec (docs)'
  };
  add('en', ruaEn);

  // Vietnamese
  add('vi', {
    'rua.pageTitle': 'Toppy DNS / Đặc tả dịch vụ RUA',
    'rua.pill': 'Dịch vụ RUA (báo cáo tổng hợp DMARC) — Tóm tắt đặc tả',
    'rua.h1': 'Điểm nhận RUA / thiết kế dừng / xử lý dữ liệu',
    'rua.tagline': 'Dùng thử miễn phí, tự dừng sau 30 ngày. Muốn tiếp tục cần xác nhận rõ ràng (opt-in). Sau khi dừng, sẽ không nhận báo cáo RUA mới.',

    'rua.setup.title': 'Cách cấu hình RUA (phía khách hàng)',
    'rua.setup.intro.html': 'Đặt địa chỉ RUA do dịch vụ này cấp (<span class="code">mailto:</span>) vào tham số <span class="code">rua=</span> trong bản ghi DMARC. <strong>Giữ nguyên các thiết lập DMARC hiện có (p= / sp= / adkim= / aspf=, v.v.)</strong> và chỉ thêm (hoặc cập nhật) <span class="code">rua=</span>.',
    'rua.setup.step1.html': '<strong>1)</strong> Chỉnh sửa bản ghi DMARC của tên miền (thường là <span class="code">_dmarc</span>).',
    'rua.setup.step2.html': '<strong>2)</strong> Thêm (hoặc cập nhật) <span class="code">rua=mailto:{RUA_EMAIL}</span>.',
    'rua.setup.step3.html': '<strong>3)</strong> Một số bên nhận yêu cầu bản ghi DNS để ủy quyền gửi báo cáo tới đích bên ngoài (RFC 7489 §7.1). Tuy nhiên, <strong>dịch vụ này sẽ tự động tạo bản ghi TXT cần thiết dưới tên miền của chúng tôi</strong>; bạn không cần thay đổi DNS.',
    'rua.setup.step4.html': '<strong>4)</strong> Sau khi DNS cập nhật, báo cáo thường bắt đầu đến trong 24–48 giờ.',
    'rua.setup.note': 'Lưu ý: nếu bạn đã có bản ghi DMARC, hãy giữ nguyên các tag/policy hiện có và chỉ thêm rua= (có thể dùng nhiều địa chỉ mailto).',

    'rua.disclaimer.title': 'Tuyên bố miễn trừ',
    'rua.disclaimer.body': 'Dùng thử miễn phí (30 ngày). Tiếp tục bằng một cú nhấp (opt-in rõ ràng). Best-effort theo giới hạn fair-use; không có SLA.',

    'rua.what.title': 'RUA là gì?',
    'rua.what.body': 'RUA là điểm đến cho báo cáo tổng hợp DMARC. Bên nhận (Gmail / Microsoft / các ISP) thường gửi một bản tóm tắt XML hằng ngày về kết quả xác thực cho email “nhận dạng là” tên miền của bạn.',
    'rua.what.note': 'Quan trọng: đây không phải nội dung email. Đây là metadata tổng hợp, nhưng vẫn có thể nhạy cảm về vận hành.',
    'rua.what.ruf.html': 'Ghi chú: DMARC cũng có <span class="code">ruf=</span> (báo cáo forensic/thất bại) có thể chứa chi tiết theo từng email, vì vậy cần xử lý thận trọng về quyền riêng tư/tuân thủ. Dịch vụ này chỉ xử lý <span class="code">rua=</span> (báo cáo tổng hợp).',

    'rua.contains.title': 'Một báo cáo RUA thường gồm',
    'rua.contains.li1': 'Tên miền mục tiêu (tên miền được báo cáo)',
    'rua.contains.li2': 'IP nguồn và số lượng thư (count)',
    'rua.contains.li3': 'Kết quả SPF / DKIM / DMARC (pass/fail, v.v.)',
    'rua.contains.li4': 'Kết quả alignment của From-domain',
    'rua.contains.li5': 'Khoảng thời gian báo cáo (begin/end) và thông tin tổ chức báo cáo',

    'rua.risk.title': 'Rủi ro lớn nhất (quan trọng)',
    'rua.risk.p1.html': 'RUA không chứa nội dung thư, nhưng có thể hé lộ <strong>hạ tầng gửi (IP nguồn, lưu lượng, dịch vụ gửi)</strong>. Nếu rò rỉ, kẻ tấn công có thể học đường đi gửi và dùng để nhắm mục tiêu, phishing hoặc giả mạo hiệu quả hơn.',
    'rua.risk.p2.html': 'Vì vậy không phải “an toàn vì không có nội dung”. Nó có thể trở thành <strong>bản đồ vận hành email của tổ chức</strong>.',
    'rua.risk.mitigate.html': 'Để giảm thiểu rủi ro, chúng tôi áp dụng <strong>tối thiểu hóa dữ liệu (không lưu XML thô)</strong>, <strong>kiểm soát truy cập theo nguyên tắc ít quyền nhất</strong>, <strong>xử lý tự động</strong>, <strong>chỉ giữ tổng hợp tối thiểu và không thể đảo ngược</strong>, và <strong>xóa + dừng tiếp nhận khi chấm dứt</strong>.',

    'rua.data.title': 'Xử lý dữ liệu (không lưu trữ / tự động)',
    'rua.data.li1': 'Không lưu XML RUA thô (không lưu bền vững).',
    'rua.data.li2': 'Không giả định con người sẽ xem từng báo cáo riêng lẻ.',
    'rua.data.li3': 'Chỉ tạo tổng hợp không thể đảo ngược ở mức tối thiểu cho hiển thị/khuyến nghị, rồi hủy dữ liệu nguồn.',
    'rua.data.li4': 'Khi dừng, xóa dữ liệu liên quan (nếu có) và dừng tiếp nhận tiếp theo.',
    'rua.data.note': '“Tổng hợp không thể đảo ngược” là đầu ra không thể dùng để khôi phục lại từng báo cáo (ví dụ: tổng theo ngày). Nếu không cần, chúng tôi có thể thiết kế để không lưu cả tổng hợp.',

    'rua.gdpr.title': 'Quyền riêng tư / GDPR (tóm tắt)',
    'rua.gdpr.intro': 'Mục này tóm tắt điều người dùng cần biết và cách chúng tôi xử lý dữ liệu phù hợp GDPR (không phải tư vấn pháp lý).',

    'rua.gdpr.user.title': 'Bạn cần lưu ý (quan trọng)',
    'rua.gdpr.user.li1': 'Thẩm quyền & hợp pháp: chỉ dùng cho tên miền bạn quản lý hoặc có cho phép rõ ràng (thiết lập đích RUA là hành vi quản trị).',
    'rua.gdpr.user.li2': 'Khả năng là dữ liệu cá nhân: IP nguồn và đôi khi email liên hệ có thể xuất hiện và có thể là dữ liệu cá nhân tùy bối cảnh. Hãy xác định cơ sở pháp lý theo chính sách nội bộ.',
    'rua.gdpr.user.li3': 'Xem như thông tin mật: không có nội dung thư nhưng có thể lộ mẫu vận hành. Nên xử lý như dữ liệu mật.',
    'rua.gdpr.user.li4': 'Dừng/xóa: sau khi dừng, chúng tôi dừng tiếp nhận và mặc định xóa dữ liệu liên quan. Đồng thời hãy dừng trong DNS (bên dưới) để tránh tiếp tục gửi ngoài ý muốn.',

    'rua.gdpr.us.title': 'Chúng tôi thực hiện (điểm chính)',
    'rua.gdpr.us.li1': 'Tối thiểu hóa dữ liệu: không lưu XML thô; chỉ tổng hợp tối thiểu và không thể đảo ngược.',
    'rua.gdpr.us.li2': 'Không dùng cho mục đích khác: không dùng cho quảng cáo/marketing (RUA không phù hợp cho mục đích này, và chúng tôi không giữ dữ liệu theo từng báo cáo để có thể dùng cho mục đích đó).',
    'rua.gdpr.us.li3': 'Biện pháp an ninh: kiểm soát truy cập, ít quyền nhất, mã hóa, v.v. để bảo vệ tính bảo mật và toàn vẹn.',
    'rua.gdpr.us.li4': 'Quản lý nhà thầu phụ: nếu dùng nhà cung cấp, chúng tôi quản lý theo điều khoản phù hợp GDPR (ví dụ: DPA).',
    'rua.gdpr.us.li5': 'Xóa & hợp tác: hỗ trợ yêu cầu xóa/quyền của chủ thể dữ liệu thông qua bên Controller (khách hàng).',

    'rua.roles.title': 'Vai trò (Controller / Processor)',
    'rua.roles.li1.html': '<strong>Khách hàng (bạn/tổ chức của bạn):</strong> thường là <strong>Controller</strong>, quyết định mục đích và cách thức nhận/phân tích RUA.',
    'rua.roles.li2.html': '<strong>Nhà cung cấp dịch vụ:</strong> thường là <strong>Processor</strong>, xử lý theo chỉ dẫn đã được ghi nhận (theo DPA/hợp đồng).',

    'rua.dataTypes.title': 'Dữ liệu có thể xử lý (thường gặp)',
    'rua.dataTypes.li1': 'Tên miền, kỳ báo cáo, kết quả xác thực (SPF/DKIM/DMARC pass/fail, v.v.)',
    'rua.dataTypes.li2': 'IP nguồn và số lượng (dạng tổng hợp)',
    'rua.dataTypes.li3': 'Thông tin tổ chức báo cáo (và đôi khi email liên hệ)',
    'rua.dataTypes.note': 'Lưu ý: địa chỉ IP và email liên hệ có thể là dữ liệu cá nhân tùy bối cảnh.',

    'rua.purpose.title': 'Mục đích xử lý',
    'rua.purpose.li1': 'Phát hiện dấu hiệu giả mạo/sai xác thực và kiểm tra “sức khỏe” luồng gửi (vận hành an ninh)',
    'rua.purpose.li2': 'Đề xuất cải thiện SPF/DKIM/DMARC và xác minh triển khai theo từng giai đoạn',
    'rua.purpose.li3': 'Duy trì dịch vụ và ngăn lạm dụng (giới hạn tốc độ, xử lý sự cố) với dữ liệu tối thiểu',

    'rua.legal.title': 'Cơ sở pháp lý (ví dụ chung)',
    'rua.legal.li1.html': '<strong>Controller (khách hàng):</strong> thường là lợi ích hợp pháp (GDPR 6(1)(f): an ninh) hoặc hợp đồng (6(1)(b)), tùy trường hợp.',
    'rua.legal.li2.html': '<strong>Processor (dịch vụ):</strong> xử lý theo hợp đồng/DPA và chỉ dẫn đã được ghi nhận (GDPR 28).',
    'rua.legal.note': 'Tùy mục đích sử dụng và chính sách nội bộ. Với thông báo chính thức, hãy xác định cơ sở pháp lý phù hợp.',

    'rua.retention.title': 'Lưu giữ & xóa',
    'rua.retention.li1.html': '<strong>XML RUA thô:</strong> không lưu; hủy sau xử lý.',
    'rua.retention.li2.html': '<strong>Tổng hợp không thể đảo ngược:</strong> giới hạn ở mức cần thiết; nếu không tiếp tục thì xóa trong tối đa <strong>30 ngày (kết thúc thử nghiệm)</strong> (mục tiêu thiết kế).',
    'rua.retention.li3.html': '<strong>Sau khi dừng:</strong> mặc định xóa dữ liệu liên quan và dừng tiếp nhận.',

    'rua.subprocessors.title': 'Bên thứ ba / nhà thầu phụ',
    'rua.subprocessors.body.html': 'Nếu chúng tôi dùng nhà cung cấp cho hosting/lưu trữ/giám sát, họ có thể là sub-processor theo GDPR. Khi vận hành chính thức, chúng tôi cung cấp <strong>danh sách nhà cung cấp (tên/quốc gia/mục đích)</strong> và thiết lập điều khoản phù hợp (DPA, SCC, v.v.) khi cần.',

    'rua.transfer.title': 'Chuyển dữ liệu quốc tế (ngoài EEA)',
    'rua.transfer.body': 'Nếu dữ liệu có thể được chuyển ra ngoài EEA, chúng tôi áp dụng biện pháp bảo vệ phù hợp như SCC theo yêu cầu.',

    'rua.rights.title': 'Quyền của chủ thể dữ liệu (kênh yêu cầu)',
    'rua.rights.li1': 'Truy cập, chỉnh sửa, xóa, hạn chế xử lý, phản đối, di chuyển dữ liệu, v.v. (tùy phạm vi áp dụng)',
    'rua.rights.li2.html': 'Yêu cầu thường do <strong>Controller (khách hàng)</strong> tiếp nhận. Là processor, chúng tôi phối hợp theo yêu cầu của controller.',

    'rua.contact.title': 'Liên hệ',
    'rua.contact.body.html': 'Hỏi đáp về quyền riêng tư/xử lý dữ liệu: <strong>privacy@toppymicros.com</strong><br>Đơn vị vận hành: <strong>ToppyMicroServices OÜ</strong> (domain: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'Khiếu nại',
    'rua.complaints.body': 'Cư dân EU/EEA có quyền khiếu nại tới cơ quan giám sát (SA) tại địa phương.',

    'rua.trial.title': 'Dùng thử & dừng (điểm chính)',
    'rua.trial.li1.html': '<strong>Bắt đầu thử nghiệm:</strong> lần đầu tiếp nhận RUA thành công (kích hoạt)',
    'rua.trial.li2.html': '<strong>Kết thúc thử nghiệm:</strong> sau 30 ngày kể từ ngày bắt đầu (UI hiển thị số ngày còn lại)',
    'rua.trial.li3.html': '<strong>Tiếp tục:</strong> opt-in rõ ràng bằng một cú nhấp (ví dụ: “Keep enabled”)',
    'rua.trial.li4.html': '<strong>Mặc định:</strong> tự dừng ở ngày 30 (không opt-in thì không tiếp tục)',
    'rua.trial.li5.html': '<strong>Dữ liệu khi dừng:</strong> mặc định xóa (tùy chọn chỉ giữ số liệu dịch vụ ẩn danh)',

    'rua.stop.title': 'Cách dừng RUA sau khi chấm dứt',
    'rua.stop.intro': 'Thứ tự khuyến nghị:',
    'rua.stop.a.title.html': '<strong>A (khuyến nghị):</strong> vô hiệu DNS ủy quyền RUA bên ngoài để bên gửi không thể gửi được',
    'rua.stop.a.detail': 'Ví dụ: tắt TXT/CNAME dùng để ủy quyền đích RUA, khiến việc gửi không thể thành công.',
    'rua.stop.b.title.html': '<strong>B:</strong> vẫn nhận nhưng hủy (chi phí cao hơn; phương án cuối)',
    'rua.stop.b.detail': 'Hủy ngay khi nhận. Đảm bảo dừng tốt nhưng tăng chi phí mạng/xử lý.',

    'rua.ui.title': 'UI (cố định ở đầu dashboard)',
    'rua.ui.li1': 'Số ngày còn lại: “◯ days left”',
    'rua.ui.li2': 'Nút tiếp tục: “Keep enabled”',
    'rua.ui.li3': 'Nút dừng ngay: “Stop now”',
    'rua.ui.li4': 'Trạng thái luôn hiển thị ở phần đầu và cố định khi cuộn.',

    'rua.links.back': '← Quay lại Quick Check',
    'rua.links.spec': 'Đặc tả dịch vụ (docs)'
  });

  // Thai
  add('th', {
    'rua.pageTitle': 'Toppy DNS / สเปกบริการ RUA',
    'rua.pill': 'บริการ RUA (รายงานสรุป DMARC) — สเปกแบบย่อ',
    'rua.h1': 'ปลายทางรับ RUA / การออกแบบการหยุด / การจัดการข้อมูล',
    'rua.tagline': 'ทดลองใช้งานฟรีจะหยุดอัตโนมัติหลัง 30 วัน การใช้งานต่อจำเป็นต้องยืนยันแบบ opt-in อย่างชัดเจน หลังหยุดแล้วจะไม่รับรายงาน RUA ใหม่',

    'rua.setup.title': 'วิธีตั้งค่า RUA (ฝั่งลูกค้า)',
    'rua.setup.intro.html': 'ตั้งค่าปลายทาง RUA ที่บริการนี้ออกให้ (<span class="code">mailto:</span>) ในพารามิเตอร์ <span class="code">rua=</span> ของเรคคอร์ด DMARC <strong>คงค่า DMARC เดิมไว้ (p= / sp= / adkim= / aspf= ฯลฯ)</strong> และเพิ่ม (หรือแก้ไข) เฉพาะ <span class="code">rua=</span> เท่านั้น',
    'rua.setup.step1.html': '<strong>1)</strong> แก้ไขเรคคอร์ด DMARC ของโดเมน (มักเป็น <span class="code">_dmarc</span>)',
    'rua.setup.step2.html': '<strong>2)</strong> เพิ่ม (หรือแก้ไข) <span class="code">rua=mailto:{RUA_EMAIL}</span>',
    'rua.setup.step3.html': '<strong>3)</strong> ผู้รับบางรายอาจต้องการ DNS เพื่ออนุญาตการส่งรายงานไปยังปลายทางภายนอก (RFC 7489 §7.1) แต่ <strong>บริการจะออก TXT ที่จำเป็นภายใต้โดเมนของเราโดยอัตโนมัติ</strong>; ฝั่งคุณไม่ต้องแก้ไข DNS',
    'rua.setup.step4.html': '<strong>4)</strong> หลัง DNS มีผล รายงานมักเริ่มเข้าภายใน 24–48 ชั่วโมง',
    'rua.setup.note': 'หมายเหตุ: หากมีเรคคอร์ด DMARC อยู่แล้ว ให้คงค่าเดิมไว้และเพิ่มเฉพาะ rua= (รองรับหลาย mailto ได้)',

    'rua.disclaimer.title': 'ข้อจำกัดความรับผิดชอบ',
    'rua.disclaimer.body': 'ทดลองใช้งานฟรี (30 วัน) ต่ออายุด้วยการกด 1 ครั้ง (opt-in ชัดเจน) ให้บริการแบบ best-effort พร้อมข้อจำกัด fair-use; ไม่มี SLA',

    'rua.what.title': 'RUA คืออะไร?',
    'rua.what.body': 'RUA คือปลายทางสำหรับรายงานสรุป DMARC ผู้รับ (เช่น Gmail / Microsoft / ISP ต่างๆ) มักส่งสรุปผลการยืนยันตัวตนเป็น XML วันละครั้งสำหรับอีเมลที่อ้างว่าเป็นโดเมนของคุณ',
    'rua.what.note': 'สำคัญ: ไม่ใช่เนื้อหาอีเมล แต่เป็นเมทาดาทาสรุป ซึ่งยังอาจมีความอ่อนไหวในเชิงปฏิบัติการ',
    'rua.what.ruf.html': 'หมายเหตุ: DMARC ยังมี <span class="code">ruf=</span> (รายงาน forensic/ล้มเหลว) ซึ่งอาจมีรายละเอียดต่อข้อความ ทำให้ต้องระมัดระวังด้านความเป็นส่วนตัว/การปฏิบัติตามข้อกำหนด บริการนี้รองรับเฉพาะ <span class="code">rua=</span> (รายงานสรุป) เท่านั้น',

    'rua.contains.title': 'ข้อมูลที่รายงาน RUA มักมี',
    'rua.contains.li1': 'โดเมนเป้าหมาย (โดเมนที่ถูกรายงาน)',
    'rua.contains.li2': 'IP ต้นทางและจำนวนข้อความ (count)',
    'rua.contains.li3': 'ผล SPF / DKIM / DMARC (pass/fail เป็นต้น)',
    'rua.contains.li4': 'ผล alignment ของ From-domain',
    'rua.contains.li5': 'ช่วงเวลารายงาน (begin/end) และข้อมูลองค์กรผู้รายงาน',

    'rua.risk.title': 'ความเสี่ยงที่ใหญ่ที่สุด (สำคัญ)',
    'rua.risk.p1.html': 'RUA ไม่มีเนื้อหาอีเมล แต่สามารถบอกใบ้เกี่ยวกับ <strong>โครงสร้างการส่ง (IP ต้นทาง ปริมาณ และบริการผู้ส่ง)</strong> ได้ หากรั่วไหล ผู้โจมตีอาจเรียนรู้เส้นทางการส่งและนำไปใช้เพื่อเลือกเป้าหมาย ฟิชชิง หรือปลอมแปลงได้แม่นยำขึ้น',
    'rua.risk.p2.html': 'ดังนั้นจึงไม่ใช่ “ปลอดภัยเพราะไม่มีเนื้อหา” แต่สามารถเป็น <strong>แผนที่การปฏิบัติการอีเมลขององค์กร</strong> ได้',
    'rua.risk.mitigate.html': 'เพื่อจำกัดความเสี่ยง เราดำเนินการ <strong>ลดข้อมูลให้เหลือน้อยที่สุด (ไม่เก็บ XML ดิบ)</strong>, <strong>ควบคุมสิทธิ์แบบน้อยที่สุด</strong>, <strong>ประมวลผลอัตโนมัติ</strong>, <strong>เก็บเฉพาะสรุปแบบย้อนกลับไม่ได้ขั้นต่ำ</strong>, และ <strong>ลบ + หยุดรับเมื่อยุติ</strong> อย่างเคร่งครัด',

    'rua.data.title': 'การจัดการข้อมูล (ไม่เก็บ / อัตโนมัติ)',
    'rua.data.li1': 'ไม่เก็บไฟล์ XML RUA ดิบ (ไม่จัดเก็บถาวร)',
    'rua.data.li2': 'ไม่ออกแบบให้คนต้องเปิดดูรายงานรายฉบับ',
    'rua.data.li3': 'สร้างเฉพาะสรุปแบบย้อนกลับไม่ได้ขั้นต่ำสำหรับการแสดงผล/คำแนะนำ แล้วทิ้งข้อมูลต้นทาง',
    'rua.data.li4': 'เมื่อหยุด จะลบข้อมูลที่เกี่ยวข้อง (หากมี) และหยุดรับต่อ',
    'rua.data.note': '“สรุปแบบย้อนกลับไม่ได้” หมายถึงผลลัพธ์ที่ไม่สามารถใช้ย้อนกลับไปสร้างรายงานรายฉบับได้ (เช่น ยอดรวมรายวัน) หากไม่จำเป็น เราสามารถออกแบบให้ไม่เก็บแม้แต่สรุป',

    'rua.gdpr.title': 'ความเป็นส่วนตัว / GDPR (สรุป)',
    'rua.gdpr.intro': 'สรุปประเด็นที่ผู้ใช้ควรรู้และแนวทางการจัดการข้อมูลตาม GDPR (ไม่ใช่คำแนะนำทางกฎหมาย)',

    'rua.gdpr.user.title': 'สิ่งที่คุณควรทราบ (สำคัญ)',
    'rua.gdpr.user.li1': 'อำนาจและความชอบด้วยกฎหมาย: ใช้เฉพาะโดเมนที่คุณควบคุมหรือได้รับอนุญาตอย่างชัดเจน (การตั้งค่า RUA เป็นการกระทำเชิงผู้ดูแลระบบ)',
    'rua.gdpr.user.li2': 'อาจเป็นข้อมูลส่วนบุคคล: IP ต้นทาง และบางครั้งอีเมลติดต่อ อาจเป็นข้อมูลส่วนบุคคลตามบริบท ควรกำหนดฐานกฎหมายตามนโยบายภายใน',
    'rua.gdpr.user.li3': 'ถือเป็นความลับ: ไม่มีเนื้อหา แต่สะท้อนรูปแบบการปฏิบัติงาน ควรจัดเป็นข้อมูลลับ',
    'rua.gdpr.user.li4': 'หยุด/ลบ: หลังหยุด เราจะหยุดรับและลบข้อมูลที่เกี่ยวข้องโดยค่าเริ่มต้น และควรหยุดใน DNS ด้วย (ดูด้านล่าง) เพื่อป้องกันการส่งต่อโดยไม่ตั้งใจ',

    'rua.gdpr.us.title': 'สิ่งที่เราทำ (ประเด็นหลัก)',
    'rua.gdpr.us.li1': 'ลดข้อมูล: ไม่เก็บ XML ดิบ เก็บเฉพาะสรุปแบบย้อนกลับไม่ได้ขั้นต่ำ',
    'rua.gdpr.us.li2': 'ไม่ใช้เพื่อวัตถุประสงค์อื่น: ไม่ใช้เพื่อโฆษณา/การตลาด (RUA ไม่เหมาะกับวัตถุประสงค์ดังกล่าว และเราไม่เก็บข้อมูลรายรายงานที่ทำให้ใช้ได้)',
    'rua.gdpr.us.li3': 'มาตรการความปลอดภัย: ควบคุมการเข้าถึง สิทธิ์ขั้นต่ำ การเข้ารหัส ฯลฯ เพื่อปกป้องความลับและความถูกต้องครบถ้วน',
    'rua.gdpr.us.li4': 'การจัดการผู้รับจ้างช่วง: หากใช้ผู้ให้บริการภายนอก จะจัดการภายใต้ข้อกำหนดสอดคล้อง GDPR (เช่น DPA)',
    'rua.gdpr.us.li5': 'การลบและความร่วมมือ: สนับสนุนคำขอลบ/สิทธิของเจ้าของข้อมูลผ่าน Controller (ลูกค้า)',

    'rua.roles.title': 'บทบาท (Controller / Processor)',
    'rua.roles.li1.html': '<strong>ลูกค้า (คุณ/องค์กรของคุณ):</strong> โดยทั่วไปเป็น <strong>Controller</strong> กำหนดวัตถุประสงค์และวิธีการรับ/วิเคราะห์ RUA',
    'rua.roles.li2.html': '<strong>ผู้ให้บริการ:</strong> โดยทั่วไปเป็น <strong>Processor</strong> ประมวลผลตามคำสั่งที่บันทึกไว้ (ตาม DPA/สัญญา)',

    'rua.dataTypes.title': 'ข้อมูลที่เราอาจประมวลผล (ทั่วไป)',
    'rua.dataTypes.li1': 'โดเมน ช่วงเวลารายงาน ผลการยืนยัน (SPF/DKIM/DMARC pass/fail เป็นต้น)',
    'rua.dataTypes.li2': 'IP ต้นทางและจำนวน (แบบสรุป)',
    'rua.dataTypes.li3': 'ข้อมูลองค์กรผู้รายงาน (และบางครั้งอีเมลติดต่อ)',
    'rua.dataTypes.note': 'หมายเหตุ: ที่อยู่ IP และอีเมลติดต่อ อาจเป็นข้อมูลส่วนบุคคลตามบริบท',

    'rua.purpose.title': 'วัตถุประสงค์ของการประมวลผล',
    'rua.purpose.li1': 'ตรวจจับสัญญาณการปลอมแปลง/การยืนยันผิดพลาด และตรวจสอบความถูกต้องของเส้นทางการส่ง (งานความปลอดภัย)',
    'rua.purpose.li2': 'ให้คำแนะนำปรับปรุง SPF/DKIM/DMARC และตรวจสอบการนำไปใช้แบบเป็นขั้นตอน',
    'rua.purpose.li3': 'รักษาการให้บริการและป้องกันการใช้งานผิด (จำกัดอัตรา ตอบสนองเหตุการณ์) ด้วยข้อมูลขั้นต่ำ',

    'rua.legal.title': 'ฐานกฎหมาย (ตัวอย่างทั่วไป)',
    'rua.legal.li1.html': '<strong>Controller (ลูกค้า):</strong> มักเป็นประโยชน์โดยชอบด้วยกฎหมาย (GDPR 6(1)(f): ความปลอดภัย) หรือสัญญา (6(1)(b)) ตามกรณี',
    'rua.legal.li2.html': '<strong>Processor (บริการนี้):</strong> ประมวลผลตามสัญญา/DPA และคำสั่งที่บันทึกไว้ (GDPR 28)',
    'rua.legal.note': 'ขึ้นกับกรณีใช้งานและนโยบายภายใน สำหรับประกาศอย่างเป็นทางการ โปรดกำหนดฐานกฎหมายให้เหมาะสม',

    'rua.retention.title': 'การเก็บรักษาและการลบ',
    'rua.retention.li1.html': '<strong>XML RUA ดิบ:</strong> ไม่จัดเก็บ ทิ้งหลังประมวลผล',
    'rua.retention.li2.html': '<strong>สรุปแบบย้อนกลับไม่ได้:</strong> จำกัดเท่าที่จำเป็น และลบภายในไม่เกิน <strong>30 วัน (สิ้นสุดทดลอง)</strong> หากไม่ต่ออายุ (เป้าหมายการออกแบบ)',
    'rua.retention.li3.html': '<strong>หลังหยุด:</strong> ลบข้อมูลที่เกี่ยวข้องโดยค่าเริ่มต้น และหยุดรับต่อ',

    'rua.subprocessors.title': 'บุคคลที่สาม / ผู้รับจ้างช่วง',
    'rua.subprocessors.body.html': 'หากเราใช้ผู้ให้บริการสำหรับโฮสติ้ง/ที่เก็บข้อมูล/มอนิเตอร์ พวกเขาอาจเป็น sub-processor ตาม GDPR ในการใช้งานจริง เราจะให้ <strong>รายชื่อผู้ให้บริการ (ชื่อ/ประเทศ/วัตถุประสงค์)</strong> และจัดทำข้อกำหนดที่เหมาะสม (DPA, SCC ฯลฯ) เมื่อจำเป็น',

    'rua.transfer.title': 'การโอนข้อมูลข้ามประเทศ (นอก EEA)',
    'rua.transfer.body': 'หากมีความเป็นไปได้ที่จะโอนข้อมูลออกนอก EEA เราจะใช้มาตรการคุ้มครองที่เหมาะสม เช่น SCC ตามที่กฎหมายกำหนด',

    'rua.rights.title': 'สิทธิของเจ้าของข้อมูล (ช่องทางคำขอ)',
    'rua.rights.li1': 'การเข้าถึง แก้ไข ลบ จำกัดการประมวลผล คัดค้าน พกพาข้อมูล ฯลฯ (ตามที่มีผลบังคับใช้)',
    'rua.rights.li2.html': 'โดยทั่วไปคำขอจะผ่าน <strong>Controller (ลูกค้า)</strong> เป็นหลัก ในฐานะ processor เราจะให้ความร่วมมือตามคำขอของ controller',

    'rua.contact.title': 'ติดต่อ',
    'rua.contact.body.html': 'สอบถามด้านความเป็นส่วนตัว/การประมวลผลข้อมูล: <strong>privacy@toppymicros.com</strong><br>ผู้ให้บริการ: <strong>ToppyMicroServices OÜ</strong> (โดเมน: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'การร้องเรียน',
    'rua.complaints.body': 'ผู้อยู่อาศัยใน EU/EEA มีสิทธิยื่นคำร้องต่อหน่วยงานกำกับดูแล (SA) ในพื้นที่ของตน',

    'rua.trial.title': 'ทดลองใช้งานและการหยุด (ประเด็นหลัก)',
    'rua.trial.li1.html': '<strong>เริ่มทดลอง:</strong> รับ RUA สำเร็จครั้งแรก (เปิดใช้งาน)',
    'rua.trial.li2.html': '<strong>สิ้นสุดทดลอง:</strong> 30 วันหลังเริ่ม (UI แสดงจำนวนวันที่เหลือ)',
    'rua.trial.li3.html': '<strong>ใช้งานต่อ:</strong> opt-in ชัดเจนด้วยการกด 1 ครั้ง (เช่น “Keep enabled”)',
    'rua.trial.li4.html': '<strong>ค่าเริ่มต้น:</strong> หยุดอัตโนมัติวันที่ 30 (ไม่ opt-in ก็ไม่ต่อ)',
    'rua.trial.li5.html': '<strong>ข้อมูลเมื่อหยุด:</strong> ลบโดยค่าเริ่มต้น (อาจเก็บเฉพาะเมตริกบริการแบบไม่ระบุตัวตน)',

    'rua.stop.title': 'วิธีหยุด RUA หลังยุติบริการ',
    'rua.stop.intro': 'ลำดับที่แนะนำ:',
    'rua.stop.a.title.html': '<strong>A (แนะนำ):</strong> ปิด DNS อนุญาต RUA ภายนอกเพื่อให้ผู้ส่งไม่สามารถส่งได้',
    'rua.stop.a.detail': 'ตัวอย่าง: ปิด TXT/CNAME ที่ใช้อนุญาตปลายทาง RUA เพื่อให้การส่งไม่สำเร็จ',
    'rua.stop.b.title.html': '<strong>B:</strong> รับแต่ทิ้ง (ต้นทุนสูงขึ้น; ทางเลือกสุดท้าย)',
    'rua.stop.b.detail': 'ทิ้งทันทีเมื่อมาถึง รับประกันการหยุดได้ดี แต่เพิ่มต้นทุนเครือข่าย/การประมวลผล',

    'rua.ui.title': 'UI (ยึดติดด้านบนของแดชบอร์ด)',
    'rua.ui.li1': 'จำนวนวันที่เหลือ: “◯ days left”',
    'rua.ui.li2': 'ปุ่มใช้งานต่อ: “Keep enabled”',
    'rua.ui.li3': 'ปุ่มหยุดทันที: “Stop now”',
    'rua.ui.li4': 'สถานะต้องเห็นได้ทันทีและยึดติดเมื่อเลื่อนหน้าจอ',

    'rua.links.back': '← กลับไปที่ Quick Check',
    'rua.links.spec': 'สเปกบริการ (docs)'
  });

  // Indonesian
  add('id', {
    'rua.pageTitle': 'Toppy DNS / Spesifikasi Layanan RUA',
    'rua.pill': 'Layanan RUA (Laporan Agregat DMARC) — Ringkasan Spesifikasi',
    'rua.h1': 'Endpoint RUA / desain penghentian / penanganan data',
    'rua.tagline': 'Uji coba gratis berhenti otomatis setelah 30 hari. Untuk melanjutkan diperlukan opt-in yang eksplisit. Setelah berhenti, tidak ada laporan RUA baru yang diterima.',

    'rua.setup.title': 'Cara mengonfigurasi RUA (sisi pelanggan)',
    'rua.setup.intro.html': 'Setel tujuan RUA yang diterbitkan oleh layanan ini (<span class="code">mailto:</span>) pada tag <span class="code">rua=</span> di record DMARC Anda. <strong>Pertahankan pengaturan DMARC yang sudah ada (p= / sp= / adkim= / aspf=, dll.)</strong> dan hanya tambahkan (atau perbarui) <span class="code">rua=</span>.',
    'rua.setup.step1.html': '<strong>1)</strong> Edit record DMARC domain Anda (biasanya <span class="code">_dmarc</span>).',
    'rua.setup.step2.html': '<strong>2)</strong> Tambahkan (atau perbarui) <span class="code">rua=mailto:{RUA_EMAIL}</span>.',
    'rua.setup.step3.html': '<strong>3)</strong> Sebagian penerima memerlukan DNS untuk otorisasi tujuan RUA eksternal (RFC 7489 §7.1). Namun, <strong>layanan ini menerbitkan TXT yang diperlukan secara otomatis di bawah domain kami</strong>; tidak perlu perubahan DNS di sisi Anda.',
    'rua.setup.step4.html': '<strong>4)</strong> Setelah DNS terpropagasi, laporan biasanya mulai masuk dalam 24–48 jam.',
    'rua.setup.note': 'Catatan: jika Anda sudah memiliki record DMARC, pertahankan tag/policy yang ada dan cukup tambahkan rua= (bisa beberapa tujuan mailto).',

    'rua.disclaimer.title': 'Disklaimer',
    'rua.disclaimer.body': 'Uji coba gratis (30 hari). Lanjutkan dengan satu klik (opt-in eksplisit). Best-effort dengan batas fair-use; tanpa SLA.',

    'rua.what.title': 'Apa itu RUA?',
    'rua.what.body': 'RUA adalah tujuan laporan agregat DMARC. Penerima (Gmail / Microsoft / ISP) biasanya mengirim ringkasan XML harian tentang hasil autentikasi untuk email yang mengklaim domain Anda.',
    'rua.what.note': 'Penting: ini bukan isi email. Ini metadata agregat, namun tetap dapat sensitif secara operasional.',
    'rua.what.ruf.html': 'Catatan: DMARC juga memiliki <span class="code">ruf=</span> (laporan forensik/kegagalan) yang dapat berisi detail per pesan sehingga perlu kehati-hatian terkait privasi/kepatuhan. Layanan ini hanya menangani <span class="code">rua=</span> (laporan agregat).',

    'rua.contains.title': 'Isi umum laporan RUA',
    'rua.contains.li1': 'Domain target (domain yang dilaporkan)',
    'rua.contains.li2': 'IP sumber dan jumlah pesan (count)',
    'rua.contains.li3': 'Hasil evaluasi SPF / DKIM / DMARC (pass/fail, dll.)',
    'rua.contains.li4': 'Hasil alignment From-domain',
    'rua.contains.li5': 'Periode laporan (begin/end) dan info organisasi pelapor',

    'rua.risk.title': 'Risiko terbesar (penting)',
    'rua.risk.p1.html': 'RUA tidak berisi isi email, namun dapat mengungkap petunjuk tentang <strong>infrastruktur pengiriman (IP sumber, volume, layanan pengirim)</strong>. Jika bocor, penyerang dapat mempelajari jalur pengiriman dan menyalahgunakannya untuk penargetan, phishing, atau spoofing.',
    'rua.risk.p2.html': 'Jadi bukan “aman karena tidak ada isi”. Ini bisa menjadi <strong>peta operasi email organisasi</strong>.',
    'rua.risk.mitigate.html': 'Untuk meminimalkan risiko, kami menerapkan <strong>minimisasi data (tanpa penyimpanan XML mentah)</strong>, <strong>kontrol akses least-privilege</strong>, <strong>pemrosesan otomatis</strong>, <strong>hanya agregasi minimum yang tidak dapat dibalik</strong>, serta <strong>penghapusan + penghentian intake saat terminasi</strong>.',

    'rua.data.title': 'Penanganan data (tanpa penyimpanan / otomatis)',
    'rua.data.li1': 'Kami tidak menyimpan XML RUA mentah (tanpa persistensi).',
    'rua.data.li2': 'Kami tidak mengandalkan peninjauan manual laporan per laporan.',
    'rua.data.li3': 'Kami hanya membuat agregasi irreversibel minimum untuk tampilan/rekomendasi, lalu membuang data sumber.',
    'rua.data.li4': 'Saat dihentikan, kami menghapus data terkait (jika ada) dan menghentikan intake berikutnya.',
    'rua.data.note': '“Agregasi irreversibel” berarti output yang tidak dapat digunakan untuk merekonstruksi laporan individual (mis. total harian). Jika tidak diperlukan, kami dapat merancang agar tidak menyimpan agregat juga.',

    'rua.gdpr.title': 'Privasi / GDPR (ringkasan)',
    'rua.gdpr.intro': 'Bagian ini merangkum hal yang perlu diketahui pengguna dan cara kami menangani data selaras GDPR (bukan nasihat hukum).',

    'rua.gdpr.user.title': 'Hal yang perlu Anda ketahui (penting)',
    'rua.gdpr.user.li1': 'Otoritas & legalitas: gunakan hanya untuk domain yang Anda kendalikan atau dengan izin eksplisit (mengatur tujuan RUA adalah tindakan administratif).',
    'rua.gdpr.user.li2': 'Potensi data pribadi: IP sumber dan kadang email kontak dapat muncul dan dapat menjadi data pribadi tergantung konteks. Sesuaikan dasar hukum sesuai kebijakan internal.',
    'rua.gdpr.user.li3': 'Perlakukan sebagai rahasia: tanpa isi email, namun dapat mengekspos pola operasional. Perlakukan sebagai informasi rahasia.',
    'rua.gdpr.user.li4': 'Stop/penghapusan: setelah dihentikan, kami menghentikan intake dan menghapus data terkait secara default. Juga hentikan di DNS (di bawah) untuk menghindari pengiriman yang terus terjadi.',

    'rua.gdpr.us.title': 'Yang kami lakukan (poin utama)',
    'rua.gdpr.us.li1': 'Minimisasi data: tanpa penyimpanan XML mentah; hanya agregasi irreversibel minimum.',
    'rua.gdpr.us.li2': 'Tanpa penggunaan sekunder: tidak digunakan untuk iklan/marketing (RUA tidak cocok untuk itu, dan kami tidak menyimpan data per-laporan yang memungkinkan hal tersebut).',
    'rua.gdpr.us.li3': 'Keamanan: kontrol akses, least privilege, enkripsi, dll. untuk menjaga kerahasiaan dan integritas.',
    'rua.gdpr.us.li4': 'Manajemen sub-processor: jika kami memakai vendor, kami kelola dengan ketentuan selaras GDPR (mis. DPA).',
    'rua.gdpr.us.li5': 'Penghapusan & kerja sama: kami mendukung permintaan penghapusan/hak subjek data melalui controller (pelanggan).',

    'rua.roles.title': 'Peran (Controller / Processor)',
    'rua.roles.li1.html': '<strong>Pelanggan (Anda/organisasi Anda):</strong> biasanya <strong>Controller</strong>, menentukan tujuan dan cara menerima/menganalisis RUA.',
    'rua.roles.li2.html': '<strong>Penyedia layanan:</strong> biasanya <strong>Processor</strong>, memproses sesuai instruksi terdokumentasi (DPA/kontrak).',

    'rua.dataTypes.title': 'Data yang dapat kami proses (umum)',
    'rua.dataTypes.li1': 'Domain, periode laporan, hasil autentikasi (SPF/DKIM/DMARC pass/fail, dll.)',
    'rua.dataTypes.li2': 'IP sumber dan jumlah (agregat)',
    'rua.dataTypes.li3': 'Info organisasi pelapor (dan kadang email kontak)',
    'rua.dataTypes.note': 'Catatan: alamat IP dan email kontak dapat menjadi data pribadi tergantung konteks.',

    'rua.purpose.title': 'Tujuan pemrosesan',
    'rua.purpose.li1': 'Mendeteksi spoofing / sinyal autentikasi bermasalah dan memvalidasi kesehatan jalur pengiriman (operasi keamanan)',
    'rua.purpose.li2': 'Memberi rekomendasi perbaikan SPF/DKIM/DMARC dan memvalidasi rollout bertahap',
    'rua.purpose.li3': 'Menjaga layanan dan mencegah penyalahgunaan (rate limiting, respons insiden) dengan data minimum',

    'rua.legal.title': 'Dasar hukum (contoh umum)',
    'rua.legal.li1.html': '<strong>Controller (pelanggan):</strong> seringnya kepentingan sah (GDPR 6(1)(f): keamanan) atau kontrak (6(1)(b)), tergantung penggunaan.',
    'rua.legal.li2.html': '<strong>Processor (layanan ini):</strong> memproses berdasarkan kontrak/DPA dan instruksi terdokumentasi (GDPR 28).',
    'rua.legal.note': 'Bergantung pada use case dan kebijakan internal. Untuk pemberitahuan formal, tentukan dasar hukum yang sesuai.',

    'rua.retention.title': 'Retensi & penghapusan',
    'rua.retention.li1.html': '<strong>XML RUA mentah:</strong> tidak disimpan; dibuang setelah pemrosesan.',
    'rua.retention.li2.html': '<strong>Agregasi irreversibel:</strong> dibatasi seperlunya; dihapus hingga <strong>30 hari (akhir uji coba)</strong> bila tidak dilanjutkan (target desain).',
    'rua.retention.li3.html': '<strong>Setelah dihentikan:</strong> data terkait dihapus secara default dan intake dihentikan.',

    'rua.subprocessors.title': 'Pihak ketiga / sub-processor',
    'rua.subprocessors.body.html': 'Jika kami menggunakan vendor untuk hosting/penyimpanan/monitoring, mereka dapat menjadi sub-processor GDPR. Pada operasi produksi, kami menyediakan <strong>daftar vendor (nama/negara/tujuan)</strong> dan menyiapkan ketentuan yang sesuai (DPA, SCC, dll.) bila diperlukan.',

    'rua.transfer.title': 'Transfer internasional (di luar EEA)',
    'rua.transfer.body': 'Jika data berpotensi ditransfer ke luar EEA, kami menerapkan perlindungan yang sesuai seperti SCC, sesuai ketentuan.',

    'rua.rights.title': 'Hak subjek data (kanal permintaan)',
    'rua.rights.li1': 'Akses, koreksi, penghapusan, pembatasan pemrosesan, keberatan, portabilitas, dll. (sepanjang berlaku)',
    'rua.rights.li2.html': 'Permintaan biasanya ditangani oleh <strong>Controller (pelanggan)</strong>. Sebagai processor, kami bekerja sama atas permintaan controller.',

    'rua.contact.title': 'Kontak',
    'rua.contact.body.html': 'Pertanyaan privasi/pemrosesan data: <strong>privacy@toppymicros.com</strong><br>Operator: <strong>ToppyMicroServices OÜ</strong> (domain: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'Keluhan',
    'rua.complaints.body': 'Warga EU/EEA memiliki hak mengajukan keluhan ke otoritas pengawas (SA) setempat.',

    'rua.trial.title': 'Uji coba & penghentian (poin utama)',
    'rua.trial.li1.html': '<strong>Mulai uji coba:</strong> intake (aktivasi) RUA berhasil pertama kali',
    'rua.trial.li2.html': '<strong>Akhir uji coba:</strong> 30 hari setelah mulai (UI menampilkan sisa hari)',
    'rua.trial.li3.html': '<strong>Lanjutkan:</strong> opt-in eksplisit satu klik (mis. “Keep enabled”)',
    'rua.trial.li4.html': '<strong>Default:</strong> berhenti otomatis pada hari ke-30 (tanpa opt-in, tidak lanjut)',
    'rua.trial.li5.html': '<strong>Data saat berhenti:</strong> dihapus secara default (opsional menyimpan metrik anonim)',

    'rua.stop.title': 'Cara menghentikan RUA setelah terminasi',
    'rua.stop.intro': 'Urutan yang disarankan:',
    'rua.stop.a.title.html': '<strong>A (disarankan):</strong> nonaktifkan DNS otorisasi RUA eksternal agar pengirim tidak bisa mengirim',
    'rua.stop.a.detail': 'Contoh: nonaktifkan TXT/CNAME untuk mengotorisasi tujuan RUA sehingga pengiriman gagal.',
    'rua.stop.b.title.html': '<strong>B:</strong> terima lalu buang (biaya lebih tinggi; pilihan terakhir)',
    'rua.stop.b.detail': 'Buang saat diterima. Jaminan stop kuat, tetapi biaya jaringan/pemrosesan meningkat.',

    'rua.ui.title': 'UI (dipasang tetap di bagian atas dashboard)',
    'rua.ui.li1': 'Sisa hari: “◯ days left”',
    'rua.ui.li2': 'Tombol lanjut: “Keep enabled”',
    'rua.ui.li3': 'Tombol stop sekarang: “Stop now”',
    'rua.ui.li4': 'Status selalu terlihat di tampilan awal dan tetap terlihat saat scroll.',

    'rua.links.back': '← Kembali ke Quick Check',
    'rua.links.spec': 'Spesifikasi layanan (docs)'
  });

  // Estonian
  add('et', {
    'rua.pageTitle': 'Toppy DNS / RUA teenuse spetsifikatsioon',
    'rua.pill': 'RUA (DMARC koondraportid) teenus — põhispec',
    'rua.h1': 'RUA lõpp-punkt / peatamise disain / andmekäitlus',
    'rua.tagline': 'Tasuta prooviperiood peatub automaatselt 30 päeva järel. Jätkamiseks on vaja selgesõnalist opt-in kinnitust. Pärast peatamist uusi RUA raporteid ei vastu võeta.',

    'rua.setup.title': 'Kuidas RUA seadistada (kliendi poolel)',
    'rua.setup.intro.html': 'Seadista selle teenuse poolt väljastatud RUA siht (<span class="code">mailto:</span>) oma DMARC kirje <span class="code">rua=</span> parameetrisse. <strong>Säilita olemasolevad DMARC-seaded (p= / sp= / adkim= / aspf= jne)</strong> ja lisa (või uuenda) ainult <span class="code">rua=</span>.',
    'rua.setup.step1.html': '<strong>1)</strong> Muuda oma domeeni DMARC kirjet (tavaliselt <span class="code">_dmarc</span>).',
    'rua.setup.step2.html': '<strong>2)</strong> Lisa (või uuenda) <span class="code">rua=mailto:{RUA_EMAIL}</span>.',
    'rua.setup.step3.html': '<strong>3)</strong> Mõned vastuvõtjad nõuavad välise RUA sihtkoha DNS-autoriseerimist (RFC 7489 §7.1). Kuid <strong>teenus väljastab vajaliku TXT-kirje automaatselt meie domeeni all</strong>; sinu DNS-is pole muudatusi vaja.',
    'rua.setup.step4.html': '<strong>4)</strong> Pärast DNS-i levikut hakkavad raportid tavaliselt saabuma 24–48 tunni jooksul.',
    'rua.setup.note': 'Märkus: kui DMARC kirje on juba olemas, säilita olemasolevad tagid/poliitika ja lisa ainult rua= (võimalik on mitu mailto sihtkohta).',

    'rua.disclaimer.title': 'Lahtiütlus',
    'rua.disclaimer.body': 'Tasuta proov (30 päeva). Jätkamine ühe klõpsuga (selge opt-in). Parima pingutuse põhimõttel koos fair-use piirangutega; SLA puudub.',

    'rua.what.title': 'Mis on RUA?',
    'rua.what.body': 'RUA on DMARC koondraportite sihtkoht. Vastuvõtjad (Gmail / Microsoft / ISP-d) saadavad tavaliselt kord päevas XML-koondi autentimistulemustest kirjadele, mis väidavad end olevat teie domeenist.',
    'rua.what.note': 'Oluline: see ei ole kirjade sisu. See on koondatud metaandmestik, mis võib siiski olla operatiivselt tundlik.',
    'rua.what.ruf.html': 'Märkus: DMARC-is on ka <span class="code">ruf=</span> (forensika/ebaõnnestumise raportid), mis võivad sisaldada üksiksõnumi detaile ning vajavad seetõttu hoolikat privaatsus- ja vastavuskäsitlust. See teenus piirdub <span class="code">rua=</span> (koondraportitega).',

    'rua.contains.title': 'Mida RUA raport tavaliselt sisaldab',
    'rua.contains.li1': 'Sihtdomeen (raporti objekt)',
    'rua.contains.li2': 'Allika IP-d ja kirjade arv (count)',
    'rua.contains.li3': 'SPF / DKIM / DMARC tulemused (pass/fail jne)',
    'rua.contains.li4': 'From-domeeni joondumise (alignment) tulemus',
    'rua.contains.li5': 'Raporti periood (begin/end) ja raporteeriva organisatsiooni info',

    'rua.risk.title': 'Suurim risk (oluline)',
    'rua.risk.p1.html': 'RUA ei sisalda kirja sisu, kuid võib paljastada vihjeid teie <strong>saatmisteekonna ja infrastruktuuri (allika IP-d, mahud, saatmisteenused)</strong> kohta. Lekke korral võib ründaja õppida teie saatmisteid ja kasutada seda sihtimiseks, phishinguks või spoofinguks.',
    'rua.risk.p2.html': 'Seega ei ole see “turvaline, sest sisu puudub”. See võib kujuneda <strong>organisatsiooni e-postioperatsioonide kaardiks</strong>.',
    'rua.risk.mitigate.html': 'Riski vähendamiseks rakendame <strong>andmete minimeerimist (toorest XML-i ei säilitata)</strong>, <strong>vähimate õiguste ligipääsukontrolli</strong>, <strong>automatiseeritud töötlust</strong>, <strong>ainult minimaalset pöördumatut koondamist</strong> ning <strong>kustutamist + vastuvõtu peatamist lõpetamisel</strong>.',

    'rua.data.title': 'Andmekäitlus (ei säilitata / automatiseeritud)',
    'rua.data.li1': 'Toorest RUA XML-i ei salvestata (püsisäilitust ei ole).',
    'rua.data.li2': 'Me ei eelda, et inimesed vaatavad üksikuid raporteid.',
    'rua.data.li3': 'Kuvamiseks/soovitusteks loome ainult minimaalse pöördumatu koondi ja seejärel hävitame allikaandmed.',
    'rua.data.li4': 'Peatamisel kustutame seotud salvestatud andmed (kui neid on) ja peatame edasise vastuvõtu.',
    'rua.data.note': '“Pöördumatu koond” tähendab, et väljundist ei saa taastada üksikut raportit (nt päevased summad). Kui ka seda pole vaja, disainime nii, et koonde ei säilitata.',

    'rua.gdpr.title': 'Privaatsus / GDPR (kokkuvõte)',
    'rua.gdpr.intro': 'See jaotis võtab kokku, mida kasutajad peaksid teadma ja kuidas me käsitleme andmeid kooskõlas GDPR-iga (ei ole õigusnõu).',

    'rua.gdpr.user.title': 'Mida peaks teadma (oluline)',
    'rua.gdpr.user.li1': 'Õigus ja volitus: kasutage ainult domeenide puhul, mida kontrollite või milleks on selgesõnaline luba (RUA sihtkoha seadistamine on administratiivne toiming).',
    'rua.gdpr.user.li2': 'Võimalik isikuandmestik: allika IP-d ja mõnikord kontakt-e-post võivad olla isikuandmed sõltuvalt kontekstist. Kaardistage õiguslik alus vastavalt sisepoliitikale.',
    'rua.gdpr.user.li3': 'Käsitle konfidentsiaalsena: sisu pole, kuid operatsioonimustrid võivad avalduda. Soovitame käsitleda kui konfidentsiaalset infot.',
    'rua.gdpr.user.li4': 'Peatamine/kustutamine: pärast peatamist peatame vastuvõtu ja kustutame seotud andmed vaikimisi. Peatage ka DNS-is (allpool), et vältida jätkuvat saatmist.',

    'rua.gdpr.us.title': 'Mida meie teeme (põhipunktid)',
    'rua.gdpr.us.li1': 'Andmete minimeerimine: toorest XML-i ei säilitata; ainult minimaalne pöördumatu koond.',
    'rua.gdpr.us.li2': 'Ei mingit kõrvalkasutust: ei kasutata reklaami/turunduse jaoks (RUA ei sobi selleks ning me ei säilita raportipõhist andmestikku, mis seda võimaldaks).',
    'rua.gdpr.us.li3': 'Turvameetmed: ligipääsukontroll, vähimad õigused, krüpteerimine jne konfidentsiaalsuse ja tervikluse kaitseks.',
    'rua.gdpr.us.li4': 'Alltöövõtjate haldus: tarnijad kaetakse GDPR-iga kooskõlas olevate tingimustega (nt DPA).',
    'rua.gdpr.us.li5': 'Kustutamine ja koostöö: toetame kustutamis- ja õiguste taotlusi kontrolleri (kliendi) kaudu.',

    'rua.roles.title': 'Rollid (Controller / Processor)',
    'rua.roles.li1.html': '<strong>Klient (teie/teie organisatsioon):</strong> tavaliselt <strong>Controller</strong>, määrab RUA vastuvõtu/analüüsi eesmärgi ja vahendid.',
    'rua.roles.li2.html': '<strong>Teenusepakkuja:</strong> tavaliselt <strong>Processor</strong>, töötleb dokumenteeritud juhiste alusel (DPA/leping).',

    'rua.dataTypes.title': 'Andmed, mida võime töödelda (tüüpiline)',
    'rua.dataTypes.li1': 'Domeen, raportiperiood, autentimistulemused (SPF/DKIM/DMARC pass/fail jne)',
    'rua.dataTypes.li2': 'Allika IP-d ja kogused (koondatult)',
    'rua.dataTypes.li3': 'Raporteeriva organisatsiooni info (ja mõnikord kontakt-e-post)',
    'rua.dataTypes.note': 'Märkus: IP-aadressid ja kontakt-e-post võivad olla isikuandmed sõltuvalt kontekstist.',

    'rua.purpose.title': 'Töötluse eesmärgid',
    'rua.purpose.li1': 'Spoofingu / vale-autentimise märkide tuvastamine ja saatmistee tervise kontroll (turbeoperatsioonid)',
    'rua.purpose.li2': 'SPF/DKIM/DMARC parendussoovitused ja etapilise juurutuse valideerimine',
    'rua.purpose.li3': 'Teenuse ülalhoid ja kuritarvituse ennetus (rate limiting, intsidentide käsitlus) minimaalse andmestikuga',

    'rua.legal.title': 'Õiguslik alus (üldised näited)',
    'rua.legal.li1.html': '<strong>Controller (klient):</strong> sageli õigustatud huvi (GDPR 6(1)(f): turvalisus) või leping (6(1)(b)), sõltuvalt kasutusest.',
    'rua.legal.li2.html': '<strong>Processor (see teenus):</strong> töötleb lepingu/DPA ja dokumenteeritud juhiste alusel (GDPR 28).',
    'rua.legal.note': 'See sõltub kasutusest ja sisepoliitikast. Ametlikes teadetes määratlege sobiv õiguslik alus.',

    'rua.retention.title': 'Säilitamine ja kustutamine',
    'rua.retention.li1.html': '<strong>Toores RUA XML:</strong> ei säilitata; hävitatakse pärast töötlemist.',
    'rua.retention.li2.html': '<strong>Pöördumatu koond:</strong> ainult vajaliku ulatuses; kui ei jätkata, kustutatakse kuni <strong>30 päeva (proovi lõpp)</strong> (disaini eesmärk).',
    'rua.retention.li3.html': '<strong>Pärast peatamist:</strong> seotud andmed kustutatakse vaikimisi ja vastuvõtt peatub.',

    'rua.subprocessors.title': 'Kolmandad osapooled / alltöötlejad',
    'rua.subprocessors.body.html': 'Kui kasutame hostinguks/salvestuseks/monitooringuks tarnijaid, võivad nad olla GDPR-i alltöötlejad. Tootmises esitame <strong>tarnijate nimekirja (nimi/riik/eesmärk)</strong> ja rakendame vajalikud tingimused (DPA, SCC jne).',

    'rua.transfer.title': 'Rahvusvahelised edastused (väljaspool EEA-d)',
    'rua.transfer.body': 'Kui andmeid võidakse edastada EEA-st välja, rakendame nõutavaid kaitsemeetmeid, nt standardlepingutingimusi (SCC).',

    'rua.rights.title': 'Andmesubjekti õigused (taotluste kanal)',
    'rua.rights.li1': 'Juurdepääs, parandamine, kustutamine, töötlemise piiramine, vastuväide, ülekantavus jne (kohalduvas ulatuses)',
    'rua.rights.li2.html': 'Taotlusi haldab tavaliselt <strong>Controller (klient)</strong>. Töötlejana teeme koostööd kontrolleri taotluse alusel.',

    'rua.contact.title': 'Kontakt',
    'rua.contact.body.html': 'Privaatsus/andmetöötluse küsimused: <strong>privacy@toppymicros.com</strong><br>Operaator: <strong>ToppyMicroServices OÜ</strong> (domeen: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'Kaebused',
    'rua.complaints.body': 'EL/EMP elanikul on õigus esitada kaebus oma kohalikule järelevalveasutusele (SA).',

    'rua.trial.title': 'Prooviperiood ja peatamine (põhipunktid)',
    'rua.trial.li1.html': '<strong>Proov algab:</strong> RUA esimene edukas vastuvõtt (aktiveerimine)',
    'rua.trial.li2.html': '<strong>Proov lõpeb:</strong> 30 päeva pärast algust (UI näitab järelejäänud päevi)',
    'rua.trial.li3.html': '<strong>Jätkamine:</strong> selgesõnaline opt-in ühe klõpsuga (nt “Keep enabled”)',
    'rua.trial.li4.html': '<strong>Vaikimisi:</strong> automaatne peatamine 30. päeval (ilma opt-in’ita ei jätkata)',
    'rua.trial.li5.html': '<strong>Andmed peatamisel:</strong> kustutatakse vaikimisi (valikuliselt anonüümsed teenusemõõdikud)',

    'rua.stop.title': 'Kuidas peatada RUA pärast lõpetamist',
    'rua.stop.intro': 'Soovituslik järjekord:',
    'rua.stop.a.title.html': '<strong>A (soovitatav):</strong> keelake väline RUA autoriseerimise DNS, et saatjad ei saaks edastada',
    'rua.stop.a.detail': 'Näide: keelake TXT/CNAME, mida kasutatakse RUA sihtkoha autoriseerimiseks, et edastus ei õnnestuks.',
    'rua.stop.b.title.html': '<strong>B:</strong> võta vastu, aga hävita (kallim; viimane võimalus)',
    'rua.stop.b.detail': 'Hävita koheselt vastuvõtul. Tugev peatamise garantii, kuid suurem võrgu/töötluse kulu.',

    'rua.ui.title': 'UI (fikseeritud juhtpaneeli ülaservas)',
    'rua.ui.li1': 'Järelejäänud päevad: “◯ days left”',
    'rua.ui.li2': 'Jätkamise nupp: “Keep enabled”',
    'rua.ui.li3': 'Kohe peata: “Stop now”',
    'rua.ui.li4': 'Olek on alati esimeses vaates nähtav ja jääb kerimisel fikseeritult nähtavale.',

    'rua.links.back': '← Tagasi Quick Check’i',
    'rua.links.spec': 'Teenuse spets (docs)'
  });

  // Korean
  add('ko', {
    'rua.pageTitle': 'Toppy DNS / RUA 서비스 사양',
    'rua.pill': 'RUA(DMARC 집계 리포트) 서비스 — 핵심 사양',
    'rua.h1': 'RUA 엔드포인트 / 중지 설계 / 데이터 처리',
    'rua.tagline': '무료 트라이얼은 30일 후 자동 중지됩니다. 계속 사용하려면 명시적 opt-in이 필요합니다. 중지 후에는 새로운 RUA 리포트를 수신하지 않습니다.',

    'rua.setup.title': 'RUA 설정 방법(고객 측)',
    'rua.setup.intro.html': '이 서비스가 발급한 RUA 수신처(<span class="code">mailto:</span>)를 DMARC 레코드의 <span class="code">rua=</span>에 설정합니다. <strong>기존 DMARC 설정(p= / sp= / adkim= / aspf= 등)은 유지</strong>하고, <span class="code">rua=</span>만 추가(또는 갱신)하세요.',
    'rua.setup.step1.html': '<strong>1)</strong> 도메인의 DMARC 레코드(보통 <span class="code">_dmarc</span>)를 수정합니다.',
    'rua.setup.step2.html': '<strong>2)</strong> <span class="code">rua=mailto:{RUA_EMAIL}</span> 를 추가(또는 갱신)합니다.',
    'rua.setup.step3.html': '<strong>3)</strong> 일부 수신자는 외부 목적지 검증(RFC 7489 §7.1)을 요구합니다. 하지만 <strong>필요한 TXT 레코드는 당사 도메인 하위에서 서비스가 자동 발행</strong>하므로, 고객 측 DNS 변경은 필요 없습니다.',
    'rua.setup.step4.html': '<strong>4)</strong> DNS 반영 후 보통 24–48시간 내에 리포트 수신이 시작됩니다.',
    'rua.setup.note': '참고: DMARC 레코드가 이미 있다면 기존 정책/태그는 유지하고 rua=만 추가하세요(여러 mailto 목적지도 가능).',

    'rua.disclaimer.title': '면책 사항',
    'rua.disclaimer.body': '무료 트라이얼(30일). 원클릭 명시 opt-in으로 계속 사용. 페어유스 한도 내 best-effort; SLA 없음.',

    'rua.what.title': 'RUA란?',
    'rua.what.body': 'RUA는 DMARC 집계(aggregate) 리포트의 수신 주소입니다. 수신자(Gmail / Microsoft / ISP 등)가 보통 하루 1회 정도 인증 결과 요약 XML을 전송합니다.',
    'rua.what.note': '중요: 메일 본문이 아니라 집계 메타데이터입니다. 다만 운영 관점에서는 충분히 민감할 수 있습니다.',
    'rua.what.ruf.html': '참고: DMARC에는 <span class="code">ruf=</span>(포렌식/실패 보고)도 있는데, 개별 메시지 세부정보를 포함할 수 있어 프라이버시/컴플라이언스 측면에서 주의가 필요합니다. 이 서비스는 <span class="code">rua=</span>(집계 보고)만 처리합니다.',

    'rua.contains.title': 'RUA 리포트에 포함되는 정보(예시)',
    'rua.contains.li1': '대상 도메인(리포트 대상)',
    'rua.contains.li2': '발신 IP 및 발송 건수(count)',
    'rua.contains.li3': 'SPF / DKIM / DMARC 평가 결과(pass/fail 등)',
    'rua.contains.li4': 'From 도메인 정합(alignment) 결과',
    'rua.contains.li5': '리포트 기간(begin/end) 및 리포팅 조직 정보',

    'rua.risk.title': '가장 큰 리스크(중요)',
    'rua.risk.p1.html': 'RUA에는 본문이 없지만, <strong>발신 인프라(발신 IP·볼륨·발신 서비스)</strong>를 추정할 수 있는 단서가 포함될 수 있습니다. 유출 시 공격자가 발신 경로를 학습해 타깃팅, 피싱, 스푸핑 정밀도를 높이는 데 악용할 수 있습니다.',
    'rua.risk.p2.html': '즉 “본문이 없으니 안전”이 아니라, <strong>조직의 이메일 운영 지도</strong>가 될 수 있다는 점이 핵심 리스크입니다.',
    'rua.risk.mitigate.html': '이 리스크를 최소화하기 위해 당사는 <strong>데이터 최소화(원본 XML 비저장)</strong>, <strong>최소 권한 접근 제어</strong>, <strong>자동 처리</strong>, <strong>필요 최소의 비가역 집계만 유지</strong>, 그리고 <strong>중지 시 삭제 + 유입 중단</strong>을 철저히 적용합니다.',

    'rua.data.title': '데이터 처리(비저장/자동)',
    'rua.data.li1': 'RUA XML 원본은 저장하지 않습니다(영속화 없음).',
    'rua.data.li2': '개별 리포트를 사람이 열람하는 운영을 전제로 하지 않습니다(자동 처리).',
    'rua.data.li3': '표시/개선 제안에 필요한 최소의 비가역 집계만 생성하고, 원본 데이터는 폐기합니다.',
    'rua.data.li4': '중지 시(저장 데이터가 있다면) 삭제하고, 이후 유입도 중단합니다.',
    'rua.data.note': '“비가역 집계”는 개별 리포트를 복원할 수 없는 형태(예: 일별 합계)를 의미합니다. 필요 없다면 집계도 저장하지 않도록 설계합니다.',

    'rua.gdpr.title': '프라이버시 / GDPR(요약)',
    'rua.gdpr.intro': '사용자가 알아야 할 요점과 GDPR에 부합하는 당사의 처리 방침을 요약합니다(법률 자문 아님).',

    'rua.gdpr.user.title': '사용자가 알아야 할 점(중요)',
    'rua.gdpr.user.li1': '권한과 적법성: 본인이 관리하는 도메인 또는 명시적 허가를 받은 범위에서만 사용하세요(RUA 목적지 설정은 관리 행위입니다).',
    'rua.gdpr.user.li2': '개인정보 해당 가능성: 발신 IP 및 경우에 따라 연락처 이메일 등이 포함될 수 있으며 맥락에 따라 개인정보가 될 수 있습니다. 내부 정책에 따라 적법 근거를 정리하세요.',
    'rua.gdpr.user.li3': '기밀 취급 권장: 본문은 없지만 운영 패턴을 노출할 수 있습니다. 기밀 정보로 취급하는 것을 권장합니다.',
    'rua.gdpr.user.li4': '중지/삭제: 중지 후에는 유입을 중단하고 관련 데이터를 원칙적으로 삭제합니다. DNS에서도 반드시 중지하세요(아래 참조).',

    'rua.gdpr.us.title': '당사가 수행하는 사항(핵심)',
    'rua.gdpr.us.li1': '데이터 최소화: 원본 XML은 저장하지 않고, 최소한의 비가역 집계만 처리합니다.',
    'rua.gdpr.us.li2': '목적 외 사용 없음: 광고/마케팅에 사용하지 않습니다(RUA는 그 목적에 적합하지 않으며, 당사는 그 목적에 쓸 수 있는 리포트 단위 데이터를 보관하지 않습니다).',
    'rua.gdpr.us.li3': '보안 조치: 접근 제어, 최소 권한, 암호화 등으로 기밀성과 무결성을 보호합니다.',
    'rua.gdpr.us.li4': '위탁 관리: 외부 업체를 사용하는 경우 GDPR에 부합하는 계약(DPA 등)과 관리를 수행합니다.',
    'rua.gdpr.us.li5': '삭제 및 협력: 중지/삭제 및 정보주체 권리 행사는 관리자(고객) 요청에 협력합니다.',

    'rua.roles.title': '역할(Controller / Processor)',
    'rua.roles.li1.html': '<strong>고객(귀하/귀 조직):</strong> 보통 RUA 수신/분석의 목적과 수단을 결정하므로 <strong>관리자(Controller)</strong>에 해당합니다.',
    'rua.roles.li2.html': '<strong>서비스 제공자:</strong> 고객 지시에 따라 처리하므로 보통 <strong>처리자(Processor)</strong>로 행동합니다(DPA/계약으로 명확화).',

    'rua.dataTypes.title': '처리할 수 있는 데이터(예시)',
    'rua.dataTypes.li1': '대상 도메인, 리포트 기간, 인증 결과(SPF/DKIM/DMARC pass/fail 등)',
    'rua.dataTypes.li2': '발신 IP와 건수(집계)',
    'rua.dataTypes.li3': '리포팅 조직 정보(조직명, 경우에 따라 연락처 이메일 등)',
    'rua.dataTypes.note': '참고: IP 주소와 연락처 이메일은 맥락에 따라 개인정보가 될 수 있습니다.',

    'rua.purpose.title': '처리 목적',
    'rua.purpose.li1': '스푸핑/오인증 징후 파악 및 발신 경로 건전성 확인(보안 운영)',
    'rua.purpose.li2': 'SPF/DKIM/DMARC 설정 개선 제안 및 단계적 적용 검증',
    'rua.purpose.li3': '서비스 제공 유지 및 남용 방지(레이트 제한, 장애 대응)를 위한 최소 데이터 처리',

    'rua.legal.title': '법적 근거(일반 예)',
    'rua.legal.li1.html': '<strong>관리자(고객):</strong> 보통 정당한 이익(GDPR 6(1)(f): 보안) 또는 계약 이행(6(1)(b)) 등이 상황에 따라 해당합니다.',
    'rua.legal.li2.html': '<strong>처리자(본 서비스):</strong> 고객과의 계약/DPA 및 문서화된 지시에 따라 처리합니다(GDPR 28).',
    'rua.legal.note': '사용 사례와 내부 정책에 따라 달라질 수 있습니다. 공식 고지에서는 고객 측 근거도 정리하세요.',

    'rua.retention.title': '보관 기간 및 삭제',
    'rua.retention.li1.html': '<strong>원본 RUA XML:</strong> 저장하지 않으며 처리 후 폐기합니다.',
    'rua.retention.li2.html': '<strong>비가역 집계:</strong> 필요한 범위로 제한하고, 계속 사용하지 않으면 <strong>최대 30일(트라이얼 종료)</strong> 내 삭제(설계 목표).',
    'rua.retention.li3.html': '<strong>중지 후:</strong> 관련 데이터를 원칙적으로 삭제하고 이후 유입을 중단합니다.',

    'rua.subprocessors.title': '제3자 제공 / 위탁(Sub-processors)',
    'rua.subprocessors.body.html': '호스팅/스토리지/모니터링 등을 외부 업체에 위탁하는 경우 GDPR상 서브프로세서가 될 수 있습니다. 정식 운영에서는 <strong>위탁사 목록(업체/국가/목적)</strong>을 제공하고 필요 시 DPA, SCC 등을 포함한 적절한 조치를 마련합니다.',

    'rua.transfer.title': '제3국 이전(EEA 외 이전)',
    'rua.transfer.body': 'EEA 외로 이전될 수 있는 경우, SCC 등 적절한 보호조치를 관련 법에 따라 적용합니다.',

    'rua.rights.title': '정보주체 권리(요청 창구)',
    'rua.rights.li1': '열람, 정정, 삭제, 처리 제한, 이의 제기, 이동권 등(해당 범위 내)',
    'rua.rights.li2.html': '보통 요청은 <strong>관리자(고객)</strong>가 창구가 됩니다. 본 서비스는 처리자로서 관리자 요청에 협력합니다.',

    'rua.contact.title': '연락처',
    'rua.contact.body.html': '프라이버시/데이터 처리 문의: <strong>privacy@toppymicros.com</strong><br>사업자: <strong>ToppyMicroServices OÜ</strong> (도메인: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': '불만/신고',
    'rua.complaints.body': 'EU/EEA 거주자는 관할 감독기관(SA)에 불만을 제기할 권리가 있습니다.',

    'rua.trial.title': '트라이얼 및 중지(요점)',
    'rua.trial.li1.html': '<strong>트라이얼 시작일:</strong> RUA 수신(활성화)이 처음 성공한 날',
    'rua.trial.li2.html': '<strong>트라이얼 종료일:</strong> 시작일로부터 30일 후(UI는 잔여일 표시)',
    'rua.trial.li3.html': '<strong>계속 사용:</strong> 원클릭 명시 opt-in(예: “Keep enabled”)',
    'rua.trial.li4.html': '<strong>기본값:</strong> 30일 자동 중지(opt-in 없으면 연장 없음)',
    'rua.trial.li5.html': '<strong>중지 시 데이터:</strong> 기본 삭제(선택적으로 익명 서비스 메트릭만 유지)',

    'rua.stop.title': '중지 후 RUA 수신을 멈추는 방법',
    'rua.stop.intro': '권장 순서는 다음과 같습니다.',
    'rua.stop.a.title.html': '<strong>A(권장):</strong> 외부 RUA 허용 DNS를 비활성화해 발신 측에서 전송이 불가능하게 만들기',
    'rua.stop.a.detail': '예: RUA 목적지 허용에 사용한 TXT/CNAME을 비활성화해 전송이 성립하지 않게 함.',
    'rua.stop.b.title.html': '<strong>B:</strong> 수신은 하되 폐기(비용 증가, 최후의 수단)',
    'rua.stop.b.detail': '도착 즉시 폐기. 중지 보장은 강하지만 네트워크/처리 비용이 증가합니다.',

    'rua.ui.title': 'UI(대시보드 상단 고정)',
    'rua.ui.li1': '잔여일: “◯ days left”',
    'rua.ui.li2': '계속 버튼: “Keep enabled”',
    'rua.ui.li3': '즉시 중지 버튼: “Stop now”',
    'rua.ui.li4': '상태는 항상 첫 화면에서 보이고, 스크롤해도 상단에 고정 표시됩니다.',

    'rua.links.back': '← Quick Check로 돌아가기',
    'rua.links.spec': '서비스 사양(docs)'
  });

  // Spanish
  add('es', {
    'rua.pageTitle': 'Toppy DNS / Especificación del servicio RUA',
    'rua.pill': 'Servicio RUA (informes agregados DMARC) — Especificación clave',
    'rua.h1': 'Endpoint RUA / diseño de parada / manejo de datos',
    'rua.tagline': 'La prueba gratuita se detiene automáticamente a los 30 días. Para continuar se requiere un opt-in explícito. Tras detenerse, no se recibirán nuevos informes RUA.',

    'rua.setup.title': 'Cómo configurar RUA (lado del cliente)',
    'rua.setup.intro.html': 'Configura el destino RUA emitido por este servicio (<span class="code">mailto:</span>) en el parámetro <span class="code">rua=</span> de tu registro DMARC. <strong>Mantén tu configuración DMARC existente (p= / sp= / adkim= / aspf=, etc.)</strong> y solo añade (o actualiza) <span class="code">rua=</span>.',
    'rua.setup.step1.html': '<strong>1)</strong> Edita el registro DMARC de tu dominio (normalmente <span class="code">_dmarc</span>).',
    'rua.setup.step2.html': '<strong>2)</strong> Añade (o actualiza) <span class="code">rua=mailto:{RUA_EMAIL}</span>.',
    'rua.setup.step3.html': '<strong>3)</strong> Algunos receptores exigen verificación para destinos externos (RFC 7489 §7.1). Aun así, <strong>el servicio aprovisiona automáticamente el TXT requerido bajo nuestro dominio</strong>; no necesitas cambios en tu DNS.',
    'rua.setup.step4.html': '<strong>4)</strong> Tras la propagación DNS, los informes suelen empezar a llegar en 24–48 horas.',
    'rua.setup.note': 'Nota: si ya tienes un registro DMARC, mantén tus tags/política actuales y añade solo rua= (se permiten múltiples destinos mailto).',

    'rua.disclaimer.title': 'Descargo de responsabilidad',
    'rua.disclaimer.body': 'Prueba gratuita (30 días). Continuar con un clic (opt-in explícito). Best-effort con límites de uso justo; sin SLA.',

    'rua.what.title': '¿Qué es RUA?',
    'rua.what.body': 'RUA es el destino de los informes agregados de DMARC. Los receptores (Gmail / Microsoft / ISP) suelen enviar un resumen XML diario de resultados de autenticación del correo que declara tu dominio.',
    'rua.what.note': 'Importante: no es contenido del correo. Es metadato agregado, que aun así puede ser sensible operativamente.',
    'rua.what.ruf.html': 'Nota: DMARC también tiene <span class="code">ruf=</span> (informes forenses/de fallo), que pueden incluir detalles por mensaje y requieren un tratamiento cuidadoso en privacidad/cumplimiento. Este servicio se limita a <span class="code">rua=</span> (informes agregados).',

    'rua.contains.title': 'Qué suele contener un informe RUA',
    'rua.contains.li1': 'Dominio objetivo (el dominio reportado)',
    'rua.contains.li2': 'IPs de origen y recuentos (count)',
    'rua.contains.li3': 'Resultados SPF / DKIM / DMARC (pass/fail, etc.)',
    'rua.contains.li4': 'Resultados de alineación del dominio From',
    'rua.contains.li5': 'Periodo del informe (begin/end) e info de la organización reportante',

    'rua.risk.title': 'El mayor riesgo (importante)',
    'rua.risk.p1.html': 'RUA no incluye cuerpos, pero puede revelar pistas sobre tu <strong>infraestructura de envío (IPs, volúmenes y servicios)</strong>. Si se filtra, un atacante puede aprender tus rutas de envío y usarlo para mejorar el targeting, phishing o suplantación.',
    'rua.risk.p2.html': 'Por eso no es “seguro porque no hay cuerpo”. Puede convertirse en un <strong>mapa de las operaciones de correo</strong> de la organización.',
    'rua.risk.mitigate.html': 'Para minimizar el riesgo aplicamos <strong>minimización de datos (sin almacenar XML en bruto)</strong>, <strong>acceso de mínimo privilegio</strong>, <strong>procesamiento automatizado</strong>, <strong>solo agregación mínima irreversible</strong> y <strong>borrado + stop de intake al terminar</strong>.',

    'rua.data.title': 'Manejo de datos (sin almacenamiento / automatizado)',
    'rua.data.li1': 'No almacenamos el XML RUA en bruto (sin persistencia).',
    'rua.data.li2': 'No asumimos revisión humana de informes individuales.',
    'rua.data.li3': 'Solo generamos agregados irreversibles mínimos para pantalla/recomendaciones y descartamos el origen.',
    'rua.data.li4': 'Al detenerse, borramos cualquier dato almacenado (si existe) y paramos el intake.',
    'rua.data.note': '“Agregación irreversible” significa que no se puede reconstruir un informe individual (p. ej., totales diarios). Si no es necesario, se diseña para no guardar agregados.',

    'rua.gdpr.title': 'Privacidad / GDPR (resumen)',
    'rua.gdpr.intro': 'Resumen de lo que deben saber los usuarios y cómo tratamos los datos conforme al GDPR (no es asesoría legal).',

    'rua.gdpr.user.title': 'Lo que debes tener en cuenta (importante)',
    'rua.gdpr.user.li1': 'Autoridad y legalidad: úsalo solo para dominios que controles o con permiso explícito (configurar RUA es una acción administrativa).',
    'rua.gdpr.user.li2': 'Posibles datos personales: IPs de origen y a veces emails de contacto pueden aparecer y ser datos personales según el contexto. Define tu base legal según tu política.',
    'rua.gdpr.user.li3': 'Trátalo como confidencial: sin cuerpos, pero expone patrones operativos. Recomendamos tratarlo como información confidencial.',
    'rua.gdpr.user.li4': 'Parada/borrado: tras parar, detenemos el intake y borramos los datos por defecto. También deténlo en DNS (abajo) para evitar envíos continuos.',

    'rua.gdpr.us.title': 'Qué hacemos (puntos clave)',
    'rua.gdpr.us.li1': 'Minimización: sin XML en bruto; solo agregación mínima irreversible.',
    'rua.gdpr.us.li2': 'Sin uso secundario: no se usa para publicidad/marketing (RUA no sirve para eso y no retenemos datos por informe que lo habiliten).',
    'rua.gdpr.us.li3': 'Seguridad: controles de acceso, mínimo privilegio, cifrado, etc. para proteger confidencialidad e integridad.',
    'rua.gdpr.us.li4': 'Gestión de subprocesadores: si usamos proveedores, se gestionan con términos alineados a GDPR (p. ej., DPA).',
    'rua.gdpr.us.li5': 'Borrado y cooperación: apoyamos solicitudes de borrado/derechos vía el controller (cliente).',

    'rua.roles.title': 'Roles (Controller / Processor)',
    'rua.roles.li1.html': '<strong>Cliente (tú/tu organización):</strong> normalmente el <strong>Controller</strong>, decide fines y medios de recibir/analizar RUA.',
    'rua.roles.li2.html': '<strong>Proveedor del servicio:</strong> normalmente el <strong>Processor</strong>, procesa bajo instrucciones documentadas (DPA/contrato).',

    'rua.dataTypes.title': 'Datos que podemos tratar (típicos)',
    'rua.dataTypes.li1': 'Dominio, periodo del informe, resultados de autenticación (SPF/DKIM/DMARC pass/fail, etc.)',
    'rua.dataTypes.li2': 'IPs de origen y recuentos (agregado)',
    'rua.dataTypes.li3': 'Info de la organización reportante (y a veces emails de contacto)',
    'rua.dataTypes.note': 'Nota: IPs y emails de contacto pueden ser datos personales según el contexto.',

    'rua.purpose.title': 'Finalidades de tratamiento',
    'rua.purpose.li1': 'Detectar suplantación / señales de mala autenticación y validar salud del envío (operaciones de seguridad)',
    'rua.purpose.li2': 'Recomendar mejoras SPF/DKIM/DMARC y validar despliegues graduales',
    'rua.purpose.li3': 'Mantener el servicio y prevenir abuso (rate limiting, respuesta a incidentes) con datos mínimos',

    'rua.legal.title': 'Base legal (ejemplos generales)',
    'rua.legal.li1.html': '<strong>Controller (cliente):</strong> a menudo interés legítimo (GDPR 6(1)(f): seguridad) o contrato (6(1)(b)), según uso.',
    'rua.legal.li2.html': '<strong>Processor (este servicio):</strong> procesa bajo contrato/DPA e instrucciones documentadas (GDPR 28).',
    'rua.legal.note': 'Depende del caso de uso y política interna. En avisos formales, define tu base legal.',

    'rua.retention.title': 'Retención y borrado',
    'rua.retention.li1.html': '<strong>XML RUA en bruto:</strong> no se almacena; se descarta tras el procesamiento.',
    'rua.retention.li2.html': '<strong>Agregados irreversibles:</strong> solo lo necesario; se borran hasta <strong>30 días (fin de prueba)</strong> si no se continúa (objetivo de diseño).',
    'rua.retention.li3.html': '<strong>Tras detenerse:</strong> se borran los datos relacionados por defecto y se detiene el intake.',

    'rua.subprocessors.title': 'Terceros / subprocesadores',
    'rua.subprocessors.body.html': 'Si usamos proveedores para hosting/almacenamiento/monitorización, pueden ser subprocesadores GDPR. En producción, proporcionamos una <strong>lista de proveedores (nombre/país/finalidad)</strong> y acordamos términos adecuados (DPA, SCC, etc.) cuando aplique.',

    'rua.transfer.title': 'Transferencias internacionales (fuera del EEE)',
    'rua.transfer.body': 'Si los datos pueden transferirse fuera del EEE, aplicamos salvaguardas adecuadas como SCC, según corresponda.',

    'rua.rights.title': 'Derechos del interesado (canal de solicitud)',
    'rua.rights.li1': 'Acceso, rectificación, supresión, limitación, oposición, portabilidad, etc. (según aplique)',
    'rua.rights.li2.html': 'Las solicitudes normalmente las gestiona el <strong>Controller (cliente)</strong>. Como processor, cooperamos a petición del controller.',

    'rua.contact.title': 'Contacto',
    'rua.contact.body.html': 'Consultas de privacidad/tratamiento: <strong>privacy@toppymicros.com</strong><br>Operador: <strong>ToppyMicroServices OÜ</strong> (dominio: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'Reclamaciones',
    'rua.complaints.body': 'Los residentes en la UE/EEE tienen derecho a presentar una reclamación ante su autoridad de control (SA).',

    'rua.trial.title': 'Prueba y parada (puntos clave)',
    'rua.trial.li1.html': '<strong>Inicio de prueba:</strong> primera recepción (activación) exitosa de RUA',
    'rua.trial.li2.html': '<strong>Fin de prueba:</strong> 30 días después del inicio (mostrar días restantes)',
    'rua.trial.li3.html': '<strong>Continuar:</strong> opt-in explícito con un clic (p. ej., “Keep enabled”)',
    'rua.trial.li4.html': '<strong>Por defecto:</strong> se detiene automáticamente al día 30 (sin opt-in, no continúa)',
    'rua.trial.li5.html': '<strong>Datos al parar:</strong> borrado por defecto (opcional: métricas anónimas)',

    'rua.stop.title': 'Cómo detener RUA tras la terminación',
    'rua.stop.intro': 'Orden recomendado:',
    'rua.stop.a.title.html': '<strong>A (recomendado):</strong> desactivar el DNS de autorización RUA externo para que los remitentes no puedan entregar',
    'rua.stop.a.detail': 'Ejemplo: desactivar el TXT/CNAME usado para autorizar el destino RUA para que la entrega no pueda completarse.',
    'rua.stop.b.title.html': '<strong>B:</strong> aceptar pero descartar (más coste; último recurso)',
    'rua.stop.b.detail': 'Descartar al llegar. Garantiza la parada, pero incrementa costes de red/procesamiento.',

    'rua.ui.title': 'UI (fijado arriba del panel)',
    'rua.ui.li1': 'Días restantes: “◯ days left”',
    'rua.ui.li2': 'Botón continuar: “Keep enabled”',
    'rua.ui.li3': 'Botón parar: “Stop now”',
    'rua.ui.li4': 'El estado se mantiene visible y fijo al hacer scroll.',

    'rua.links.back': '← Volver a Quick Check',
    'rua.links.spec': 'Especificación del servicio (docs)'
  });

  // German
  add('de', {
    'rua.pageTitle': 'Toppy DNS / RUA Service-Spezifikation',
    'rua.pill': 'RUA (DMARC Aggregate Reports) Service — Kernauszug',
    'rua.h1': 'RUA-Endpunkt / Stop-Design / Datenverarbeitung',
    'rua.tagline': 'Der kostenlose Test stoppt automatisch nach 30 Tagen. Für die Fortsetzung ist ein explizites Opt-in erforderlich. Nach dem Stop werden keine neuen RUA-Reports mehr empfangen.',

    'rua.setup.title': 'RUA einrichten (Kundenseite)',
    'rua.setup.intro.html': 'Tragen Sie das von diesem Service ausgegebene RUA-Ziel (<span class="code">mailto:</span>) in den <span class="code">rua=</span>-Tag Ihres DMARC-Records ein. <strong>Behalten Sie Ihre bestehenden DMARC-Einstellungen (p= / sp= / adkim= / aspf= usw.) bei</strong> und fügen Sie nur <span class="code">rua=</span> hinzu (oder aktualisieren Sie es).',
    'rua.setup.step1.html': '<strong>1)</strong> Bearbeiten Sie den DMARC-Record Ihrer Domain (typischerweise <span class="code">_dmarc</span>).',
    'rua.setup.step2.html': '<strong>2)</strong> Fügen Sie <span class="code">rua=mailto:{RUA_EMAIL}</span> hinzu (oder aktualisieren Sie es).',
    'rua.setup.step3.html': '<strong>3)</strong> Manche Empfänger verlangen eine Verifizierung für externe Ziele (RFC 7489 §7.1). Dennoch <strong>stellt der Service den benötigten TXT-Record automatisch unter unserer Domain bereit</strong>; in deiner DNS sind keine Änderungen nötig.',
    'rua.setup.step4.html': '<strong>4)</strong> Nach DNS-Propagation beginnen Reports typischerweise innerhalb von 24–48 Stunden einzutreffen.',
    'rua.setup.note': 'Hinweis: Wenn bereits ein DMARC-Record existiert, behalten Sie Policy/Tags bei und ergänzen nur rua= (mehrere mailto-Ziele sind möglich).',

    'rua.disclaimer.title': 'Haftungsausschluss',
    'rua.disclaimer.body': 'Kostenloser Test (30 Tage). Weiterführung per 1-Klick (explizites Opt-in). Best-effort mit Fair-Use-Limits; kein SLA.',

    'rua.what.title': 'Was ist RUA?',
    'rua.what.body': 'RUA ist das Ziel für DMARC-Aggregatberichte. Empfänger (Gmail / Microsoft / ISPs) senden typischerweise täglich eine XML-Zusammenfassung der Authentifizierungsergebnisse für E-Mails, die Ihre Domain beanspruchen.',
    'rua.what.note': 'Wichtig: Das ist kein E-Mail-Inhalt. Es sind aggregierte Metadaten, die operativ dennoch sensibel sein können.',
    'rua.what.ruf.html': 'Hinweis: DMARC kennt auch <span class="code">ruf=</span> (forensische/Fehler-Reports), die Details pro Nachricht enthalten können und daher eine sorgfältige Datenschutz-/Compliance-Handhabung erfordern. Dieser Service ist auf <span class="code">rua=</span> (Aggregat-Reports) beschränkt.',

    'rua.contains.title': 'Was ein RUA-Report typischerweise enthält',
    'rua.contains.li1': 'Zieldomain (die gemeldete Domain)',
    'rua.contains.li2': 'Quell-IPs und Nachrichtenzahlen (count)',
    'rua.contains.li3': 'SPF / DKIM / DMARC Ergebnisse (pass/fail usw.)',
    'rua.contains.li4': 'From-Domain-Alignment-Ergebnisse',
    'rua.contains.li5': 'Berichtszeitraum (begin/end) und Informationen zur berichtenden Organisation',

    'rua.risk.title': 'Das größte Risiko (wichtig)',
    'rua.risk.p1.html': 'RUA enthält keine Mail-Bodies, kann aber Hinweise auf Ihre <strong>Sendeinfrastruktur (Quell-IPs, Volumen, Versanddienste)</strong> liefern. Bei einem Leak können Angreifer Ihre Sendewege lernen und das für Targeting, Phishing oder Spoofing nutzen.',
    'rua.risk.p2.html': 'Also nicht „sicher, weil kein Body“. Es kann eine <strong>Karte Ihrer E-Mail-Operationen</strong> werden.',
    'rua.risk.mitigate.html': 'Zur Risikominimierung setzen wir <strong>Datenminimierung (keine Raw-XML-Speicherung)</strong>, <strong>Least-Privilege-Zugriffskontrolle</strong>, <strong>automatisierte Verarbeitung</strong>, <strong>nur minimale irreversible Aggregation</strong> sowie <strong>Löschung + Intake-Stop bei Beendigung</strong> durch.',

    'rua.data.title': 'Datenverarbeitung (keine Speicherung / automatisiert)',
    'rua.data.li1': 'Wir speichern keine rohe RUA-XML (keine Persistenz).',
    'rua.data.li2': 'Wir gehen nicht davon aus, dass Menschen einzelne Reports prüfen.',
    'rua.data.li3': 'Wir erzeugen nur minimale irreversible Aggregate für Anzeige/Empfehlungen und verwerfen die Quelldaten.',
    'rua.data.li4': 'Beim Stop löschen wir ggf. gespeicherte Daten und stoppen weiteren Intake.',
    'rua.data.note': '„Irreversible Aggregation“ bedeutet: aus den Ergebnissen lässt sich kein einzelner Report rekonstruieren (z. B. Tages-Summen). Wenn unnötig, speichern wir auch keine Aggregate.',

    'rua.gdpr.title': 'Datenschutz / GDPR (Zusammenfassung)',
    'rua.gdpr.intro': 'Zusammenfassung dessen, was Nutzer wissen sollten und wie wir Daten GDPR-konform behandeln (keine Rechtsberatung).',

    'rua.gdpr.user.title': 'Was Sie beachten sollten (wichtig)',
    'rua.gdpr.user.li1': 'Berechtigung & Rechtmäßigkeit: nur für Domains nutzen, die Sie kontrollieren oder wofür Sie explizite Erlaubnis haben (RUA-Ziel zu setzen ist eine Admin-Aktion).',
    'rua.gdpr.user.li2': 'Mögliche personenbezogene Daten: Quell-IPs und ggf. Kontakt-E-Mails können je nach Kontext personenbezogen sein. Klären Sie Ihre Rechtsgrundlage gemäß interner Policy.',
    'rua.gdpr.user.li3': 'Vertraulich behandeln: kein Inhalt, aber operative Muster. Als vertrauliche Information behandeln.',
    'rua.gdpr.user.li4': 'Stop/Löschung: nach Stop stoppen wir Intake und löschen Daten standardmäßig. Stoppen Sie auch in DNS (unten), um weiteres Senden zu vermeiden.',

    'rua.gdpr.us.title': 'Was wir tun (Kernpunkte)',
    'rua.gdpr.us.li1': 'Datenminimierung: keine Raw-XML-Speicherung; nur minimale irreversible Aggregation.',
    'rua.gdpr.us.li2': 'Keine Zweckentfremdung: nicht für Werbung/Marketing (RUA ist dafür ungeeignet und wir behalten keine Report-Daten, die das ermöglichen würden).',
    'rua.gdpr.us.li3': 'Sicherheitsmaßnahmen: Zugriffskontrolle, Least Privilege, Verschlüsselung usw. für Vertraulichkeit und Integrität.',
    'rua.gdpr.us.li4': 'Sub-Processor-Management: bei Vendor-Nutzung GDPR-konforme Bedingungen (z. B. DPA).',
    'rua.gdpr.us.li5': 'Löschung & Unterstützung: Unterstützung bei Löschung/Rechten über den Controller (Kunden).',

    'rua.roles.title': 'Rollen (Controller / Processor)',
    'rua.roles.li1.html': '<strong>Kunde (Sie/Ihre Organisation):</strong> typischerweise <strong>Controller</strong>, entscheidet Zweck und Mittel für Empfang/Analyse von RUA.',
    'rua.roles.li2.html': '<strong>Serviceanbieter:</strong> typischerweise <strong>Processor</strong>, verarbeitet nach dokumentierten Anweisungen (DPA/Vertrag).',

    'rua.dataTypes.title': 'Daten, die wir verarbeiten können (typisch)',
    'rua.dataTypes.li1': 'Domain, Berichtszeitraum, Authentifizierungsresultate (SPF/DKIM/DMARC pass/fail usw.)',
    'rua.dataTypes.li2': 'Quell-IPs und Counts (aggregiert)',
    'rua.dataTypes.li3': 'Infos zur berichtenden Organisation (und ggf. Kontakt-E-Mails)',
    'rua.dataTypes.note': 'Hinweis: IP-Adressen und Kontakt-E-Mails können je nach Kontext personenbezogene Daten sein.',

    'rua.purpose.title': 'Verarbeitungszwecke',
    'rua.purpose.li1': 'Spoofing-/Fehlauthentifizierungssignale erkennen und Sendewege validieren (Security Operations)',
    'rua.purpose.li2': 'SPF/DKIM/DMARC-Verbesserungen empfehlen und gestaffelte Rollouts validieren',
    'rua.purpose.li3': 'Servicebetrieb und Missbrauchsprävention (Rate Limiting, Incident Response) mit minimalen Daten',

    'rua.legal.title': 'Rechtsgrundlage (allgemeine Beispiele)',
    'rua.legal.li1.html': '<strong>Controller (Kunde):</strong> oft berechtigtes Interesse (GDPR 6(1)(f): Sicherheit) oder Vertrag (6(1)(b)), je nach Nutzung.',
    'rua.legal.li2.html': '<strong>Processor (dieser Service):</strong> verarbeitet unter Vertrag/DPA und dokumentierten Anweisungen (GDPR 28).',
    'rua.legal.note': 'Abhängig vom Use Case und interner Policy. Für formale Notices definieren Sie Ihre Grundlage entsprechend.',

    'rua.retention.title': 'Aufbewahrung & Löschung',
    'rua.retention.li1.html': '<strong>Rohe RUA-XML:</strong> wird nicht gespeichert; nach Verarbeitung verworfen.',
    'rua.retention.li2.html': '<strong>Irreversible Aggregate:</strong> nur soweit nötig; Löschung bis <strong>30 Tage (Ende Test)</strong> bei Nicht-Fortsetzung (Designziel).',
    'rua.retention.li3.html': '<strong>Nach Stop:</strong> Standardmäßig Löschung und Intake-Stop.',

    'rua.subprocessors.title': 'Dritte / Sub-Processor',
    'rua.subprocessors.body.html': 'Wenn wir Vendoren für Hosting/Storage/Monitoring nutzen, können sie GDPR-Sub-Processor sein. Im Produktivbetrieb stellen wir eine <strong>Vendor-Liste (Name/Land/Zweck)</strong> bereit und setzen passende Bedingungen (DPA, SCC usw.) um.',

    'rua.transfer.title': 'Internationale Transfers (außerhalb EWR)',
    'rua.transfer.body': 'Wenn Daten außerhalb des EWR übertragen werden könnten, setzen wir angemessene Schutzmaßnahmen wie SCC ein.',

    'rua.rights.title': 'Betroffenenrechte (Anfragekanal)',
    'rua.rights.li1': 'Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Portabilität usw. (soweit anwendbar)',
    'rua.rights.li2.html': 'Anfragen laufen typischerweise über den <strong>Controller (Kunden)</strong>. Als Processor unterstützen wir auf Anfrage des Controllers.',

    'rua.contact.title': 'Kontakt',
    'rua.contact.body.html': 'Anfragen zu Datenschutz/Datenverarbeitung: <strong>privacy@toppymicros.com</strong><br>Betreiber: <strong>ToppyMicroServices OÜ</strong> (Domain: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'Beschwerden',
    'rua.complaints.body': 'EU/EWR-Bewohner haben das Recht, sich bei ihrer zuständigen Aufsichtsbehörde (SA) zu beschweren.',

    'rua.trial.title': 'Test & Stop (Kernpunkte)',
    'rua.trial.li1.html': '<strong>Test startet:</strong> erster erfolgreicher RUA-Intake (Aktivierung)',
    'rua.trial.li2.html': '<strong>Test endet:</strong> 30 Tage nach Start (UI zeigt Resttage)',
    'rua.trial.li3.html': '<strong>Fortsetzen:</strong> explizites Opt-in per 1 Klick (z. B. “Keep enabled”)',
    'rua.trial.li4.html': '<strong>Standard:</strong> automatischer Stop am Tag 30 (ohne Opt-in keine Fortsetzung)',
    'rua.trial.li5.html': '<strong>Daten beim Stop:</strong> Standardmäßig gelöscht (optional anonyme Service-Metriken)',

    'rua.stop.title': 'Wie man RUA nach Beendigung stoppt',
    'rua.stop.intro': 'Empfohlene Reihenfolge:',
    'rua.stop.a.title.html': '<strong>A (empfohlen):</strong> externes RUA-Autorisierungs-DNS deaktivieren, damit Sender nicht zustellen können',
    'rua.stop.a.detail': 'Beispiel: TXT/CNAME deaktivieren, das zur Autorisierung des RUA-Ziels genutzt wird, damit Zustellung nicht erfolgreich sein kann.',
    'rua.stop.b.title.html': '<strong>B:</strong> annehmen, aber verwerfen (höhere Kosten; letzter Ausweg)',
    'rua.stop.b.detail': 'Beim Eingang verwerfen. Starker Stop, aber höhere Netzwerk-/Verarbeitungskosten.',

    'rua.ui.title': 'UI (oben im Dashboard fixiert)',
    'rua.ui.li1': 'Resttage: “◯ days left”',
    'rua.ui.li2': 'Weiter-Button: “Keep enabled”',
    'rua.ui.li3': 'Sofort stoppen: “Stop now”',
    'rua.ui.li4': 'Status bleibt above-the-fold sichtbar und beim Scrollen fixiert.',

    'rua.links.back': '← Zurück zum Quick Check',
    'rua.links.spec': 'Service-Spez (docs)'
  });

  // Russian
  add('ru', {
    'rua.pageTitle': 'Toppy DNS / Спецификация сервиса RUA',
    'rua.pill': 'Сервис RUA (агрегированные отчеты DMARC) — краткая спецификация',
    'rua.h1': 'RUA endpoint / дизайн остановки / обработка данных',
    'rua.tagline': 'Бесплатный пробный период автоматически останавливается через 30 дней. Для продолжения требуется явное opt-in. После остановки новые RUA-отчеты не принимаются.',

    'rua.setup.title': 'Как настроить RUA (со стороны клиента)',
    'rua.setup.intro.html': 'Укажите выданный этим сервисом адрес RUA (<span class="code">mailto:</span>) в параметре <span class="code">rua=</span> вашего DMARC-записа. <strong>Сохраните существующие настройки DMARC (p= / sp= / adkim= / aspf= и т. д.)</strong> и добавьте (или обновите) только <span class="code">rua=</span>.',
    'rua.setup.step1.html': '<strong>1)</strong> Отредактируйте DMARC-запись домена (обычно <span class="code">_dmarc</span>).',
    'rua.setup.step2.html': '<strong>2)</strong> Добавьте (или обновите) <span class="code">rua=mailto:{RUA_EMAIL}</span>.',
    'rua.setup.step3.html': '<strong>3)</strong> Некоторые получатели требуют верификацию внешнего назначения (RFC 7489 §7.1). Однако <strong>сервис автоматически создаёт нужную TXT-запись под нашим доменом</strong>; никаких изменений DNS с вашей стороны не требуется.',
    'rua.setup.step4.html': '<strong>4)</strong> После распространения DNS отчеты обычно начинают поступать в течение 24–48 часов.',
    'rua.setup.note': 'Примечание: если DMARC-запись уже есть, сохраните текущие теги/политику и добавьте только rua= (возможны несколько адресов mailto).',

    'rua.disclaimer.title': 'Отказ от ответственности',
    'rua.disclaimer.body': 'Бесплатный пробный период (30 дней). Продление — один клик (явный opt-in). Best-effort с лимитами fair-use; без SLA.',

    'rua.what.title': 'Что такое RUA?',
    'rua.what.body': 'RUA — это адрес назначения для агрегированных отчетов DMARC. Получатели (Gmail / Microsoft / ISP) обычно раз в день отправляют XML-сводку результатов аутентификации для писем, заявляющих ваш домен.',
    'rua.what.note': 'Важно: это не содержимое писем. Это агрегированные метаданные, которые все равно могут быть чувствительными для эксплуатации.',
    'rua.what.ruf.html': 'Примечание: В DMARC есть также <span class="code">ruf=</span> (forensic/отчеты о сбоях), которые могут содержать детали по отдельным сообщениям, поэтому требуют осторожного подхода к конфиденциальности/соответствию. Этот сервис ограничен <span class="code">rua=</span> (агрегированными отчетами).',

    'rua.contains.title': 'Что обычно содержит RUA-отчет',
    'rua.contains.li1': 'Целевой домен (домен, по которому идет отчет)',
    'rua.contains.li2': 'IP-адреса источников и количество сообщений (count)',
    'rua.contains.li3': 'Результаты SPF / DKIM / DMARC (pass/fail и т. п.)',
    'rua.contains.li4': 'Результаты alignment домена From',
    'rua.contains.li5': 'Период отчета (begin/end) и информация об организации-репортере',

    'rua.risk.title': 'Самый большой риск (важно)',
    'rua.risk.p1.html': 'RUA не содержит тела писем, но может раскрывать сведения о вашей <strong>инфраструктуре отправки (исходные IP, объемы, сервисы отправки)</strong>. В случае утечки злоумышленники могут изучить маршруты отправки и использовать это для таргетинга, фишинга или подмены.',
    'rua.risk.p2.html': 'То есть это не “безопасно, потому что нет тела”. Это может стать <strong>картой почтовых операций организации</strong>.',
    'rua.risk.mitigate.html': 'Чтобы минимизировать риск, мы обеспечиваем <strong>минимизацию данных (без хранения сырого XML)</strong>, <strong>доступ по принципу наименьших привилегий</strong>, <strong>автоматическую обработку</strong>, <strong>только минимальные необратимые агрегаты</strong> и <strong>удаление + остановку приема при прекращении</strong>.',

    'rua.data.title': 'Обработка данных (без хранения / автоматизация)',
    'rua.data.li1': 'Мы не храним исходный RUA XML (без персистентности).',
    'rua.data.li2': 'Мы не предполагаем ручной просмотр отдельных отчетов.',
    'rua.data.li3': 'Мы формируем только минимальные необратимые агрегаты для отображения/рекомендаций и затем удаляем исходные данные.',
    'rua.data.li4': 'При остановке мы удаляем связанные данные (если есть) и прекращаем дальнейший прием.',
    'rua.data.note': '“Необратимая агрегация” — это результаты, по которым нельзя восстановить отдельный отчет (например, дневные суммы). Если это не нужно, можно не хранить даже агрегаты.',

    'rua.gdpr.title': 'Конфиденциальность / GDPR (кратко)',
    'rua.gdpr.intro': 'Краткое описание того, что должен знать пользователь, и как мы обрабатываем данные в соответствии с GDPR (не юридическая консультация).',

    'rua.gdpr.user.title': 'Что важно знать пользователю (важно)',
    'rua.gdpr.user.li1': 'Полномочия и законность: используйте сервис только для доменов, которыми вы управляете, или при наличии явного разрешения (настройка RUA — административное действие).',
    'rua.gdpr.user.li2': 'Возможные персональные данные: исходные IP и иногда контактные email могут присутствовать и быть персональными данными в зависимости от контекста. Определите правовое основание по вашей политике.',
    'rua.gdpr.user.li3': 'Считайте конфиденциальным: нет тела писем, но возможна утечка операционных паттернов. Рекомендуем считать конфиденциальной информацией.',
    'rua.gdpr.user.li4': 'Остановка/удаление: после остановки мы прекращаем прием и по умолчанию удаляем связанные данные. Также остановите отправку в DNS (ниже).',

    'rua.gdpr.us.title': 'Что делаем мы (ключевые пункты)',
    'rua.gdpr.us.li1': 'Минимизация данных: без хранения сырого XML; только минимальная необратимая агрегация.',
    'rua.gdpr.us.li2': 'Без вторичного использования: не используем для рекламы/маркетинга (RUA для этого не подходит, и мы не сохраняем по-отчетные данные, которые могли бы это позволить).',
    'rua.gdpr.us.li3': 'Меры безопасности: контроль доступа, минимальные привилегии, шифрование и т. д. для защиты конфиденциальности и целостности.',
    'rua.gdpr.us.li4': 'Управление субподрядчиками: при использовании поставщиков — GDPR-согласованные условия (например, DPA).',
    'rua.gdpr.us.li5': 'Удаление и сотрудничество: поддерживаем запросы на удаление/права через контроллера (клиента).',

    'rua.roles.title': 'Роли (Controller / Processor)',
    'rua.roles.li1.html': '<strong>Клиент (вы/ваша организация):</strong> обычно <strong>Controller</strong>, определяет цели и средства получения/анализа RUA.',
    'rua.roles.li2.html': '<strong>Провайдер сервиса:</strong> обычно <strong>Processor</strong>, обрабатывает по документированным инструкциям (DPA/договор).',

    'rua.dataTypes.title': 'Данные, которые мы можем обрабатывать (типично)',
    'rua.dataTypes.li1': 'Домен, период отчета, результаты аутентификации (SPF/DKIM/DMARC pass/fail и т. п.)',
    'rua.dataTypes.li2': 'Исходные IP и количества (в агрегированном виде)',
    'rua.dataTypes.li3': 'Информация об организации-репортере (иногда контактные email)',
    'rua.dataTypes.note': 'Примечание: IP-адреса и контактные email могут быть персональными данными в зависимости от контекста.',

    'rua.purpose.title': 'Цели обработки',
    'rua.purpose.li1': 'Выявление признаков подмены/ошибок аутентификации и контроль “здоровья” отправки (security operations)',
    'rua.purpose.li2': 'Рекомендации по улучшению SPF/DKIM/DMARC и проверка поэтапного внедрения',
    'rua.purpose.li3': 'Поддержка сервиса и предотвращение злоупотреблений (rate limiting, реагирование на инциденты) с минимальными данными',

    'rua.legal.title': 'Правовое основание (общие примеры)',
    'rua.legal.li1.html': '<strong>Controller (клиент):</strong> часто законный интерес (GDPR 6(1)(f): безопасность) или договор (6(1)(b)), в зависимости от использования.',
    'rua.legal.li2.html': '<strong>Processor (этот сервис):</strong> обрабатывает на основании договора/DPA и документированных инструкций (GDPR 28).',
    'rua.legal.note': 'Зависит от сценария использования и внутренней политики. Для официальных уведомлений определите основание.',

    'rua.retention.title': 'Сроки хранения и удаление',
    'rua.retention.li1.html': '<strong>Сырой RUA XML:</strong> не хранится; удаляется после обработки.',
    'rua.retention.li2.html': '<strong>Необратимые агрегаты:</strong> только необходимое; удаление в пределах <strong>30 дней (конец пробного периода)</strong> при отсутствии продолжения (цель дизайна).',
    'rua.retention.li3.html': '<strong>После остановки:</strong> данные удаляются по умолчанию и прием прекращается.',

    'rua.subprocessors.title': 'Третьи лица / субпроцессоры',
    'rua.subprocessors.body.html': 'Если мы используем поставщиков для хостинга/хранения/мониторинга, они могут быть субпроцессорами по GDPR. В продакшене мы предоставляем <strong>список поставщиков (название/страна/цель)</strong> и оформляем необходимые условия (DPA, SCC и т. д.) при необходимости.',

    'rua.transfer.title': 'Международные передачи (вне ЕЭЗ)',
    'rua.transfer.body': 'Если возможна передача данных вне ЕЭЗ, мы применяем соответствующие меры защиты, например SCC.',

    'rua.rights.title': 'Права субъектов данных (канал запросов)',
    'rua.rights.li1': 'Доступ, исправление, удаление, ограничение обработки, возражение, переносимость и т. д. (по применимости)',
    'rua.rights.li2.html': 'Запросы обычно обрабатывает <strong>Controller (клиент)</strong>. Как процессор, мы сотрудничаем по запросу контроллера.',

    'rua.contact.title': 'Контакты',
    'rua.contact.body.html': 'Вопросы по конфиденциальности/обработке данных: <strong>privacy@toppymicros.com</strong><br>Оператор: <strong>ToppyMicroServices OÜ</strong> (домен: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'Жалобы',
    'rua.complaints.body': 'Жители ЕС/ЕЭЗ имеют право подать жалобу в местный надзорный орган (SA).',

    'rua.trial.title': 'Пробный период и остановка (ключевые пункты)',
    'rua.trial.li1.html': '<strong>Старт пробного периода:</strong> первое успешное принятие RUA (активация)',
    'rua.trial.li2.html': '<strong>Конец пробного периода:</strong> через 30 дней после старта (UI показывает оставшиеся дни)',
    'rua.trial.li3.html': '<strong>Продолжить:</strong> явный opt-in в один клик (например, “Keep enabled”)',
    'rua.trial.li4.html': '<strong>По умолчанию:</strong> автоматическая остановка на 30-й день (без opt-in продолжения нет)',
    'rua.trial.li5.html': '<strong>Данные при остановке:</strong> по умолчанию удаляются (опционально — только анонимные метрики)',

    'rua.stop.title': 'Как остановить RUA после прекращения',
    'rua.stop.intro': 'Рекомендуемый порядок:',
    'rua.stop.a.title.html': '<strong>A (рекомендуется):</strong> отключить DNS-авторизацию внешнего RUA, чтобы отправители не могли доставлять',
    'rua.stop.a.detail': 'Пример: отключить TXT/CNAME, используемый для авторизации назначения RUA, чтобы доставка не могла завершиться.',
    'rua.stop.b.title.html': '<strong>B:</strong> принимать, но удалять (дороже; крайний вариант)',
    'rua.stop.b.detail': 'Удалять при получении. Сильная гарантия остановки, но выше затраты на сеть/обработку.',

    'rua.ui.title': 'UI (фиксируется сверху дашборда)',
    'rua.ui.li1': 'Осталось дней: “◯ days left”',
    'rua.ui.li2': 'Кнопка продолжения: “Keep enabled”',
    'rua.ui.li3': 'Кнопка остановки: “Stop now”',
    'rua.ui.li4': 'Статус всегда виден в первом экране и остается закрепленным при прокрутке.',

    'rua.links.back': '← Назад к Quick Check',
    'rua.links.spec': 'Спецификация сервиса (docs)'
  });

  // Chinese (Simplified)
  add('zh', {
    'rua.pageTitle': 'Toppy DNS / RUA 服务规格',
    'rua.pill': 'RUA（DMARC 汇总报告）服务 — 关键规格',
    'rua.h1': 'RUA 接收端点 / 停止设计 / 数据处理',
    'rua.tagline': '免费试用将在 30 天后自动停止.继续使用需要明确的 opt-in.停止后将不再接收新的 RUA 报告.',

    'rua.setup.title': '如何配置 RUA（客户侧）',
    'rua.setup.intro.html': '将本服务提供的 RUA 接收地址（<span class="code">mailto:</span>）填入 DMARC 记录的 <span class="code">rua=</span><strong>保留你现有的 DMARC 设置（p= / sp= / adkim= / aspf= 等）</strong>，只需添加（或更新）<span class="code">rua=</span>.',
    'rua.setup.step1.html': '<strong>1)</strong> 编辑你的域名 DMARC 记录（通常为 <span class="code">_dmarc</span>）.',
    'rua.setup.step2.html': '<strong>2)</strong> 添加（或更新）<span class="code">rua=mailto:{RUA_EMAIL}</span>.',
    'rua.setup.step3.html': '<strong>3)</strong> 部分接收方会要求外部目的地验证（RFC 7489 §7.1）.但<strong>所需 TXT 记录由本服务在我方域名下自动创建</strong>；你无需在自己的 DNS 中添加任何内容.',
    'rua.setup.step4.html': '<strong>4)</strong> DNS 生效后，报告通常会在 24–48 小时内开始到达.',
    'rua.setup.note': '注意：如果你已经有 DMARC 记录，请保留现有策略/标签，仅追加 rua=（也可配置多个 mailto 目的地）.',

    'rua.disclaimer.title': '免责声明',
    'rua.disclaimer.body': '免费试用（30 天）.一键显式 opt-in 继续.Best-effort 且有 fair-use 限制；无 SLA.',

    'rua.what.title': '什么是 RUA？',
    'rua.what.body': 'RUA 是 DMARC 汇总报告（Aggregate Report）的接收地址.接收方（Gmail / Microsoft / 各 ISP）通常每天发送一次 XML 汇总，描述声称来自你域名的邮件的认证结果.',
    'rua.what.note': '重要：这不是邮件正文，而是汇总元数据，但在运维上仍可能敏感.',
    'rua.what.ruf.html': '注：DMARC 还有 <span class="code">ruf=</span>（forensic/失败报告），可能包含按单封邮件的细节，因此在隐私/合规方面需要谨慎处理.本服务仅处理 <span class="code">rua=</span>（汇总报告）.',

    'rua.contains.title': 'RUA 报告通常包含',
    'rua.contains.li1': '目标域名（被报告的域名）',
    'rua.contains.li2': '来源 IP 与邮件数量（count）',
    'rua.contains.li3': 'SPF / DKIM / DMARC 评估结果（pass/fail 等）',
    'rua.contains.li4': 'From 域名对齐（alignment）结果',
    'rua.contains.li5': '报告周期（begin/end）及报告组织信息',

    'rua.risk.title': '最大风险（重要）',
    'rua.risk.p1.html': 'RUA 不包含正文，但可能暴露关于 <strong>发送基础设施（来源 IP、发送量、发送服务）</strong> 的线索.若泄露，攻击者可能学习你的发送路径，用于更精准的定向、钓鱼或冒充.',
    'rua.risk.p2.html': '因此并非“没有正文就安全”.它可能成为 <strong>组织邮件运维的地图</strong>.',
    'rua.risk.mitigate.html': '为降低风险，我们执行 <strong>数据最小化（不存储原始 XML）</strong>、<strong>最小权限访问控制</strong>、<strong>自动化处理</strong>、<strong>仅保留最小的不可逆汇总</strong>，以及 <strong>终止时删除 + 停止接收</strong>.',

    'rua.data.title': '数据处理（不存储 / 自动化）',
    'rua.data.li1': '不存储原始 RUA XML（无持久化）.',
    'rua.data.li2': '不以人工逐份查看报告为前提（自动处理）.',
    'rua.data.li3': '仅生成用于展示/建议所需的最小不可逆汇总，然后丢弃源数据.',
    'rua.data.li4': '停止时删除相关数据（如有）并停止后续接收.',
    'rua.data.note': '“不可逆汇总”指无法反推出单份报告内容的输出（例如每日总量）.如无需汇总，也可设计为不保留汇总.',

    'rua.gdpr.title': '隐私 / GDPR（摘要）',
    'rua.gdpr.intro': '本节摘要说明用户应了解的要点，以及我们如何按 GDPR 处理数据（非法律建议）.',

    'rua.gdpr.user.title': '用户需要了解（重要）',
    'rua.gdpr.user.li1': '权限与合法性：仅用于你控制或已获明确授权的域名（设置 RUA 目的地属于管理操作）.',
    'rua.gdpr.user.li2': '可能包含个人数据：来源 IP 及某些情况下的联系邮箱等，视情境可能属于个人数据.请按内部政策明确合法依据.',
    'rua.gdpr.user.li3': '按机密对待：虽无正文，但可能暴露运维模式，建议按机密信息处理.',
    'rua.gdpr.user.li4': '停止/删除：停止后我们默认停止接收并删除相关数据.也请务必在 DNS 中停止（见下文）.',

    'rua.gdpr.us.title': '我们如何处理（要点）',
    'rua.gdpr.us.li1': '数据最小化：不存储原始 XML，仅处理最小不可逆汇总.',
    'rua.gdpr.us.li2': '不作二次用途：不用于广告/营销（RUA 本身不适用于该目的，我们也不保留可用于该目的的按报告数据）.',
    'rua.gdpr.us.li3': '安全措施：访问控制、最小权限、加密等，保护机密性与完整性.',
    'rua.gdpr.us.li4': '委托管理：如使用供应商，按 GDPR 条款（如 DPA）进行管理.',
    'rua.gdpr.us.li5': '删除与协助：通过控制者（客户）提出的删除/权利请求，我们将配合.',

    'rua.roles.title': '角色（Controller / Processor）',
    'rua.roles.li1.html': '<strong>客户（你/你的组织）：</strong> 通常为 <strong>控制者（Controller）</strong>，决定接收/分析 RUA 的目的与方式.',
    'rua.roles.li2.html': '<strong>服务提供方：</strong> 通常为 <strong>处理者（Processor）</strong>，在合同/DPA 约定与书面指示下处理.',

    'rua.dataTypes.title': '可能处理的数据（常见）',
    'rua.dataTypes.li1': '域名、报告周期、认证结果（SPF/DKIM/DMARC pass/fail 等）',
    'rua.dataTypes.li2': '来源 IP 与数量（汇总）',
    'rua.dataTypes.li3': '报告组织信息（以及某些情况下联系邮箱）',
    'rua.dataTypes.note': '注意：IP 地址与联系邮箱在某些情境下可能属于个人数据.',

    'rua.purpose.title': '处理目的',
    'rua.purpose.li1': '识别冒充/误认证迹象，验证发送路径健康状况（安全运维）',
    'rua.purpose.li2': '提供 SPF/DKIM/DMARC 配置改进建议并验证分阶段部署',
    'rua.purpose.li3': '以最小数据维持服务并防止滥用（限速、故障/事件响应）',

    'rua.legal.title': '法律依据（一般示例）',
    'rua.legal.li1.html': '<strong>控制者（客户）侧：</strong> 通常为合法利益（GDPR 6(1)(f)：安全）或合同履行（6(1)(b)）等，视用途而定.',
    'rua.legal.li2.html': '<strong>处理者（本服务）侧：</strong> 基于合同/DPA 并按书面指示处理（GDPR 28）.',
    'rua.legal.note': '依据取决于使用场景与内部政策.正式隐私通知请自行明确.',

    'rua.retention.title': '保留期限与删除',
    'rua.retention.li1.html': '<strong>原始 RUA XML：</strong> 不存储，处理后丢弃.',
    'rua.retention.li2.html': '<strong>不可逆汇总：</strong> 仅限必要范围；若不继续使用，最迟在 <strong>30 天（试用结束）</strong> 内删除（设计目标）.',
    'rua.retention.li3.html': '<strong>停止后：</strong> 默认删除相关数据并停止接收.',

    'rua.subprocessors.title': '第三方 / 分包处理方',
    'rua.subprocessors.body.html': '如将托管/存储/监控等委托给第三方，其可能构成 GDPR 下的分包处理方.正式运营时将提供 <strong>供应商清单（名称/国家/目的）</strong>，并按需完善 DPA、SCC 等条款.',

    'rua.transfer.title': '跨境传输（EEA 之外）',
    'rua.transfer.body': '若存在向 EEA 之外传输的可能，我们将按要求采用 SCC 等适当保障措施.',

    'rua.rights.title': '数据主体权利（请求渠道）',
    'rua.rights.li1': '访问、更正、删除、限制处理、反对、数据可携带等（适用范围内）',
    'rua.rights.li2.html': '请求通常先由 <strong>控制者（客户）</strong> 受理.作为处理者，我们将按控制者请求配合.',

    'rua.contact.title': '联系',
    'rua.contact.body.html': '隐私/数据处理咨询：<strong>privacy@toppymicros.com</strong><br>运营方：<strong>ToppyMicroServices OÜ</strong>（域名：<strong>toppymicros.com</strong>）',

    'rua.complaints.title': '投诉',
    'rua.complaints.body': 'EU/EEA 居民有权向所在地监管机构（SA）提出投诉.',

    'rua.trial.title': '试用与停止（要点）',
    'rua.trial.li1.html': '<strong>试用开始：</strong> 首次成功接收（激活）RUA',
    'rua.trial.li2.html': '<strong>试用结束：</strong> 开始后 30 天（UI 显示剩余天数）',
    'rua.trial.li3.html': '<strong>继续使用：</strong> 一键显式 opt-in（例如 “Keep enabled”）',
    'rua.trial.li4.html': '<strong>默认：</strong> 第 30 天自动停止（无 opt-in 则不继续）',
    'rua.trial.li5.html': '<strong>停止时数据：</strong> 默认删除（可选仅保留匿名服务指标）',

    'rua.stop.title': '终止后如何停止 RUA',
    'rua.stop.intro': '推荐顺序：',
    'rua.stop.a.title.html': '<strong>A（推荐）：</strong> 关闭外部 RUA 授权 DNS，让发送方无法投递',
    'rua.stop.a.detail': '示例：停用用于授权 RUA 目的地的 TXT/CNAME，使投递无法成功.',
    'rua.stop.b.title.html': '<strong>B：</strong> 接收但丢弃（成本更高；最后手段）',
    'rua.stop.b.detail': '到达即丢弃.停止保证更强，但网络/处理成本增加.',

    'rua.ui.title': 'UI（固定在仪表盘顶部）',
    'rua.ui.li1': '剩余天数： “◯ days left”',
    'rua.ui.li2': '继续按钮： “Keep enabled”',
    'rua.ui.li3': '立即停止： “Stop now”',
    'rua.ui.li4': '状态始终在首屏可见，滚动时保持固定显示.',

    'rua.links.back': '← 返回 Quick Check',
    'rua.links.spec': '服务规格（docs）'
  });

  // Khmer
  add('km', {
    'rua.pageTitle': 'Toppy DNS / សេចក្ដីបញ្ជាក់សេវា RUA',
    'rua.pill': 'សេវា RUA (របាយការណ៍សរុប DMARC) — សេចក្ដីសង្ខេប',
    'rua.h1': 'ច្រកទទួល RUA / ការរចនាបញ្ឈប់ / ការដោះស្រាយទិន្នន័យ',
    'rua.tagline': 'សាកល្បងឥតគិតថ្លៃនឹងបញ្ឈប់ដោយស្វ័យប្រវត្តិបន្ទាប់ពី 30 ថ្ងៃ។ ដើម្បីបន្ត ត្រូវការ opt-in ដោយច្បាស់លាស់។ បន្ទាប់ពីបញ្ឈប់ នឹងមិនទទួលរបាយការណ៍ RUA ថ្មីទៀត។',

    'rua.setup.title': 'របៀបកំណត់ RUA (ខាងអតិថិជន)',
    'rua.setup.intro.html': 'ដាក់អាសយដ្ឋាន RUA ដែលសេវានេះផ្តល់ (<span class="code">mailto:</span>) ទៅក្នុង tag <span class="code">rua=</span> នៅលើ DMARC record របស់អ្នក។ <strong>រក្សាទុកការកំណត់ DMARC ដែលមានស្រាប់ (p= / sp= / adkim= / aspf= ជាដើម)</strong> ហើយគ្រាន់តែបន្ថែម (ឬកែប្រែ) <span class="code">rua=</span> ប៉ុណ្ណោះ។',
    'rua.setup.step1.html': '<strong>1)</strong> កែប្រែ DMARC record របស់ដែន (ភាគច្រើនជា <span class="code">_dmarc</span>)។',
    'rua.setup.step2.html': '<strong>2)</strong> បន្ថែម (ឬកែប្រែ) <span class="code">rua=mailto:{RUA_EMAIL}</span>។',
    'rua.setup.step3.html': '<strong>3)</strong> អ្នកទទួលខ្លះអាចទាមទារ external destination verification (RFC 7489 §7.1)។ ទោះយ៉ាងណា <strong>សេវានេះនឹងបង្កើត TXT ដែលត្រូវការ​នៅក្រោមដូម៉ែនរបស់យើងដោយស្វ័យប្រវត្តិ</strong> ហើយអ្នកមិនចាំបាច់កែ DNS ទេ។',
    'rua.setup.step4.html': '<strong>4)</strong> បន្ទាប់ពី DNS អនុវត្ត របាយការណ៍ជាទូទៅនឹងចាប់ផ្តើមមកក្នុង 24–48 ម៉ោង។',
    'rua.setup.note': 'ចំណាំ: ប្រសិនបើមាន DMARC record រួចហើយ សូមរក្សាទុក tag/policy ដើម ហើយបន្ថែមតែ rua= ប៉ុណ្ណោះ (អាចមាន mailto ច្រើន)។',

    'rua.disclaimer.title': 'សេចក្ដីបដិសេធទំនួលខុសត្រូវ',
    'rua.disclaimer.body': 'សាកល្បងឥតគិតថ្លៃ (30 ថ្ងៃ)។ បន្តដោយចុចមួយដង (opt-in ច្បាស់)។ Best-effort ជាមួយដែនកំណត់ fair-use; គ្មាន SLA។',

    'rua.what.title': 'RUA ជាអ្វី?',
    'rua.what.body': 'RUA គឺជាគោលដៅសម្រាប់របាយការណ៍សរុប DMARC។ អ្នកទទួល (Gmail / Microsoft / ISP) ជាទូទៅផ្ញើសង្ខេប XML ប្រចាំថ្ងៃអំពីលទ្ធផលផ្ទៀងផ្ទាត់ សម្រាប់អ៊ីមែលដែលអះអាងដែនរបស់អ្នក។',
    'rua.what.note': 'សំខាន់: នេះមិនមែនជាមាតិកាអ៊ីមែលទេ។ វាជាមេតាទិន្នន័យសរុប ដែលអាចមានភាពងាយរងគ្រោះក្នុងការប្រតិបត្តិការបាន។',
    'rua.what.ruf.html': 'ចំណាំ: DMARC ក៏មាន <span class="code">ruf=</span> (របាយការណ៍ forensic/បរាជ័យ) ដែលអាចមានព័ត៌មានលម្អិតតាមសារមួយៗ ដូច្នេះត្រូវប្រុងប្រយ័ត្នផ្នែកឯកជនភាព/ការអនុលោមតាមច្បាប់។ សេវានេះគាំទ្រតែ <span class="code">rua=</span> (របាយការណ៍សរុប) ប៉ុណ្ណោះ។',

    'rua.contains.title': 'អ្វីដែលរបាយការណ៍ RUA ជាទូទៅមាន',
    'rua.contains.li1': 'ដែនគោលដៅ (ដែនដែលត្រូវរាយការណ៍)',
    'rua.contains.li2': 'IP ប្រភព និងចំនួនសារ (count)',
    'rua.contains.li3': 'លទ្ធផល SPF / DKIM / DMARC (pass/fail ជាដើម)',
    'rua.contains.li4': 'លទ្ធផល alignment របស់ From-domain',
    'rua.contains.li5': 'រយៈពេលរបាយការណ៍ (begin/end) និងព័ត៌មានអង្គការរាយការណ៍',

    'rua.risk.title': 'ហានិភ័យធំបំផុត (សំខាន់)',
    'rua.risk.p1.html': 'RUA មិនមានមាតិកាសារ ប៉ុន្តែអាចបង្ហាញសញ្ញាអំពី <strong>ហេដ្ឋារចនាសម្ព័ន្ធផ្ញើ (IP ប្រភព បរិមាណ និងសេវាផ្ញើ)</strong>។ ប្រសិនបើលេចធ្លាយ អ្នកវាយប្រហារអាចរៀនផ្លូវផ្ញើ ហើយប្រើសម្រាប់ការជ្រើសគោលដៅ ការបន្លំ ឬការក្លែងបន្លំ។',
    'rua.risk.p2.html': 'ដូច្នេះ “គ្មានមាតិកា = សុវត្ថិភាព” មិនមែនជាការពិតទេ។ វាអាចក្លាយជា <strong>ផែនទីប្រតិបត្តិការអ៊ីមែលរបស់អង្គការ</strong>។',
    'rua.risk.mitigate.html': 'ដើម្បីកាត់បន្ថយហានិភ័យ យើងអនុវត្ត <strong>បន្ថយទិន្នន័យ (មិនរក្សាទុក XML ដើម)</strong>, <strong>ការគ្រប់គ្រងសិទ្ធិ least-privilege</strong>, <strong>ដំណើរការដោយស្វ័យប្រវត្តិ</strong>, <strong>រក្សាទុកតែសរុបដែលមិនអាចត្រឡប់វិញបានតិចបំផុត</strong> និង <strong>លុប + បញ្ឈប់ការទទួលនៅពេលបញ្ចប់</strong>។',

    'rua.data.title': 'ការដោះស្រាយទិន្នន័យ (មិនរក្សាទុក / ស្វ័យប្រវត្តិ)',
    'rua.data.li1': 'មិនរក្សាទុក RUA XML ដើម (គ្មានការរក្សាទុកថេរ)។',
    'rua.data.li2': 'មិនគ្រោងឲ្យមនុស្សពិនិត្យរបាយការណ៍រៀងៗខ្លួន។',
    'rua.data.li3': 'បង្កើតតែសរុបដែលមិនអាចត្រឡប់វិញបាន តិចបំផុតសម្រាប់បង្ហាញ/ផ្តល់អនុសាសន៍ ហើយបោះចោលទិន្នន័យដើម។',
    'rua.data.li4': 'ពេលបញ្ឈប់ នឹងលុបទិន្នន័យដែលពាក់ព័ន្ធ (បើមាន) និងបញ្ឈប់ការទទួលបន្ថែម។',
    'rua.data.note': '“សរុបដែលមិនអាចត្រឡប់វិញបាន” មានន័យថាមិនអាចស្តារឡើងវិញជារបាយការណ៍មួយៗបាន (ឧ. សរុបប្រចាំថ្ងៃ)។ ប្រសិនបើមិនចាំបាច់ អាចរចនាឲ្យមិនរក្សាទុកសរុបទៀត។',

    'rua.gdpr.title': 'ឯកជនភាព / GDPR (សង្ខេប)',
    'rua.gdpr.intro': 'ផ្នែកនេះសង្ខេបអំពីអ្វីដែលអ្នកប្រើត្រូវដឹង និងរបៀបដែលយើងដោះស្រាយទិន្នន័យតាម GDPR (មិនមែនជាការណែនាំផ្នែកច្បាប់ទេ)។',

    'rua.gdpr.user.title': 'អ្វីដែលអ្នកត្រូវដឹង (សំខាន់)',
    'rua.gdpr.user.li1': 'សិទ្ធិ និងភាពស្របច្បាប់: ប្រើសម្រាប់ដែនដែលអ្នកគ្រប់គ្រង ឬមានការអនុញ្ញាតច្បាស់លាស់ប៉ុណ្ណោះ (ការកំណត់ RUA គឺជាការគ្រប់គ្រង)។',
    'rua.gdpr.user.li2': 'អាចមានទិន្នន័យផ្ទាល់ខ្លួន: IP ប្រភព និងអ៊ីមែលទំនាក់ទំនង (ខ្លះ) អាចមាន និងអាចជាទិន្នន័យផ្ទាល់ខ្លួន តាមបរិបទ។ សូមកំណត់មូលដ្ឋានច្បាប់តាមគោលការណ៍ក្នុងស្ថាប័ន។',
    'rua.gdpr.user.li3': 'ចាត់ទុកជាសម្ងាត់: មិនមានមាតិកា ប៉ុន្តែអាចបង្ហាញលំនាំប្រតិបត្តិការ។ សូមចាត់ទុកជាព័ត៌មានសម្ងាត់។',
    'rua.gdpr.user.li4': 'បញ្ឈប់/លុប: បន្ទាប់ពីបញ្ឈប់ យើងបញ្ឈប់ការទទួល និងលុបទិន្នន័យដែលពាក់ព័ន្ធជាលំនាំដើម។ សូមបញ្ឈប់នៅក្នុង DNS ផងដែរ (ខាងក្រោម)។',

    'rua.gdpr.us.title': 'អ្វីដែលយើងធ្វើ (ចំណុចសំខាន់)',
    'rua.gdpr.us.li1': 'បន្ថយទិន្នន័យ: មិនរក្សាទុក XML ដើម; រក្សាទុកតែសរុបមិនអាចត្រឡប់វិញបានតិចបំផុត។',
    'rua.gdpr.us.li2': 'មិនប្រើបំណងផ្សេង: មិនប្រើសម្រាប់ផ្សព្វផ្សាយ/ទីផ្សារ (RUA មិនសមស្រប ហើយយើងមិនរក្សាទុកទិន្នន័យតាមរបាយការណ៍ដែលអាចអនុញ្ញាតឲ្យធ្វើបាន)។',
    'rua.gdpr.us.li3': 'វិធានសុវត្ថិភាព: គ្រប់គ្រងការចូលដំណើរការ least privilege, អ៊ិនគ្រីប… ដើម្បីការពារសម្ងាត់ និងភាពត្រឹមត្រូវ។',
    'rua.gdpr.us.li4': 'ការគ្រប់គ្រងអ្នកផ្គត់ផ្គង់: ប្រសិនបើមាន អនុវត្តកិច្ចសន្យាស្រប GDPR (ឧ. DPA)។',
    'rua.gdpr.us.li5': 'លុប និងសហការ: គាំទ្រសំណើលុប/សិទ្ធិ តាម Controller (អតិថិជន)។',

    'rua.roles.title': 'តួនាទី (Controller / Processor)',
    'rua.roles.li1.html': '<strong>អតិថិជន (អ្នក/អង្គការរបស់អ្នក):</strong> ជាទូទៅជា <strong>Controller</strong> កំណត់គោលបំណង និងវិធីសាស្ត្រទទួល/វិភាគ RUA។',
    'rua.roles.li2.html': '<strong>អ្នកផ្តល់សេវា:</strong> ជាទូទៅជា <strong>Processor</strong> ដំណើរការតាមការណែនាំដែលបានកត់ត្រា (DPA/កិច្ចសន្យា)។',

    'rua.dataTypes.title': 'ទិន្នន័យអាចដំណើរការ (ទូទៅ)',
    'rua.dataTypes.li1': 'ដែន រយៈពេលរបាយការណ៍ លទ្ធផលផ្ទៀងផ្ទាត់ (SPF/DKIM/DMARC pass/fail…)។',
    'rua.dataTypes.li2': 'IP ប្រភព និងចំនួន (សរុប)។',
    'rua.dataTypes.li3': 'ព័ត៌មានអង្គការរាយការណ៍ (និងអ៊ីមែលទំនាក់ទំនងខ្លះ)។',
    'rua.dataTypes.note': 'ចំណាំ: IP និងអ៊ីមែលទំនាក់ទំនង អាចជាទិន្នន័យផ្ទាល់ខ្លួនតាមបរិបទ។',

    'rua.purpose.title': 'គោលបំណងដំណើរការ',
    'rua.purpose.li1': 'រកឃើញការក្លែងបន្លំ/បញ្ហាផ្ទៀងផ្ទាត់ និងពិនិត្យសុខភាពផ្លូវផ្ញើ (សុវត្ថិភាព)។',
    'rua.purpose.li2': 'ផ្តល់អនុសាសន៍កែលម្អ SPF/DKIM/DMARC និងផ្ទៀងផ្ទាត់ការអនុវត្តជាដំណាក់កាល។',
    'rua.purpose.li3': 'រក្សាសេវា និងការពារការប្រើប្រាស់ខុស (rate limit, ដោះស្រាយហេតុការណ៍) ជាមួយទិន្នន័យតិចបំផុត។',

    'rua.legal.title': 'មូលដ្ឋានច្បាប់ (ឧទាហរណ៍ទូទៅ)',
    'rua.legal.li1.html': '<strong>Controller (អតិថិជន):</strong> ជាទូទៅអាចជា legitimate interests (GDPR 6(1)(f): សុវត្ថិភាព) ឬកិច្ចសន្យា (6(1)(b)) តាមករណី។',
    'rua.legal.li2.html': '<strong>Processor (សេវានេះ):</strong> ដំណើរការតាមកិច្ចសន្យា/DPA និងការណែនាំដែលបានកត់ត្រា (GDPR 28)។',
    'rua.legal.note': 'អាស្រ័យលើករណីប្រើប្រាស់ និងគោលការណ៍ក្នុងស្ថាប័ន។ សម្រាប់ការជូនដំណឹងផ្លូវការ សូមកំណត់មូលដ្ឋានឲ្យសមស្រប។',

    'rua.retention.title': 'រយៈពេលរក្សាទុក និងលុប',
    'rua.retention.li1.html': '<strong>RUA XML ដើម:</strong> មិនរក្សាទុក; បោះចោលបន្ទាប់ពីដំណើរការ។',
    'rua.retention.li2.html': '<strong>សរុបមិនអាចត្រឡប់វិញបាន:</strong> កំណត់ត្រឹមត្រូវតាមតម្រូវការ; បើមិនបន្ត នឹងលុបក្នុងអតិបរមា <strong>30 ថ្ងៃ (ចប់សាកល្បង)</strong> (គោលដៅរចនា)។',
    'rua.retention.li3.html': '<strong>បន្ទាប់ពីបញ្ឈប់:</strong> លុបទិន្នន័យដែលពាក់ព័ន្ធជាលំនាំដើម និងបញ្ឈប់ការទទួល។',

    'rua.subprocessors.title': 'ភាគីទីបី / Sub-processors',
    'rua.subprocessors.body.html': 'ប្រសិនបើយើងប្រើអ្នកផ្គត់ផ្គង់សម្រាប់ hosting/storage/monitoring ពួកគេអាចជាសាបប្រូសេសស័រ តាម GDPR។ ក្នុងការប្រើប្រាស់ផ្លូវការ យើងនឹងផ្តល់ <strong>បញ្ជីអ្នកផ្គត់ផ្គង់ (ឈ្មោះ/ប្រទេស/គោលបំណង)</strong> និងរៀបចំលក្ខខណ្ឌ (DPA, SCC…) តាមចាំបាច់។',

    'rua.transfer.title': 'ការផ្ទេរទៅប្រទេសទីបី (ក្រៅ EEA)',
    'rua.transfer.body': 'ប្រសិនបើអាចផ្ទេរទិន្នន័យក្រៅ EEA យើងនឹងអនុវត្តវិធានការការពារសមស្រប ដូចជា SCC តាមច្បាប់។',

    'rua.rights.title': 'សិទ្ធិរបស់មុខវិជ្ជាទិន្នន័យ (ច្រកស្នើសុំ)',
    'rua.rights.li1': 'ការចូលមើល កែតម្រូវ លុប កំណត់ការដំណើរការ បដិសេធ ការផ្ទេរទិន្នន័យ… (តាមដែលអនុវត្ត)។',
    'rua.rights.li2.html': 'ជាទូទៅ សំណើត្រូវដាក់តាម <strong>Controller (អតិថិជន)</strong>។ ក្នុងនាម processor យើងនឹងសហការតាមសំណើរបស់ controller។',

    'rua.contact.title': 'ទំនាក់ទំនង',
    'rua.contact.body.html': 'សំណួរអំពីឯកជនភាព/ការដំណើរការទិន្នន័យ: <strong>privacy@toppymicros.com</strong><br>ប្រតិបត្តិការ: <strong>ToppyMicroServices OÜ</strong> (ដែន: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'ការតវ៉ា',
    'rua.complaints.body': 'អ្នករស់នៅ EU/EEA មានសិទ្ធិតវ៉ាទៅអាជ្ញាធរត្រួតពិនិត្យ (SA) ក្នុងតំបន់របស់ខ្លួន។',

    'rua.trial.title': 'សាកល្បង និងបញ្ឈប់ (ចំណុចសំខាន់)',
    'rua.trial.li1.html': '<strong>ចាប់ផ្តើមសាកល្បង:</strong> ការទទួល RUA ជោគជ័យលើកដំបូង (activate)',
    'rua.trial.li2.html': '<strong>ចប់សាកល្បង:</strong> 30 ថ្ងៃបន្ទាប់ពីចាប់ផ្តើម (បង្ហាញថ្ងៃនៅសល់)',
    'rua.trial.li3.html': '<strong>បន្ត:</strong> opt-in ច្បាស់លាស់ដោយចុចមួយដង (ឧ. “Keep enabled”)',
    'rua.trial.li4.html': '<strong>លំនាំដើម:</strong> បញ្ឈប់ស្វ័យប្រវត្តិថ្ងៃទី 30 (គ្មាន opt-in កុំបន្ត)',
    'rua.trial.li5.html': '<strong>ទិន្នន័យពេលបញ្ឈប់:</strong> លុបជាលំនាំដើម (ជាជម្រើសរក្សាទុកតែមេត្រិកអនាមិក)',

    'rua.stop.title': 'របៀបបញ្ឈប់ RUA បន្ទាប់ពីបញ្ចប់',
    'rua.stop.intro': 'លំដាប់ណែនាំ:',
    'rua.stop.a.title.html': '<strong>A (ណែនាំ):</strong> បិទ DNS អនុញ្ញាត RUA ខាងក្រៅ ដើម្បីឲ្យអ្នកផ្ញើមិនអាចផ្ញើបាន',
    'rua.stop.a.detail': 'ឧទាហរណ៍: បិទ TXT/CNAME ដែលប្រើសម្រាប់អនុញ្ញាតគោលដៅ RUA ដើម្បីឲ្យការផ្ញើមិនជោគជ័យ។',
    'rua.stop.b.title.html': '<strong>B:</strong> ទទួល ប៉ុន្តែបោះចោល (ចំណាយខ្ពស់; ជាជម្រើសចុងក្រោយ)',
    'rua.stop.b.detail': 'បោះចោលភ្លាមៗពេលមកដល់។ ធានាបញ្ឈប់បានខ្លាំង ប៉ុន្តែចំណាយលើបណ្តាញ/ដំណើរការកើនឡើង។',

    'rua.ui.title': 'UI (បង្ហាញថេរខាងលើ dashboard)',
    'rua.ui.li1': 'ថ្ងៃនៅសល់: “◯ days left”',
    'rua.ui.li2': 'ប៊ូតុងបន្ត: “Keep enabled”',
    'rua.ui.li3': 'ប៊ូតុងបញ្ឈប់ឥឡូវ: “Stop now”',
    'rua.ui.li4': 'ស្ថានភាពត្រូវឃើញបានភ្លាមៗ និងនៅតែឃើញពេល scroll។',

    'rua.links.back': '← ត្រឡប់ទៅ Quick Check',
    'rua.links.spec': 'សេចក្ដីបញ្ជាក់សេវា (docs)'
  });

  // Burmese (Myanmar)
  add('my', {
    'rua.pageTitle': 'Toppy DNS / RUA ဝန်ဆောင်မှု သတ်မှတ်ချက်',
    'rua.pill': 'RUA (DMARC Aggregate Reports) ဝန်ဆောင်မှု — အကျဉ်းချုပ်သတ်မှတ်ချက်',
    'rua.h1': 'RUA လက်ခံနေရာ / ရပ်တန့်ဒီဇိုင်း / ဒေတာကိုင်တွယ်မှု',
    'rua.tagline': 'အခမဲ့စမ်းသပ်အသုံးပြုမှုသည် 30 ရက်အပြီး အလိုအလျောက်ရပ်တန့်ပါမည်။ ဆက်လက်အသုံးပြုရန် အတည်ပြု opt-in လိုအပ်ပါသည်။ ရပ်တန့်ပြီးနောက် RUA အစီရင်ခံစာအသစ်များ မလက်ခံပါ။',

    'rua.setup.title': 'RUA ကို ဘယ်လိုသတ်မှတ်မလဲ (ဖောက်သည်ဘက်)',
    'rua.setup.intro.html': 'ဒီဝန်ဆောင်မှုက ထုတ်ပေးတဲ့ RUA လက်ခံလိပ်စာ (<span class="code">mailto:</span>) ကို သင့် DMARC record ရဲ့ <span class="code">rua=</span> ထဲမှာ သတ်မှတ်ပါ။ <strong>ရှိပြီးသား DMARC သတ်မှတ်ချက်များ (p= / sp= / adkim= / aspf= စသည်) ကို ထိန်းထားပြီး</strong> <span class="code">rua=</span> ကိုသာ ထည့် (သို့) ပြင်ဆင်ပါ။',
    'rua.setup.step1.html': '<strong>1)</strong> သင့်ဒိုမိန်းရဲ့ DMARC record ကို ပြင်ပါ (ယေဘုယျအားဖြင့် <span class="code">_dmarc</span>)။',
    'rua.setup.step2.html': '<strong>2)</strong> <span class="code">rua=mailto:{RUA_EMAIL}</span> ကို ထည့် (သို့) ပြင်ဆင်ပါ။',
    'rua.setup.step3.html': '<strong>3)</strong> အချို့လက်ခံသူများသည် external destination verification (RFC 7489 §7.1) ကိုတောင်းနိုင်သည်။ သို့သော် <strong>လိုအပ်သော TXT record ကို ကျွန်ုပ်တို့၏ဒိုမိန်းအောက်တွင် ဝန်ဆောင်မှုက အလိုအလျောက်ထုတ်ပေးမည်</strong> ဖြစ်ပြီး သင့်ဘက် DNS ပြင်ဆင်ရန် မလိုပါ။',
    'rua.setup.step4.html': '<strong>4)</strong> DNS ပြန့်ပွားပြီးနောက် ယေဘုယျအားဖြင့် 24–48 နာရီအတွင်း report များ စတင်ရောက်လာပါမယ်။',
    'rua.setup.note': 'မှတ်ချက်: DMARC record ရှိပြီးသားဖြစ်ရင် ရှိပြီးသား tag/policy ကို ထိန်းထားပြီး rua= ကိုသာ ထပ်ထည့်ပါ (mailto မျိုးစုံလည်း ထည့်နိုင်ပါသည်)။',

    'rua.disclaimer.title': 'အကန့်အသတ်/ငြင်းဆိုချက်',
    'rua.disclaimer.body': 'အခမဲ့စမ်းသပ် (30 ရက်)။ တစ်ချက်နှိပ် opt-in ဖြင့် ဆက်လက်အသုံးပြုနိုင်သည်။ Best-effort (fair-use ကန့်သတ်ချက်များ)၊ SLA မရှိ။',

    'rua.what.title': 'RUA ဆိုတာဘာလဲ?',
    'rua.what.body': 'RUA သည် DMARC ၏ aggregate report များကို လက်ခံရန် destination ဖြစ်သည်။ လက်ခံသူများ (Gmail / Microsoft / ISP များ) က များသောအားဖြင့် တစ်နေ့တစ်ကြိမ်လောက် XML အနှစ်ချုပ်ကို ပို့ပေးသည်။',
    'rua.what.note': 'အရေးကြီး: ဒီဟာက အီးမေးလ်အကြောင်းအရာမဟုတ်ပါ။ အနှစ်ချုပ် metadata ဖြစ်ပြီး လုပ်ငန်းလည်ပတ်မှုအတွက် သက်ဆိုင်ရာအရေးကြီးမှုရှိနိုင်သည်။',
    'rua.what.ruf.html': 'မှတ်ချက်: DMARC မှာ <span class="code">ruf=</span> (forensic/ပျက်ကွက် report) လည်းရှိပြီး message တစ်စောင်ချင်းအသေးစိတ် ပါဝင်နိုင်သဖြင့် privacy/လိုက်နာမှု အနေဖြင့် သတိပြုစီမံရန် လိုအပ်ပါတယ်။ ဒီဝန်ဆောင်မှုက <span class="code">rua=</span> (aggregate reports) ကိုသာ ကိုင်တွယ်ပါတယ်။',

    'rua.contains.title': 'RUA report တွင် ပါတတ်သောအချက်များ',
    'rua.contains.li1': 'Target domain (report လုပ်သော domain)',
    'rua.contains.li2': 'Source IP များနှင့် စာရင်းအရေအတွက် (count)',
    'rua.contains.li3': 'SPF / DKIM / DMARC ရလဒ် (pass/fail စသည်)',
    'rua.contains.li4': 'From-domain alignment ရလဒ်',
    'rua.contains.li5': 'Report ကာလ(begin/end) နှင့် report တင်သောအဖွဲ့အစည်းအချက်အလက်',

    'rua.risk.title': 'အကြီးဆုံးအန္တရာယ် (အရေးကြီး)',
    'rua.risk.p1.html': 'RUA တွင် message body မပါသော်လည်း <strong>ပို့ဆောင်ရေးအင်ဖရာ (source IP၊ ပမာဏ၊ sender service)</strong> ကိုခန့်မှန်းနိုင်သော အချက်များပါရှိနိုင်သည်။ ယိုယွင်းပါက တိုက်ခိုက်သူများက ပို့လမ်းကြောင်းကို သင်ယူပြီး targeting / phishing / spoofing အတွက် အသုံးချနိုင်သည်။',
    'rua.risk.p2.html': 'အကြောင်းအရာမရှိလို့ “လုံခြုံ” မဟုတ်ပါ။ <strong>အဖွဲ့အစည်း၏ အီးမေးလ်လည်ပတ်မှုမြေပုံ</strong> ဖြစ်လာနိုင်သည်။',
    'rua.risk.mitigate.html': 'အန္တရာယ်ကို လျော့ချရန် <strong>ဒေတာအနည်းဆုံး (raw XML မသိမ်း)</strong>, <strong>least-privilege access control</strong>, <strong>အလိုအလျောက်လုပ်ဆောင်မှု</strong>, <strong>အနည်းဆုံး irreversible aggregation သာထားရှိမှု</strong> နှင့် <strong>ရပ်တန့်ချိန် ဖျက် + intake ရပ်</strong> ကို တင်းကျပ်စွာ ဆောင်ရွက်ပါမည်။',

    'rua.data.title': 'ဒေတာကိုင်တွယ်မှု (မသိမ်း / အလိုအလျောက်)',
    'rua.data.li1': 'Raw RUA XML ကို မသိမ်းပါ (persist မရှိ)။',
    'rua.data.li2': 'Report တစ်ခုချင်းကို လူကကြည့်ရန် မရည်ရွယ်ပါ (automation)။',
    'rua.data.li3': 'ပြသမှု/အကြံပြုချက်အတွက် လိုအပ်သလောက် irreversible aggregate သာ ဖန်တီးပြီး မူလဒေတာကို ဖျက်ပါသည်။',
    'rua.data.li4': 'ရပ်တန့်ပါက (သိမ်းထားသည့်ဒေတာရှိလျှင်) ဖျက်ပြီး ထပ်မံလက်ခံမှုကို ရပ်တန့်ပါသည်။',
    'rua.data.note': '“Irreversible aggregation” ဆိုသည်မှာ report တစ်ခုချင်းကို ပြန်လည်တည်ဆောက်မရသော output (ဥပမာ: နေ့စဉ်စုစုပေါင်း) ကို ဆိုလိုသည်။ မလိုအပ်လျှင် aggregate မသိမ်းသော ဒီဇိုင်းကို လုပ်နိုင်သည်။',

    'rua.gdpr.title': 'ကိုယ်ရေးကိုယ်တာ / GDPR (အကျဉ်းချုပ်)',
    'rua.gdpr.intro': 'အသုံးပြုသူက သိသင့်သည့်အချက်များနှင့် GDPR နှင့် ကိုက်ညီသော ဒေတာကိုင်တွယ်မှုကို အကျဉ်းချုပ်ဖော်ပြထားသည် (ဥပဒေရေးရာအကြံဉာဏ်မဟုတ်)။',

    'rua.gdpr.user.title': 'အသုံးပြုသူက သိထားသင့်သောအချက်များ (အရေးကြီး)',
    'rua.gdpr.user.li1': 'အာဏာနှင့် တရားဝင်မှု: သင်ထိန်းချုပ်သော domain သို့မဟုတ် ခွင့်ပြုချက်ရှင်းလင်းသော domain များအတွက်သာ အသုံးပြုပါ (RUA destination သတ်မှတ်ခြင်းသည် admin လုပ်ဆောင်ချက်)။',
    'rua.gdpr.user.li2': 'ကိုယ်ရေးကိုယ်တာဒေတာဖြစ်နိုင်မှု: source IP နှင့် (အချို့ကိစ္စ) ဆက်သွယ်ရန် email ပါနိုင်ပြီး အခြေအနေအလိုက် personal data ဖြစ်နိုင်သည်။ သင်၏အဖွဲ့အစည်း၏ policy အတိုင်း lawful basis ကို စီစဉ်ပါ။',
    'rua.gdpr.user.li3': 'လျှို့ဝှက်အဖြစ်ကိုင်တွယ်ပါ: message body မပါသော်လည်း လည်ပတ်မှုပုံစံကို ထုတ်ဖော်နိုင်သည်။ လျှို့ဝှက်အချက်အလက်အဖြစ် ကိုင်တွယ်ရန် အကြံပြုသည်။',
    'rua.gdpr.user.li4': 'ရပ်တန့်/ဖျက်: ရပ်တန့်ပြီးနောက် intake ကို ရပ်ပြီး ဆက်နွယ်ဒေတာကို ပုံမှန်အားဖြင့် ဖျက်ပါမည်။ DNS ထဲ에서도 မဖြစ်မနေ ရပ်တန့်ပါ (အောက်တွင်)။',

    'rua.gdpr.us.title': 'ကျွန်ုပ်တို့လုပ်ဆောင်သည့်အချက်များ (အချက်အလက်)',
    'rua.gdpr.us.li1': 'ဒေတာအနည်းဆုံး: raw XML မသိမ်း၊ အနည်းဆုံး irreversible aggregate သာ။',
    'rua.gdpr.us.li2': 'ရည်ရွယ်ချက်မဟုတ်သောအသုံးပြုမှုမရှိ: ကြော်ငြာ/မားကက်တင်းအတွက် မအသုံးပြုပါ (RUA မတော်တဆမဟုတ်သလို report-level data မသိမ်းပါ)။',
    'rua.gdpr.us.li3': 'လုံခြုံရေး: access control, least privilege, encryption စသည်ဖြင့် လျှို့ဝှက်မှုနှင့် တိကျမှန်ကန်မှုကို ကာကွယ်ပါသည်။',
    'rua.gdpr.us.li4': 'Sub-processor စီမံခန့်ခွဲမှု: vendor အသုံးပြုပါက GDPR နှင့်ကိုက်ညီသော သတ်မှတ်ချက်(DPA စသည်) ဖြင့် စီမံပါသည်။',
    'rua.gdpr.us.li5': 'ဖျက်ခြင်း/ပူးပေါင်း: controller(ဖောက်သည်) မှတဆင့် ဖျက်ခြင်းနှင့် အခွင့်အရေးတောင်းဆိုမှုများကို ပူးပေါင်းကူညီပါသည်။',

    'rua.roles.title': 'အခန်းကဏ္ဍ (Controller / Processor)',
    'rua.roles.li1.html': '<strong>ဖောက်သည် (သင်/သင့်အဖွဲ့အစည်း):</strong> ပုံမှန်အားဖြင့် <strong>Controller</strong> ဖြစ်ပြီး RUA ကိုလက်ခံ/ခွဲခြမ်းရန် ရည်ရွယ်ချက်နှင့် နည်းလမ်းကို ဆုံးဖြတ်သည်။',
    'rua.roles.li2.html': '<strong>ဝန်ဆောင်မှုပေးသူ:</strong> ပုံမှန်အားဖြင့် <strong>Processor</strong> ဖြစ်ပြီး စာချုပ်/DPA နှင့် မှတ်တမ်းတင်ညွှန်ကြားချက်အတိုင်း လုပ်ဆောင်သည်။',

    'rua.dataTypes.title': 'ကိုင်တွယ်နိုင်သောဒေတာ (ပုံမှန်)',
    'rua.dataTypes.li1': 'Domain, report ကာလ, authentication outcome (SPF/DKIM/DMARC pass/fail စသည်)',
    'rua.dataTypes.li2': 'Source IP နှင့် count (aggregate)',
    'rua.dataTypes.li3': 'Reporting organization info (နှင့် အချို့ကိစ္စ contact email)',
    'rua.dataTypes.note': 'မှတ်ချက်: IP address နှင့် contact email များသည် အခြေအနေအလိုက် personal data ဖြစ်နိုင်သည်။',

    'rua.purpose.title': 'လုပ်ဆောင်ရသည့်ရည်ရွယ်ချက်',
    'rua.purpose.li1': 'Spoofing/မမှန်ကန်သော authentication လက္ခဏာများကို ဖော်ထုတ်ပြီး ပို့လမ်းကြောင်းကို စစ်ဆေးခြင်း (security operations)',
    'rua.purpose.li2': 'SPF/DKIM/DMARC တိုးတက်ရေး အကြံပြုချက်နှင့် အဆင့်လိုက် rollout စစ်ဆေးခြင်း',
    'rua.purpose.li3': 'ဝန်ဆောင်မှုထိန်းသိမ်းခြင်းနှင့် misuse ကာကွယ်ခြင်း (rate limit, incident response) ကို ဒေတာအနည်းဆုံးဖြင့်',

    'rua.legal.title': 'တရားဝင်အခြေခံ (အထွေထွေဥပမာ)',
    'rua.legal.li1.html': '<strong>Controller (ဖောက်သည်):</strong> အသုံးပြုမှုအလိုက် legitimate interests (GDPR 6(1)(f): security) သို့မဟုတ် contract (6(1)(b)) ဖြစ်နိုင်သည်။',
    'rua.legal.li2.html': '<strong>Processor (ဝန်ဆောင်မှု):</strong> စာချုပ်/DPA နှင့် မှတ်တမ်းတင်ညွှန်ကြားချက်အတိုင်း လုပ်ဆောင်သည် (GDPR 28)။',
    'rua.legal.note': 'အသုံးပြုမှုနှင့် အဖွဲ့အစည်း policy အပေါ်မူတည်သည်။ တရားဝင် notice များတွင် သင့် lawful basis ကို သတ်မှတ်ပါ။',

    'rua.retention.title': 'ထိန်းသိမ်းကာလနှင့် ဖျက်ခြင်း',
    'rua.retention.li1.html': '<strong>Raw RUA XML:</strong> မသိမ်း; လုပ်ဆောင်ပြီးနောက် ဖျက်သည်။',
    'rua.retention.li2.html': '<strong>Irreversible aggregates:</strong> လိုအပ်သလောက်သာ; ဆက်မလုပ်ပါက <strong>30 ရက် (trial အဆုံး)</strong> အတွင်း ဖျက် (ဒီဇိုင်းရည်မှန်းချက်)။',
    'rua.retention.li3.html': '<strong>ရပ်တန့်ပြီးနောက်:</strong> ဆက်နွယ်ဒေတာကို ပုံမှန်အားဖြင့် ဖျက်ပြီး intake ကို ရပ်သည်။',

    'rua.subprocessors.title': 'တတိယပုဂ္ဂိုလ် / Sub-processors',
    'rua.subprocessors.body.html': 'Hosting/storage/monitoring အတွက် vendor အသုံးပြုပါက GDPR sub-processor ဖြစ်နိုင်သည်။ ထုတ်လုပ်မှုတွင် <strong>vendor စာရင်း (အမည်/နိုင်ငံ/ရည်ရွယ်ချက်)</strong> ကိုပေးပြီး လိုအပ်သလို DPA, SCC စသည်ကို ပြုလုပ်ပါမည်။',

    'rua.transfer.title': 'နိုင်ငံအပြင်သို့ လွှဲပြောင်းခြင်း (EEA အပြင်)',
    'rua.transfer.body': 'EEA အပြင်သို့ လွှဲပြောင်းနိုင်ပါက လိုအပ်သလို SCC စသည့် ကာကွယ်မှုများကို အသုံးပြုပါမည်။',

    'rua.rights.title': 'ဒေတာပိုင်ရှင်အခွင့်အရေး (တောင်းဆိုရန်)',
    'rua.rights.li1': 'Access, ပြင်ဆင်, ဖျက်, ကန့်သတ်, ကန့်ကွက်, portability စသည် (အသုံးချနိုင်သလို)',
    'rua.rights.li2.html': 'တောင်းဆိုမှုများကို ပုံမှန်အားဖြင့် <strong>Controller (ဖောက်သည်)</strong> က လက်ခံသည်။ Processor အဖြစ် controller ၏တောင်းဆိုမှုအတိုင်း ပူးပေါင်းကူညီပါသည်။',

    'rua.contact.title': 'ဆက်သွယ်ရန်',
    'rua.contact.body.html': 'ကိုယ်ရေးကိုယ်တာ/ဒေတာကိုင်တွယ်မှု မေးခွန်းများ: <strong>privacy@toppymicros.com</strong><br>အုပ်ချုပ်သူ: <strong>ToppyMicroServices OÜ</strong> (domain: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'တိုင်ကြားချက်',
    'rua.complaints.body': 'EU/EEA နေထိုင်သူများသည် မိမိဒေသ ဆိုင်ရာ စောင့်ကြည့်ရေးအာဏာပိုင်(SA) ထံ တိုင်ကြားခွင့်ရှိသည်။',

    'rua.trial.title': 'Trial နှင့် ရပ်တန့်ခြင်း (အချက်အလက်)',
    'rua.trial.li1.html': '<strong>Trial စတင်:</strong> RUA intake (activation) ပထမဆုံးအောင်မြင်သည့်နေ့',
    'rua.trial.li2.html': '<strong>Trial ပြီးဆုံး:</strong> စတင်ပြီး 30 ရက် (UI တွင် ကျန်ရက်ပြသ)',
    'rua.trial.li3.html': '<strong>ဆက်လက်အသုံးပြု:</strong> တစ်ချက်နှိပ် opt-in (ဥပမာ “Keep enabled”)',
    'rua.trial.li4.html': '<strong>မူလတန်ဖိုး:</strong> 30 ရက်မှာ အလိုအလျောက်ရပ် (opt-in မရှိလျှင် မဆက်)',
    'rua.trial.li5.html': '<strong>ရပ်တန့်ချိန် ဒေတာ:</strong> ပုံမှန်အားဖြင့် ဖျက် (ရွေးချယ်မှု: အမည်မဖော် metrics)',

    'rua.stop.title': 'ရပ်တန့်ပြီးနောက် RUA ကို ဘယ်လိုရပ်မလဲ',
    'rua.stop.intro': 'အကြံပြုအဆင့်အစဉ်:',
    'rua.stop.a.title.html': '<strong>A (အကြံပြု):</strong> ပြင်ပ RUA authorization DNS ကို ပိတ်ပြီး sender မပို့နိုင်အောင် လုပ်ခြင်း',
    'rua.stop.a.detail': 'ဥပမာ: RUA destination ကို authorization လုပ်သော TXT/CNAME ကို ပိတ်၍ delivery မအောင်မြင်အောင်လုပ်ခြင်း။',
    'rua.stop.b.title.html': '<strong>B:</strong> လက်ခံပြီးဖျက် (ကုန်ကျစရိတ်ပို; နောက်ဆုံးရွေးချယ်မှု)',
    'rua.stop.b.detail': 'ရောက်လာချိန်တင် ဖျက်ပစ်ပါ။ ရပ်တန့်အာမခံကောင်းသော်လည်း network/processing ကုန်ကျစရိတ်တက်သည်။',

    'rua.ui.title': 'UI (dashboard အပေါ်တွင် တည်တံ့)',
    'rua.ui.li1': 'ကျန်ရက်: “◯ days left”',
    'rua.ui.li2': 'ဆက်လက်ခလုတ်: “Keep enabled”',
    'rua.ui.li3': 'ချက်ချင်းရပ်: “Stop now”',
    'rua.ui.li4': 'အခြေအနေကို အမြဲပထမမြင်ကွင်းတွင် တွေ့နိုင်ပြီး scroll လုပ်လည်း ထိပ်တွင်မြင်ရသည်။',

    'rua.links.back': '← Quick Check သို့ ပြန်သွားရန်',
    'rua.links.spec': 'Service spec (docs)'
  });
})();

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
    'rua.h1': 'RUA の受信、停止設計、データの取り扱い',
    'rua.tagline': '無料トライアルは 30 日で自動停止します。継続には明示的な同意が必要です。停止後は、外部送信先を承認する DNS レコードを無効にし、新たな RUA レポートを受け取らない設計です。',

    'rua.strategy.title': '基本方針',
    'rua.strategy.body': 'RUA サービスの役割を明確にし、「受信 → 解析 → 集計・可視化」の処理全体を安全に設計します。特に、プライバシー保護と悪用への耐性を優先します。',
    'rua.keypoints.title': '要点',
    'rua.keypoints.li1': 'RUA は、DMARC の集約レポート送信先を mailto URI などで指定するタグです。',
    'rua.keypoints.li2': 'RUA サービスは、レポートメールの受信、XML 解析、集計、可視化を担います。自社で運用する方法と外部サービスを利用する方法があります。',
    'rua.keypoints.li3': '主なリスクは DNS ではなく、データの取り扱い、テナント間の分離、巨大ファイルや圧縮爆弾、レポート洪水などの悪用です。',

    'rua.definition.title': '用語の整理',
    'rua.definition.li1.html': 'DMARC の <span class="code">rua=</span> は、集約レポートの送信先となる URI の一覧です。未指定の場合、集約レポートは送信されません。',
    'rua.definition.li2': '集約レポートは XML 形式で、送信元 IP、認証結果、ドメインの整合状況などを要約します。',
    'rua.definition.li3.html': '<span class="code">ruf=</span> は失敗レポートの送信先です。個別メッセージに関する情報を含む可能性があるため、プライバシー面で慎重な取り扱いが必要です。',

    'rua.priorities.title': '優先度別チェックリスト',
    'rua.priorities.note': 'P0 は信頼性を確保する最低条件、P1 は実運用上の防御、P2 は使いやすさと差別化のための項目です。',
    'rua.p0.title.html': '<strong>P0 - まずトラブルを起こさない</strong>',
    'rua.p0.li1.html': 'ドメイン所有の検証（例：<span class="code">_dmarc4all-verify.&lt;domain&gt;</span> の TXT）を完了するまでレポートを表示しない。',
    'rua.p0.li2': '受信処理を堅牢にする。メールと添付ファイルのサイズ、解凍後のサイズ、入れ子の深さ、処理時間に上限を設け、圧縮爆弾を遮断する。',
    'rua.p0.li3': 'XML 解析では XXE を無効にして DTD を拒否し、スキーマと整合性を検証して異常なデータを早期に破棄する。',
    'rua.p0.li4': '保管方針と保持期間を明文化する。元の XML は保存しないか短期間に限定し、IP アドレスは慎重に扱う。',
    'rua.p1.title.html': '<strong>P1 - 実運用で耐える</strong>',
    'rua.p1.li1': 'データ最小化モードとして、標準、匿名化（IPv4 /24、IPv6 /48）、集計のみを選べるようにする。',
    'rua.p1.li2': 'テナント間の分離とアクセス制御を徹底し、行単位の分離、暗号化、監査ログを導入する。',
    'rua.p1.li3': 'レート制限、洪水検知、自動抑制を実装し、RFC 9990 第 8 節のセキュリティ上の注意に沿って DMARC レポートの悪用を防ぐ。',
    'rua.p1.li4': '受信側が報告した観測値であることを画面に明示し、SPF、DKIM、アライメントを分けて表示する。',
    'rua.p2.title.html': '<strong>P2 - 体験と差別化</strong>',
    'rua.p2.li1': 'コピーして使える DMARC の設定例（例：p=none; rua=mailto:...）と段階移行ガイドを用意する。',
    'rua.p2.li2': 'JSON / CSV の出力に、報告組織、対象期間、解析時刻、バージョンなどのメタ情報を含める。',
    'rua.p2.li3': '必要に応じて、受信レポートの DKIM / SPF 結果や既知の報告組織であることを補助情報として示す。',

    'rua.setup.title': 'RUA の設定（顧客側）',
    'rua.setup.intro.html': 'DMARC レコードの <span class="code">rua=</span> に、当サービスが発行する RUA 受信先（<span class="code">mailto:</span>）を設定します。<strong>既存の DMARC 設定（p= / sp= / adkim= / aspf= など）は変更せず</strong>、<span class="code">rua=</span> だけを追加または更新してください。',
    'rua.setup.step1.html': '<strong>1.</strong> 対象ドメインの DMARC レコード（通常は <span class="code">_dmarc</span>）を編集します。',
    'rua.setup.step2.html': '<strong>2.</strong> <span class="code">rua=mailto:{RUA_EMAIL}</span> を追加または更新します。すでに <span class="code">rua=</span> がある場合は、送信先を追加できます。',
    'rua.setup.step3.html': '<strong>3.</strong> 一部の受信側は、外部宛て RUA を許可する承認 DNS を要求します（RFC 9990 第 4 節「外部送信先の検証」）。その場合も、<strong>当サービスが当社ドメイン側に必要な TXT レコードを自動で公開</strong>するため、利用者側の DNS へ追加する作業はありません。',
    'rua.setup.step4.html': '<strong>4.</strong> DNS の反映後、通常は 24〜48 時間以内にレポートが届き始めます。受信側のスケジュールによって前後します。',
    'rua.setup.note': '注意：すでに DMARC レコードがある場合は、ほかの設定を維持したまま rua= だけを追加してください。複数の mailto 送信先を指定することもできます。',


    'rua.disclaimer.title': '免責事項',
    'rua.disclaimer.body': '無料トライアルは 30 日間です。継続には明示的な操作が必要です。サービスはフェアユース制限のあるベストエフォート提供で、SLA はありません。',

    'rua.what.title': 'RUA とは',
    'rua.what.body': 'RUA は DMARC 集約レポートの送信先です。Gmail、Microsoft、各社 ISP などの受信側から、通常は 1 日 1 回程度、認証結果をまとめた XML が届きます。',
    'rua.what.note': '重要：レポートにメール本文は含まれませんが、送信経路や通信量を推測できるため、機密性のある運用データとして扱う必要があります。',
    'rua.what.ruf.html': '参考：DMARC には <span class="code">ruf=</span>（フォレンジックレポートまたは失敗レポート）もありますが、個別メッセージに関する情報を含み得るため、プライバシーとコンプライアンスの面で慎重な取り扱いが必要です。当サービスは <span class="code">rua=</span>（集計）だけを扱います。',

    'rua.contains.title': 'RUA に含まれる情報（代表例）',
    'rua.contains.li1': '対象ドメイン（レポート対象）',
    'rua.contains.li2': '送信元 IP と、その IP から配信されたメールの通数',
    'rua.contains.li3': 'SPF / DKIM / DMARC の評価結果（成功・失敗など）',
    'rua.contains.li4': 'From ドメインのアライメント結果',
    'rua.contains.li5': 'レポートの対象期間と、報告組織の名称など',

    'rua.risk.title': '最大のリスク（重要）',
    'rua.risk.p1.html': 'RUA に本文は含まれませんが、<strong>送信インフラ（送信元 IP、通数、送信サービスの利用状況）</strong>を推測できる情報が含まれます。漏えいすると、攻撃者が送信経路を把握し、標的の選定やフィッシング、なりすましに悪用する可能性があります。',
    'rua.risk.p2.html': '本文がないから安全とは限りません。RUA は<strong>組織のメール運用を示す地図</strong>になり得ます。',
    'rua.risk.mitigate.html': 'このリスクを抑えるため、当社は<strong>元の XML を保存しないデータ最小化</strong>、<strong>最小権限のアクセス制御</strong>、<strong>自動処理</strong>、<strong>必要最小限の非可逆な集計</strong>、<strong>停止時の削除と受信停止</strong>を徹底します。',

    'rua.data.title': 'データの扱い（非保存・自動処理）',
    'rua.data.li1': 'RUA レポートの元の XML は保存しません。',
    'rua.data.li2': '個別のレポートを人が閲覧する運用は行わず、自動で処理します。',
    'rua.data.li3': '表示と改善提案に必要な最小限の非可逆な集計だけを生成し、元データは破棄します。',
    'rua.data.li4': 'サービスを停止した時点で、保存データがあれば削除し、それ以降の受信も止めます。',
    'rua.data.note': '「非可逆な集計」とは、個別レポートの内容を復元できない形にまとめたデータです。日ごとの合計通数などが該当します。運用上不要であれば、集計データも保持しない設計にします。',

    'rua.gdpr.title': 'プライバシーと GDPR（要約）',
    'rua.gdpr.intro': '利用者が把握すべき点と、EU 一般データ保護規則（GDPR）に沿った当社の方針をまとめています。法的助言ではありません。',

    'rua.gdpr.user.title': '利用者が把握すべきこと（重要）',
    'rua.gdpr.user.li1': '権限と適法性：自身が管理するドメイン、または明示的な許可を得た範囲でのみ利用してください。RUA 受信先の設定はドメイン管理上の操作です。',
    'rua.gdpr.user.li2': '個人データに該当する可能性：送信元 IP や連絡先メールアドレスなどが含まれ、状況によっては個人データに該当します。社内方針に従い、必要に応じて正当な利益などの法的根拠を整理してください。',
    'rua.gdpr.user.li3': '機密情報としての取り扱い：本文は含まれませんが、メール運用を推測できる情報です。社内の機密情報として扱うことを推奨します。',
    'rua.gdpr.user.li4': '停止と削除：停止後は新たな受信を止め、当社側の関連データは原則として削除します。後述の手順に従い、DNS 側でも必ず停止してください。',

    'rua.gdpr.us.title': '当社が適切に対応する点（要点）',
    'rua.gdpr.us.li1': 'データ最小化：RUA の元の XML は保存せず、必要最小限の非可逆な集計だけを扱います。',
    'rua.gdpr.us.li2': '目的外利用の禁止：広告やマーケティングには利用しません。また、個別レポートを保存しないため、そのような用途に使えるデータを保持しません。',
    'rua.gdpr.us.li3': '安全管理措置：アクセス制御、最小権限、暗号化などにより、機密性と完全性の確保に努めます。',
    'rua.gdpr.us.li4': '委託先の管理：外部委託を行う場合は、GDPR に沿った契約（DPA など）と管理を行います。',
    'rua.gdpr.us.li5': '削除と協力：サービスの停止、削除、データ主体による権利行使について、管理者である顧客からの要請に協力します。',

    'rua.roles.title': '役割（管理者と処理者）',
    'rua.roles.li1.html': '<strong>顧客（利用者または利用組織）：</strong> RUA の受領と分析の目的・手段を決めるため、通常は GDPR 上の<strong>管理者（Controller）</strong>になります。',
    'rua.roles.li2.html': '<strong>当サービス提供者：</strong> 顧客の文書化された指示に従って受領・解析するため、通常は<strong>処理者（Processor）</strong>として行動します。DPA や契約で役割を明確にします。',

    'rua.dataTypes.title': '取り扱う可能性があるデータ（代表例）',
    'rua.dataTypes.li1': '対象ドメイン、レポート期間、SPF / DKIM / DMARC の成功・失敗などの認証結果',
    'rua.dataTypes.li2': '送信元 IP アドレスと通数（集計）',
    'rua.dataTypes.li3': 'レポーティング組織情報（組織名、場合により連絡用メールアドレス等）',
    'rua.dataTypes.note': '注意：IP アドレスや連絡先メールアドレスなどは、状況によって個人データに該当する可能性があります。',

    'rua.purpose.title': '処理目的',
    'rua.purpose.li1': 'なりすましや認証不備の兆候を把握し、送信経路の健全性を確認する',
    'rua.purpose.li2': 'SPF / DKIM / DMARC の設定改善を提案し、段階的な適用を検証する',
    'rua.purpose.li3': '（必要最小限）サービス提供の維持・不正利用防止（レート制御、障害対応）',

    'rua.legal.title': '法的根拠（一般的な例）',
    'rua.legal.li1.html': '<strong>管理者（顧客）側：</strong> 通常は、セキュリティ確保のための正当な利益（GDPR 6(1)(f)）や契約の履行（6(1)(b)）などが想定されます。',
    'rua.legal.li2.html': '<strong>処理者（当サービス）側：</strong> 顧客との契約（DPA）に基づき、顧客から文書で示された指示に従って処理します（GDPR 28）。',
    'rua.legal.note': '適切な法的根拠は用途や社内方針によって異なります。正式なプライバシー通知では、顧客側でも根拠を整理してください。',

    'rua.retention.title': '保持期間と削除',
    'rua.retention.li1.html': '<strong>RUA の元の XML：</strong>保存せず、受領後の処理が終わり次第破棄します。',
    'rua.retention.li2.html': '<strong>非可逆な集計：</strong>表示と改善提案に必要な範囲に限り、継続しない場合は<strong>トライアル終了から 30 日以内</strong>に削除することを設計目標とします。',
    'rua.retention.li3.html': '<strong>停止後：</strong>原則として関連データを削除し、前述の停止設計に従って新たな受信も止めます。',

    'rua.subprocessors.title': '第三者提供と再委託先',
    'rua.subprocessors.body.html': 'ホスティング、ストレージ、監視などを外部事業者へ委託する場合、その事業者は GDPR 上の再委託先（Sub-processor）になり得ます。正式運用では、<strong>事業者名、所在国、利用目的を含む委託先一覧</strong>を提示し、必要に応じて DPA や SCC などの契約条項を整備します。',

    'rua.transfer.title': '第三国移転（EEA 外への移転）',
    'rua.transfer.body': 'EEA 外へデータを移転する可能性がある場合は、適用法に従い、標準契約条項（SCC）などの適切な保護措置を講じます。',

    'rua.rights.title': 'データ主体の権利（請求窓口）',
    'rua.rights.li1': 'アクセス、訂正、消去、処理制限、異議申立て、データポータビリティ等（該当する範囲で）',
    'rua.rights.li2.html': '通常、請求の窓口はまず<strong>管理者である顧客</strong>です。当サービスは処理者として、管理者からの要請に協力します。',

    'rua.contact.title': '連絡先',
    'rua.contact.body.html': 'プライバシーとデータ処理に関する問い合わせ：<strong>privacy@toppymicros.com</strong><br>事業者名：<strong>ToppyMicroServices OÜ</strong>（ドメイン：<strong>toppymicros.com</strong>）',

    'rua.complaints.title': '苦情申立て',
    'rua.complaints.body': 'EU / EEA の居住者は、居住地を管轄する監督機関などへ苦情を申し立てる権利があります。',

    'rua.trial.title': 'トライアルと停止（要点）',
    'rua.trial.li1.html': '<strong>トライアル開始日：</strong>RUA レポートの受信に初めて成功した日',
    'rua.trial.li2.html': '<strong>トライアル終了日：</strong>開始日から 30 日後。画面には残り日数を表示します。',
    'rua.trial.li3.html': '<strong>継続操作：</strong>「継続する」ボタンによる明示的な同意',
    'rua.trial.li4.html': '<strong>既定の動作：</strong>継続への同意がなければ、30 日後に自動停止',
    'rua.trial.li5.html': '<strong>停止時のデータ：</strong>原則として削除し、必要な場合のみ匿名の稼働指標を保持',

    'rua.stop.title': '停止後の RUA 受信を止める方法',
    'rua.stop.intro': '推奨する順序は次のとおりです。',
    'rua.stop.a.title.html': '<strong>A（推奨）：</strong>外部 RUA を許可する DNS レコードを無効にし、送信側から新たなレポートが届かない状態にする。',
    'rua.stop.a.detail': 'RUA 送信先の承認に使う TXT または CNAME レコードを無効にし、外部宛ての送信が成立しない状態にします。',
    'rua.stop.b.title.html': '<strong>B：</strong>受信したレポートを即時に破棄する。受信自体は続くため、最終手段とします。',
    'rua.stop.b.detail': '停止後に届いたレポートを即時に破棄します。確実に処理を止められますが、ネットワークと受信処理のコストは残ります。',

    'rua.ui.title': 'UI（ダッシュボード上部に固定表示）',
    'rua.ui.li1': '残り日数：「あと◯日」',
    'rua.ui.li2': '継続ボタン：「継続する」',
    'rua.ui.li3': '即時停止ボタン：「今すぐ停止」',
    'rua.ui.li4': '状態は画面を開いた時点で確認でき、スクロール後も見える位置に固定して表示します。',

    'rua.links.back': '← クイック診断に戻る',
    'rua.links.spec': 'サービス仕様書'
  });

  // English
  const ruaEn = {
    'rua.pageTitle': 'Toppy DNS / RUA Service Specification',
    'rua.pill': 'RUA Service (DMARC Aggregate Reports) — Key Details',
    'rua.h1': 'RUA endpoint, termination, and data handling',
    'rua.tagline': 'The free trial stops automatically after 30 days unless you explicitly choose to continue. On termination, the authorization DNS record for the external destination is disabled so that new RUA reports are no longer received.',

    'rua.strategy.title': 'Strategy',
    'rua.strategy.body': 'Define the role of an RUA service in DMARC, then secure the entire receive, parse, and analyze pipeline. Privacy and resistance to abuse take priority.',
    'rua.keypoints.title': 'Key points',
    'rua.keypoints.li1': 'RUA is the DMARC tag that specifies aggregate report destinations (mailto URIs).',
    'rua.keypoints.li2': 'An RUA service receives report emails, parses XML, aggregates metrics, and presents the results in a self-hosted or third-party dashboard.',
    'rua.keypoints.li3': 'The main risk is not DNS; it is data handling, tenant isolation, and abuse (oversized payloads, zip bombs, report floods).',

    'rua.definition.title': 'Definitions',
    'rua.definition.li1.html': 'In DMARC, <span class="code">rua=</span> is "Reporting URI(s) for aggregate data" (a list of URIs). If absent, aggregate reports are not generated.',
    'rua.definition.li2': 'RFC 9990 defines aggregate reports as XML documents that summarize authentication and alignment results by source IP and message count.',
    'rua.definition.li3.html': '<span class="code">ruf=</span> is different: forensic/failure reports that may include message-specific data and are more privacy sensitive.',

    'rua.priorities.title': 'Prioritized checklist',
    'rua.priorities.note': 'P0 covers essential safeguards, P1 covers operational resilience, and P2 covers usability and product quality.',
    'rua.p0.title.html': '<strong>P0 - Essential safeguards</strong>',
    'rua.p0.li1.html': 'Verify domain ownership (e.g., DNS TXT at <span class="code">_dmarc4all-verify.&lt;domain&gt;</span>) before showing any report data.',
    'rua.p0.li2': 'Protect report intake with limits on message size, decompressed size, nested archive depth, and processing time to block zip bombs.',
    'rua.p0.li3': 'Parse XML safely by disabling XXE, rejecting DTDs, validating structure and semantics, and discarding malformed reports.',
    'rua.p0.li4': 'Publish clear privacy and retention rules. Store raw XML only briefly or not at all, and treat IP addresses as sensitive operational data.',
    'rua.p1.title.html': '<strong>P1 - Operational resilience</strong>',
    'rua.p1.li1': 'Offer data-minimization modes: standard, anonymized (IPv4 /24 and IPv6 /48), or aggregates only.',
    'rua.p1.li2': 'Enforce tenant isolation and access controls through row-level separation, encryption, and audit logs.',
    'rua.p1.li3': 'Apply rate limits and flood detection, following the security considerations in Section 8 of RFC 9990.',
    'rua.p1.li4': 'Clearly label the data as receiver-reported observations, and show SPF, DKIM, and alignment outcomes separately.',
    'rua.p2.title.html': '<strong>P2 - Usability and product quality</strong>',
    'rua.p2.li1': 'Copy-ready DMARC snippets (for example, p=none; rua=mailto:...) with staged rollout guidance.',
    'rua.p2.li2': 'Include the reporting organization, reporting period, parse time, and tool version in JSON and CSV exports.',
    'rua.p2.li3': 'Optionally show authenticity signals, such as DKIM or SPF results for report emails, and distinguish known from unknown reporting organizations.',

    'rua.setup.title': 'Configure RUA for your domain',
    'rua.setup.intro.html': 'Set the RUA destination issued by this service (<span class="code">mailto:</span>) in your DMARC record’s <span class="code">rua=</span>. <strong>Keep your existing DMARC settings (p= / sp= / adkim= / aspf=, etc.)</strong> and only add (or update) <span class="code">rua=</span>.',
    'rua.setup.step1.html': '<strong>1.</strong> Edit your domain’s DMARC record, normally published at <span class="code">_dmarc</span>.',
    'rua.setup.step2.html': '<strong>2.</strong> Add or update <span class="code">rua=mailto:{RUA_EMAIL}</span>. If the record already has <span class="code">rua=</span>, you can add another mailto destination.',
    'rua.setup.step3.html': '<strong>3.</strong> Some receivers require an authorization DNS record for external RUA destinations, as described in Section 4 of RFC 9990. In that case, <strong>this service automatically publishes the required TXT record under our domain</strong>. No DNS changes are needed on your side.',
    'rua.setup.step4.html': '<strong>4.</strong> After DNS propagation, reports usually begin arriving within 24 to 48 hours, although timing varies by receiver.',
    'rua.setup.note': 'Note: if you already have a DMARC record, keep your existing policy/tags and only add the rua= destination (multiple mailto destinations are possible).',


    'rua.disclaimer.title': 'Disclaimer',
    'rua.disclaimer.body': 'The free trial lasts 30 days and continues only with your explicit confirmation. The service is provided on a best-effort basis, subject to fair-use limits, and without an SLA.',

    'rua.what.title': 'What is RUA?',
    'rua.what.body': 'RUA specifies the destination for DMARC aggregate reports. Receivers such as Gmail, Microsoft, and other providers typically send an XML summary of authentication results about once a day.',
    'rua.what.note': 'Important: aggregate reports do not contain message bodies, but the operational metadata can still be sensitive.',
    'rua.what.ruf.html': 'Note: DMARC also has <span class="code">ruf=</span> (forensic/failure reports), which may include per-message details and therefore require careful privacy/compliance handling. This service is limited to <span class="code">rua=</span> (aggregate reports).',

    'rua.contains.title': 'What a RUA report typically contains',
    'rua.contains.li1': 'Target domain (the domain being reported)',
    'rua.contains.li2': 'Source IP addresses and message counts',
    'rua.contains.li3': 'SPF, DKIM, and DMARC evaluation results',
    'rua.contains.li4': 'From-domain alignment results',
    'rua.contains.li5': 'The reporting period and information about the reporting organization',

    'rua.risk.title': 'Primary risk',
    'rua.risk.p1.html': 'RUA does not include mail bodies, but it can reveal clues about your <strong>sending infrastructure (source IPs, volumes, and sender services)</strong>. If leaked, attackers may learn your sending paths and use that to improve targeting, phishing, or spoofing.',
    'rua.risk.p2.html': 'The absence of message bodies does not make the data harmless. It can become a <strong>map of your organization\'s email operations</strong>.',
    'rua.risk.mitigate.html': 'To reduce this risk, we apply <strong>data minimization with no raw XML storage</strong>, <strong>least-privilege access controls</strong>, <strong>automated processing</strong>, <strong>minimal irreversible aggregation</strong>, and <strong>deletion and termination of report intake when the service stops</strong>.',

    'rua.data.title': 'Automated, storage-minimizing data handling',
    'rua.data.li1': 'We do not store the raw RUA XML (no persistence).',
    'rua.data.li2': 'Individual reports are processed automatically rather than reviewed by people.',
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
    'rua.retention.li2.html': '<strong>Irreversible aggregates:</strong> limited to what is needed and, if the service is not continued, deleted within <strong>30 days after the trial ends</strong> as a design target.',
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

    'rua.stop.title': 'How RUA delivery stops after termination',
    'rua.stop.intro': 'Recommended order:',
    'rua.stop.a.title.html': '<strong>A (recommended):</strong> disable the external RUA authorization DNS so senders cannot deliver',
    'rua.stop.a.detail': 'Example: disable the TXT/CNAME used to authorize the RUA destination so delivery cannot succeed.',
    'rua.stop.b.title.html': '<strong>B:</strong> accept but discard (higher cost; last resort)',
    'rua.stop.b.detail': 'Discard on arrival. Strong stop guarantee but increases network/processing costs.',

    'rua.ui.title': 'UI status panel',
    'rua.ui.li1': 'Remaining days: “◯ days left”',
    'rua.ui.li2': 'Continue button: “Keep enabled”',
    'rua.ui.li3': 'Stop now button: “Stop now”',
    'rua.ui.li4': 'Status stays visible above the fold and remains fixed while scrolling.',

    'rua.links.back': '← Back to Quick Check',
    'rua.links.spec': 'Service specification'
  };
  add('en', ruaEn);

  // Vietnamese
  add('vi', {
    'rua.pageTitle': 'Toppy DNS / Đặc tả dịch vụ RUA',
    'rua.pill': 'Dịch vụ RUA (báo cáo tổng hợp DMARC) — Tóm tắt đặc tả',
    'rua.h1': 'Điểm nhận RUA / thiết kế dừng / xử lý dữ liệu',
    'rua.tagline': 'Bản dùng thử miễn phí sẽ tự động dừng sau 30 ngày. Việc tiếp tục sử dụng cần được xác nhận rõ ràng. Sau khi dừng, dịch vụ sẽ không nhận thêm báo cáo RUA mới.',

    'rua.setup.title': 'Cách cấu hình RUA (phía khách hàng)',
    'rua.setup.intro.html': 'Đặt địa chỉ RUA do dịch vụ này cấp (<span class="code">mailto:</span>) vào tham số <span class="code">rua=</span> trong bản ghi DMARC. <strong>Giữ nguyên các thiết lập DMARC hiện có (p= / sp= / adkim= / aspf=, v.v.)</strong> và chỉ thêm (hoặc cập nhật) <span class="code">rua=</span>.',
    'rua.setup.step1.html': '<strong>1)</strong> Chỉnh sửa bản ghi DMARC của tên miền (thường là <span class="code">_dmarc</span>).',
    'rua.setup.step2.html': '<strong>2)</strong> Thêm (hoặc cập nhật) <span class="code">rua=mailto:{RUA_EMAIL}</span>.',
    'rua.setup.step3.html': '<strong>3)</strong> Một số bên nhận yêu cầu bản ghi DNS để cho phép gửi báo cáo tới địa chỉ bên ngoài, theo Mục 4 của RFC 9990. Trong trường hợp đó, <strong>dịch vụ sẽ tự động công bố bản ghi TXT cần thiết dưới miền của chúng tôi</strong>; bạn không cần thay đổi DNS.',
    'rua.setup.step4.html': '<strong>4)</strong> Sau khi DNS cập nhật, báo cáo thường bắt đầu đến trong 24–48 giờ.',
    'rua.setup.note': 'Lưu ý: nếu bạn đã có bản ghi DMARC, hãy giữ nguyên các tag/policy hiện có và chỉ thêm rua= (có thể dùng nhiều địa chỉ mailto).',

    'rua.disclaimer.title': 'Tuyên bố miễn trừ',
    'rua.disclaimer.body': 'Thời gian dùng thử miễn phí là 30 ngày và chỉ tiếp tục khi có xác nhận rõ ràng. Dịch vụ được cung cấp trên cơ sở nỗ lực hợp lý, có giới hạn sử dụng công bằng và không kèm SLA.',

    'rua.what.title': 'RUA là gì?',
    'rua.what.body': 'RUA là điểm đến cho báo cáo tổng hợp DMARC. Bên nhận (Gmail / Microsoft / các ISP) thường gửi một bản tóm tắt XML hằng ngày về kết quả xác thực cho email “nhận dạng là” tên miền của bạn.',
    'rua.what.note': 'Quan trọng: đây không phải là nội dung thư. Tuy nhiên, dữ liệu tổng hợp này vẫn có thể tiết lộ thông tin nhạy cảm về hoạt động gửi thư.',
    'rua.what.ruf.html': 'Lưu ý: DMARC còn có <span class="code">ruf=</span> (báo cáo điều tra hoặc báo cáo lỗi), có thể chứa thông tin về từng thư. Vì vậy, loại báo cáo này đòi hỏi sự thận trọng cao hơn về quyền riêng tư và tuân thủ. Dịch vụ này chỉ xử lý <span class="code">rua=</span> (báo cáo tổng hợp).',

    'rua.contains.title': 'Một báo cáo RUA thường gồm',
    'rua.contains.li1': 'Tên miền mục tiêu (tên miền được báo cáo)',
    'rua.contains.li2': 'Địa chỉ IP nguồn và số lượng thư được gửi từ địa chỉ đó',
    'rua.contains.li3': 'Kết quả đánh giá SPF / DKIM / DMARC, chẳng hạn thành công hoặc thất bại',
    'rua.contains.li4': 'Kết quả căn chỉnh với miền trong trường From',
    'rua.contains.li5': 'Khoảng thời gian báo cáo và thông tin về tổ chức gửi báo cáo',

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
    'rua.gdpr.us.li5': 'Xóa và phối hợp: hỗ trợ các yêu cầu xóa dữ liệu hoặc thực hiện quyền của chủ thể dữ liệu thông qua bên kiểm soát dữ liệu là khách hàng.',

    'rua.roles.title': 'Vai trò (bên kiểm soát / bên xử lý dữ liệu)',
    'rua.roles.li1.html': '<strong>Khách hàng (bạn hoặc tổ chức của bạn):</strong> thường là <strong>bên kiểm soát dữ liệu (Controller)</strong>, vì quyết định mục đích và phương thức tiếp nhận, phân tích RUA.',
    'rua.roles.li2.html': '<strong>Nhà cung cấp dịch vụ:</strong> thường là <strong>bên xử lý dữ liệu (Processor)</strong>, thực hiện xử lý theo chỉ dẫn được lập thành văn bản trong DPA hoặc hợp đồng.',

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
    'rua.legal.li1.html': '<strong>Bên kiểm soát dữ liệu (khách hàng):</strong> tùy mục đích sử dụng, cơ sở thường là lợi ích hợp pháp về an ninh (GDPR 6(1)(f)) hoặc thực hiện hợp đồng (6(1)(b)).',
    'rua.legal.li2.html': '<strong>Bên xử lý dữ liệu (dịch vụ):</strong> xử lý theo hợp đồng hoặc DPA và các chỉ dẫn đã được lập thành văn bản của khách hàng (GDPR 28).',
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
    'rua.rights.li2.html': 'Yêu cầu thường được gửi trước tới <strong>bên kiểm soát dữ liệu là khách hàng</strong>. Với vai trò bên xử lý dữ liệu, chúng tôi phối hợp khi bên kiểm soát yêu cầu.',

    'rua.contact.title': 'Liên hệ',
    'rua.contact.body.html': 'Hỏi đáp về quyền riêng tư/xử lý dữ liệu: <strong>privacy@toppymicros.com</strong><br>Đơn vị vận hành: <strong>ToppyMicroServices OÜ</strong> (domain: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'Khiếu nại',
    'rua.complaints.body': 'Cư dân EU/EEA có quyền khiếu nại tới cơ quan giám sát (SA) tại địa phương.',

    'rua.trial.title': 'Dùng thử & dừng (điểm chính)',
    'rua.trial.li1.html': '<strong>Bắt đầu thử nghiệm:</strong> lần đầu tiếp nhận RUA thành công (kích hoạt)',
    'rua.trial.li2.html': '<strong>Kết thúc thử nghiệm:</strong> sau 30 ngày kể từ ngày bắt đầu (UI hiển thị số ngày còn lại)',
    'rua.trial.li3.html': '<strong>Tiếp tục:</strong> xác nhận rõ ràng bằng một lần nhấp vào “Tiếp tục bật”',
    'rua.trial.li4.html': '<strong>Mặc định:</strong> tự động dừng vào ngày thứ 30 nếu không có xác nhận tiếp tục',
    'rua.trial.li5.html': '<strong>Dữ liệu khi dừng:</strong> mặc định xóa (tùy chọn chỉ giữ số liệu dịch vụ ẩn danh)',

    'rua.stop.title': 'Cách dừng RUA sau khi chấm dứt',
    'rua.stop.intro': 'Thứ tự khuyến nghị:',
    'rua.stop.a.title.html': '<strong>A (khuyến nghị):</strong> vô hiệu DNS ủy quyền RUA bên ngoài để bên gửi không thể gửi được',
    'rua.stop.a.detail': 'Ví dụ: tắt TXT/CNAME dùng để ủy quyền đích RUA, khiến việc gửi không thể thành công.',
    'rua.stop.b.title.html': '<strong>B:</strong> vẫn nhận nhưng hủy (chi phí cao hơn; phương án cuối)',
    'rua.stop.b.detail': 'Hủy ngay khi nhận. Đảm bảo dừng tốt nhưng tăng chi phí mạng/xử lý.',

    'rua.ui.title': 'UI (cố định ở đầu dashboard)',
    'rua.ui.li1': 'Số ngày còn lại: “Còn ◯ ngày”',
    'rua.ui.li2': 'Nút tiếp tục: “Tiếp tục bật”',
    'rua.ui.li3': 'Nút dừng ngay: “Dừng ngay”',
    'rua.ui.li4': 'Trạng thái luôn hiển thị ở phần đầu và cố định khi cuộn.',

    'rua.links.back': '← Quay lại phần kiểm tra nhanh',
    'rua.links.spec': 'Đặc tả dịch vụ',
    'rua.strategy.title': 'Định hướng',
    'rua.strategy.body': 'Làm rõ vai trò của dịch vụ RUA trong DMARC, sau đó ưu tiên quy trình tiếp nhận, phân tích cú pháp và phân tích dữ liệu an toàn, đặt quyền riêng tư và khả năng chống lạm dụng lên hàng đầu.',
    'rua.keypoints.title': 'Các điểm chính',
    'rua.keypoints.li1': 'RUA là thẻ DMARC dùng để chỉ định địa chỉ nhận báo cáo tổng hợp dưới dạng URI mailto.',
    'rua.keypoints.li2': 'Dịch vụ RUA nhận thư báo cáo, phân tích XML, tổng hợp chỉ số và hiển thị trên bảng điều khiển do tổ chức tự vận hành hoặc bên thứ ba cung cấp.',
    'rua.keypoints.li3': 'Rủi ro chính không nằm ở DNS mà ở việc xử lý dữ liệu, cách ly dữ liệu giữa các khách hàng và chống lạm dụng như tệp quá lớn, tệp nén độc hại hoặc lượng báo cáo tăng đột biến.',
    'rua.definition.title': 'Làm rõ thuật ngữ',
    'rua.definition.li1.html': 'Trong DMARC, <span class="code">rua=</span> là danh sách URI nhận dữ liệu báo cáo tổng hợp. Nếu không có thẻ này, báo cáo tổng hợp sẽ không được tạo.',
    'rua.definition.li2': 'RFC 9990 định nghĩa báo cáo tổng hợp là tệp XML tóm tắt kết quả xác thực và căn chỉnh theo từng IP nguồn cùng số lượng thư.',
    'rua.definition.li3.html': '<span class="code">ruf=</span> có mục đích khác: báo cáo điều tra hoặc báo cáo lỗi có thể chứa dữ liệu của từng thư và nhạy cảm hơn về quyền riêng tư.',
    'rua.priorities.title': 'Danh sách ưu tiên',
    'rua.priorities.note': 'P0 = nền tảng tin cậy / P1 = phòng vệ vận hành / P2 = hoàn thiện sản phẩm.',
    'rua.p0.title.html': '<strong>P0 - Nền tảng để tránh sự cố</strong>',
    'rua.p0.li1.html': 'Xác minh quyền sở hữu miền, chẳng hạn bằng bản ghi TXT tại <span class="code">_dmarc4all-verify.&lt;domain&gt;</span>, trước khi hiển thị dữ liệu báo cáo.',
    'rua.p0.li2': 'Bảo vệ khâu tiếp nhận bằng giới hạn kích thước, kích thước sau giải nén, độ sâu của tệp nén lồng nhau và thời gian xử lý để chặn tệp nén độc hại.',
    'rua.p0.li3': 'Phân tích XML an toàn bằng cách tắt XXE, từ chối DTD, kiểm tra cấu trúc và ý nghĩa dữ liệu, đồng thời loại bỏ báo cáo không hợp lệ.',
    'rua.p0.li4': 'Công bố rõ quy tắc về quyền riêng tư và thời hạn lưu giữ; không lưu XML gốc hoặc chỉ lưu trong thời gian ngắn, và coi địa chỉ IP là dữ liệu nhạy cảm.',
    'rua.p1.title.html': '<strong>P1 - Phòng vệ trong vận hành</strong>',
    'rua.p1.li1': 'Cung cấp các chế độ tối thiểu hóa dữ liệu: tiêu chuẩn, ẩn danh hóa (IPv4 /24, IPv6 /48) hoặc chỉ lưu dữ liệu tổng hợp.',
    'rua.p1.li2': 'Cách ly dữ liệu giữa các khách hàng và kiểm soát truy cập bằng phân tách theo bản ghi, mã hóa và nhật ký kiểm toán.',
    'rua.p1.li3': 'Giới hạn tốc độ, phát hiện lượng báo cáo tăng đột biến và áp dụng biện pháp chống lạm dụng theo các lưu ý bảo mật tại Mục 8 của RFC 9990.',
    'rua.p1.li4': 'Ghi rõ dữ liệu là thông tin do bên nhận báo cáo và trình bày riêng kết quả SPF, DKIM và căn chỉnh.',
    'rua.p2.title.html': '<strong>P2 - Chất lượng và khả năng sử dụng</strong>',
    'rua.p2.li1': 'Đoạn DMARC có thể sao chép (ví dụ: p=none; rua=mailto:...) kèm hướng dẫn triển khai theo từng giai đoạn.',
    'rua.p2.li2': 'Cho phép xuất JSON hoặc CSV kèm thông tin về tổ chức báo cáo, kỳ báo cáo, thời điểm phân tích và phiên bản công cụ.',
    'rua.p2.li3': 'Cung cấp tín hiệu xác thực tùy chọn: kiểm tra DKIM hoặc SPF của thư báo cáo, lập danh sách bên báo cáo đã biết và gắn nhãn rõ cho nguồn chưa xác định.',

  });

  // Thai
  add('th', {
    'rua.pageTitle': 'Toppy DNS / สเปกบริการ RUA',
    'rua.pill': 'บริการ RUA (รายงานสรุป DMARC) — สเปกแบบย่อ',
    'rua.h1': 'ปลายทางรับ RUA / การออกแบบการหยุด / การจัดการข้อมูล',
    'rua.tagline': 'การทดลองใช้ฟรีจะหยุดโดยอัตโนมัติหลัง 30 วัน หากต้องการใช้งานต่อ ต้องยืนยันอย่างชัดเจน เมื่อหยุดแล้ว บริการจะไม่รับรายงาน RUA ใหม่อีก',

    'rua.setup.title': 'วิธีตั้งค่า RUA (ฝั่งลูกค้า)',
    'rua.setup.intro.html': 'ตั้งค่าปลายทาง RUA ที่บริการนี้ออกให้ (<span class="code">mailto:</span>) ในพารามิเตอร์ <span class="code">rua=</span> ของเรคคอร์ด DMARC <strong>คงค่า DMARC เดิมไว้ (p= / sp= / adkim= / aspf= ฯลฯ)</strong> และเพิ่ม (หรือแก้ไข) เฉพาะ <span class="code">rua=</span> เท่านั้น',
    'rua.setup.step1.html': '<strong>1)</strong> แก้ไขเรคคอร์ด DMARC ของโดเมน (มักเป็น <span class="code">_dmarc</span>)',
    'rua.setup.step2.html': '<strong>2)</strong> เพิ่ม (หรือแก้ไข) <span class="code">rua=mailto:{RUA_EMAIL}</span>',
    'rua.setup.step3.html': '<strong>3)</strong> ผู้รับบางรายอาจต้องใช้ระเบียน DNS เพื่ออนุญาตปลายทาง RUA ภายนอก ตามที่อธิบายใน RFC 9990 ส่วนที่ 4 แต่ <strong>บริการจะเผยแพร่ระเบียน TXT ที่จำเป็นภายใต้โดเมนของเราโดยอัตโนมัติ</strong> คุณจึงไม่ต้องแก้ไข DNS',
    'rua.setup.step4.html': '<strong>4)</strong> หลัง DNS มีผล รายงานมักเริ่มเข้าภายใน 24–48 ชั่วโมง',
    'rua.setup.note': 'หมายเหตุ: หากมีเรคคอร์ด DMARC อยู่แล้ว ให้คงค่าเดิมไว้และเพิ่มเฉพาะ rua= (รองรับหลาย mailto ได้)',

    'rua.disclaimer.title': 'ข้อจำกัดความรับผิดชอบ',
    'rua.disclaimer.body': 'ระยะทดลองใช้ฟรีคือ 30 วัน และจะใช้งานต่อได้เมื่อมีการยืนยันอย่างชัดเจน บริการนี้ให้ตามความสามารถ ภายใต้ข้อจำกัดการใช้งานที่เป็นธรรม และไม่มี SLA',

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
    'rua.gdpr.us.li5': 'การลบและความร่วมมือ: สนับสนุนคำขอลบและการใช้สิทธิของเจ้าของข้อมูลผ่านผู้ควบคุมข้อมูลส่วนบุคคล (ลูกค้า)',

    'rua.roles.title': 'บทบาทของผู้ควบคุมและผู้ประมวลผลข้อมูลส่วนบุคคล',
    'rua.roles.li1.html': '<strong>ลูกค้า (คุณหรือองค์กรของคุณ):</strong> โดยทั่วไปเป็น <strong>ผู้ควบคุมข้อมูลส่วนบุคคล (Controller)</strong> ซึ่งกำหนดวัตถุประสงค์และวิธีการรับและวิเคราะห์ RUA',
    'rua.roles.li2.html': '<strong>ผู้ให้บริการ:</strong> โดยทั่วไปเป็น <strong>ผู้ประมวลผลข้อมูลส่วนบุคคล (Processor)</strong> ซึ่งดำเนินการตามคำสั่งที่เป็นลายลักษณ์อักษรใน DPA หรือสัญญา',

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
    'rua.legal.li1.html': '<strong>ผู้ควบคุมข้อมูลส่วนบุคคล (ลูกค้า):</strong> ฐานกฎหมายอาจเป็นประโยชน์โดยชอบด้วยกฎหมายด้านความปลอดภัย (GDPR 6(1)(f)) หรือการปฏิบัติตามสัญญา (6(1)(b)) ขึ้นอยู่กับการใช้งาน',
    'rua.legal.li2.html': '<strong>ผู้ประมวลผลข้อมูลส่วนบุคคล (บริการนี้):</strong> ประมวลผลตามสัญญาหรือ DPA และคำสั่งที่เป็นลายลักษณ์อักษรของลูกค้า (GDPR 28)',
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
    'rua.rights.li2.html': 'โดยทั่วไปให้ยื่นคำขอต่อ <strong>ผู้ควบคุมข้อมูลส่วนบุคคล (ลูกค้า)</strong> ก่อน ในฐานะผู้ประมวลผลข้อมูลส่วนบุคคล เราจะให้ความร่วมมือตามคำขอของผู้ควบคุมข้อมูล',

    'rua.contact.title': 'ติดต่อ',
    'rua.contact.body.html': 'สอบถามด้านความเป็นส่วนตัว/การประมวลผลข้อมูล: <strong>privacy@toppymicros.com</strong><br>ผู้ให้บริการ: <strong>ToppyMicroServices OÜ</strong> (โดเมน: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'การร้องเรียน',
    'rua.complaints.body': 'ผู้อยู่อาศัยใน EU/EEA มีสิทธิยื่นคำร้องต่อหน่วยงานกำกับดูแล (SA) ในพื้นที่ของตน',

    'rua.trial.title': 'ทดลองใช้งานและการหยุด (ประเด็นหลัก)',
    'rua.trial.li1.html': '<strong>เริ่มทดลอง:</strong> รับ RUA สำเร็จครั้งแรก (เปิดใช้งาน)',
    'rua.trial.li2.html': '<strong>สิ้นสุดทดลอง:</strong> 30 วันหลังเริ่ม (UI แสดงจำนวนวันที่เหลือ)',
    'rua.trial.li3.html': '<strong>ใช้งานต่อ:</strong> ยืนยันอย่างชัดเจนด้วยการกด “เปิดใช้งานต่อ” หนึ่งครั้ง',
    'rua.trial.li4.html': '<strong>ค่าเริ่มต้น:</strong> หยุดอัตโนมัติในวันที่ 30 หากไม่มีการยืนยันให้ใช้งานต่อ',
    'rua.trial.li5.html': '<strong>ข้อมูลเมื่อหยุด:</strong> ลบโดยค่าเริ่มต้น (อาจเก็บเฉพาะเมตริกบริการแบบไม่ระบุตัวตน)',

    'rua.stop.title': 'วิธีหยุด RUA หลังยุติบริการ',
    'rua.stop.intro': 'ลำดับที่แนะนำ:',
    'rua.stop.a.title.html': '<strong>A (แนะนำ):</strong> ปิด DNS อนุญาต RUA ภายนอกเพื่อให้ผู้ส่งไม่สามารถส่งได้',
    'rua.stop.a.detail': 'ตัวอย่าง: ปิด TXT/CNAME ที่ใช้อนุญาตปลายทาง RUA เพื่อให้การส่งไม่สำเร็จ',
    'rua.stop.b.title.html': '<strong>B:</strong> รับแต่ทิ้ง (ต้นทุนสูงขึ้น; ทางเลือกสุดท้าย)',
    'rua.stop.b.detail': 'ทิ้งทันทีเมื่อมาถึง รับประกันการหยุดได้ดี แต่เพิ่มต้นทุนเครือข่าย/การประมวลผล',

    'rua.ui.title': 'UI (ยึดติดด้านบนของแดชบอร์ด)',
    'rua.ui.li1': 'จำนวนวันที่เหลือ: “เหลือ ◯ วัน”',
    'rua.ui.li2': 'ปุ่มดำเนินการต่อ: “เปิดใช้งานต่อ”',
    'rua.ui.li3': 'ปุ่มหยุดทันที: “หยุดทันที”',
    'rua.ui.li4': 'สถานะต้องเห็นได้ทันทีและยึดติดเมื่อเลื่อนหน้าจอ',

    'rua.links.back': '← กลับไปยังการตรวจสอบด่วน',
    'rua.links.spec': 'ข้อกำหนดบริการ',
    'rua.strategy.title': 'แนวทาง',
    'rua.strategy.body': 'กำหนดบทบาทของบริการ RUA ใน DMARC ให้ชัดเจน แล้วปกป้องกระบวนการทั้งหมดตั้งแต่รับรายงาน วิเคราะห์ XML ไปจนถึงประเมินผล โดยให้ความเป็นส่วนตัวและการป้องกันการใช้ในทางที่ผิดเป็นลำดับแรก',
    'rua.keypoints.title': 'ประเด็นสำคัญ',
    'rua.keypoints.li1': 'RUA คือแท็ก DMARC ที่ระบุปลายทางของรายงานแบบรวมในรูป URI ของ mailto',
    'rua.keypoints.li2': 'บริการ RUA รับอีเมลรายงาน วิเคราะห์ XML รวมผล และแสดงข้อมูลผ่านแดชบอร์ดที่ดูแลเองหรือใช้บริการจากภายนอก',
    'rua.keypoints.li3': 'ความเสี่ยงหลักไม่ได้อยู่ที่ DNS แต่อยู่ที่การจัดการข้อมูล การแยกข้อมูลของลูกค้าแต่ละราย และการโจมตีด้วยไฟล์ขนาดใหญ่ ไฟล์บีบอัดที่เป็นอันตราย หรือรายงานจำนวนมากผิดปกติ',
    'rua.definition.title': 'คำจำกัดความ',
    'rua.definition.li1.html': 'ใน DMARC ค่า <span class="code">rua=</span> คือรายการ URI ที่ใช้รับรายงานแบบรวม หากไม่ระบุ จะไม่มีการสร้างรายงานประเภทนี้',
    'rua.definition.li2': 'RFC 9990 กำหนดให้รายงานแบบรวมเป็นเอกสาร XML ที่สรุปผลการยืนยันและการจัดแนวตาม IP ต้นทางและจำนวนข้อความ',
    'rua.definition.li3.html': '<span class="code">ruf=</span> มีวัตถุประสงค์ต่างกัน โดยระบุปลายทางของรายงานความล้มเหลวที่อาจมีข้อมูลของข้อความแต่ละฉบับ จึงต้องระมัดระวังเรื่องความเป็นส่วนตัวมากกว่า',
    'rua.priorities.title': 'เช็กลิสต์ตามลำดับความสำคัญ',
    'rua.priorities.note': 'P0 คือมาตรการป้องกันที่จำเป็น P1 คือความทนทานในการใช้งานจริง และ P2 คือความสะดวกและคุณภาพของผลิตภัณฑ์',
    'rua.p0.title.html': '<strong>P0 - มาตรการป้องกันที่จำเป็น</strong>',
    'rua.p0.li1.html': 'ยืนยันความเป็นเจ้าของโดเมน เช่น ใช้ระเบียน TXT ที่ <span class="code">_dmarc4all-verify.&lt;domain&gt;</span> ก่อนแสดงข้อมูลรายงาน',
    'rua.p0.li2': 'ปกป้องขั้นตอนรับรายงานด้วยการจำกัดขนาดข้อความ ขนาดหลังแตกไฟล์ ความลึกของไฟล์ซ้อน และเวลาประมวลผล เพื่อสกัดไฟล์บีบอัดที่เป็นอันตราย',
    'rua.p0.li3': 'วิเคราะห์ XML อย่างปลอดภัย โดยปิด XXE ปฏิเสธ DTD ตรวจโครงสร้างและความหมายของข้อมูล แล้วทิ้งรายงานที่ไม่ถูกต้อง',
    'rua.p0.li4': 'ประกาศกฎด้านความเป็นส่วนตัวและระยะเวลาเก็บรักษาให้ชัดเจน ไม่เก็บ XML ต้นฉบับหรือเก็บเพียงช่วงสั้น ๆ และถือว่าที่อยู่ IP เป็นข้อมูลการดำเนินงานที่อ่อนไหว',
    'rua.p1.title.html': '<strong>P1 - ความทนทานในการใช้งานจริง</strong>',
    'rua.p1.li1': 'มีโหมดลดการเก็บข้อมูล ได้แก่ มาตรฐาน ไม่ระบุตัวตน (IPv4 /24 และ IPv6 /48) หรือเก็บเฉพาะข้อมูลรวม',
    'rua.p1.li2': 'แยกข้อมูลของลูกค้าแต่ละรายและควบคุมการเข้าถึงด้วยการแยกระดับแถว การเข้ารหัส และบันทึกการตรวจสอบ',
    'rua.p1.li3': 'กำหนดอัตราการรับ ตรวจจับรายงานที่หลั่งไหลผิดปกติ และป้องกันการใช้ในทางที่ผิดตามข้อพิจารณาด้านความปลอดภัยใน RFC 9990 ส่วนที่ 8',
    'rua.p1.li4': 'ระบุให้ชัดว่าข้อมูลเป็นผลที่ผู้รับรายงานมา และแสดงผล SPF, DKIM และการจัดแนวแยกจากกัน',
    'rua.p2.title.html': '<strong>P2 - ความสะดวกและคุณภาพ</strong>',
    'rua.p2.li1': 'ให้ตัวอย่าง DMARC ที่คัดลอกไปใช้ได้ เช่น p=none; rua=mailto:... พร้อมคำแนะนำการปรับใช้อย่างเป็นขั้นตอน',
    'rua.p2.li2': 'ใส่ชื่อองค์กรที่รายงาน ช่วงเวลารายงาน เวลาที่วิเคราะห์ และเวอร์ชันเครื่องมือไว้ในการส่งออก JSON หรือ CSV',
    'rua.p2.li3': 'แสดงสัญญาณความน่าเชื่อถือเพิ่มเติมได้ เช่น ผล DKIM หรือ SPF ของอีเมลรายงาน และแยกองค์กรที่รู้จักออกจากแหล่งที่ยังไม่ทราบ',

  });

  // Indonesian
  add('id', {
    'rua.pageTitle': 'Toppy DNS / Spesifikasi Layanan RUA',
    'rua.pill': 'Layanan RUA (Laporan Agregat DMARC) — Ringkasan Spesifikasi',
    'rua.h1': 'Endpoint RUA / desain penghentian / penanganan data',
    'rua.tagline': 'Uji coba gratis berhenti otomatis setelah 30 hari. Penggunaan hanya berlanjut setelah ada persetujuan yang tegas. Setelah dihentikan, layanan tidak akan menerima laporan RUA baru.',

    'rua.setup.title': 'Cara mengonfigurasi RUA (sisi pelanggan)',
    'rua.setup.intro.html': 'Setel tujuan RUA yang diterbitkan oleh layanan ini (<span class="code">mailto:</span>) pada tag <span class="code">rua=</span> di record DMARC Anda. <strong>Pertahankan pengaturan DMARC yang sudah ada (p= / sp= / adkim= / aspf=, dll.)</strong> dan hanya tambahkan (atau perbarui) <span class="code">rua=</span>.',
    'rua.setup.step1.html': '<strong>1)</strong> Edit record DMARC domain Anda (biasanya <span class="code">_dmarc</span>).',
    'rua.setup.step2.html': '<strong>2)</strong> Tambahkan (atau perbarui) <span class="code">rua=mailto:{RUA_EMAIL}</span>.',
    'rua.setup.step3.html': '<strong>3)</strong> Sebagian penerima memerlukan catatan DNS untuk mengizinkan tujuan RUA eksternal, sebagaimana dijelaskan dalam Bagian 4 RFC 9990. Namun, <strong>layanan ini menerbitkan catatan TXT yang diperlukan secara otomatis di bawah domain kami</strong>; Anda tidak perlu mengubah DNS.',
    'rua.setup.step4.html': '<strong>4)</strong> Setelah DNS terpropagasi, laporan biasanya mulai masuk dalam 24–48 jam.',
    'rua.setup.note': 'Catatan: jika Anda sudah memiliki record DMARC, pertahankan tag/policy yang ada dan cukup tambahkan rua= (bisa beberapa tujuan mailto).',

    'rua.disclaimer.title': 'Disklaimer',
    'rua.disclaimer.body': 'Masa uji coba gratis berlangsung 30 hari dan hanya dilanjutkan dengan persetujuan tegas. Layanan diberikan berdasarkan upaya terbaik, tunduk pada batas penggunaan wajar, dan tanpa SLA.',

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

    'rua.roles.title': 'Peran Pengendali dan Prosesor Data Pribadi',
    'rua.roles.li1.html': '<strong>Pelanggan (Anda atau organisasi Anda):</strong> umumnya bertindak sebagai <strong>Pengendali Data Pribadi (Controller)</strong> karena menentukan tujuan dan cara penerimaan serta analisis RUA.',
    'rua.roles.li2.html': '<strong>Penyedia layanan:</strong> umumnya bertindak sebagai <strong>Prosesor Data Pribadi (Processor)</strong> dan memproses data berdasarkan instruksi tertulis dalam DPA atau kontrak.',

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
    'rua.legal.li1.html': '<strong>Pengendali Data Pribadi (pelanggan):</strong> bergantung pada penggunaannya, dasar hukum yang umum adalah kepentingan yang sah untuk keamanan (GDPR 6(1)(f)) atau pelaksanaan kontrak (6(1)(b)).',
    'rua.legal.li2.html': '<strong>Prosesor Data Pribadi (layanan ini):</strong> memproses data berdasarkan kontrak atau DPA serta instruksi tertulis pelanggan (GDPR 28).',
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
    'rua.rights.li2.html': 'Permintaan biasanya disampaikan terlebih dahulu kepada <strong>Pengendali Data Pribadi (pelanggan)</strong>. Sebagai Prosesor Data Pribadi, kami membantu atas permintaan pengendali.',

    'rua.contact.title': 'Kontak',
    'rua.contact.body.html': 'Pertanyaan privasi/pemrosesan data: <strong>privacy@toppymicros.com</strong><br>Operator: <strong>ToppyMicroServices OÜ</strong> (domain: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'Keluhan',
    'rua.complaints.body': 'Warga EU/EEA memiliki hak mengajukan keluhan ke otoritas pengawas (SA) setempat.',

    'rua.trial.title': 'Uji coba & penghentian (poin utama)',
    'rua.trial.li1.html': '<strong>Mulai uji coba:</strong> intake (aktivasi) RUA berhasil pertama kali',
    'rua.trial.li2.html': '<strong>Akhir uji coba:</strong> 30 hari setelah mulai (UI menampilkan sisa hari)',
    'rua.trial.li3.html': '<strong>Lanjutkan:</strong> persetujuan tegas dengan satu klik pada “Tetap aktif”',
    'rua.trial.li4.html': '<strong>Secara default:</strong> berhenti otomatis pada hari ke-30 jika tidak ada persetujuan untuk melanjutkan',
    'rua.trial.li5.html': '<strong>Data saat berhenti:</strong> dihapus secara default (opsional menyimpan metrik anonim)',

    'rua.stop.title': 'Cara menghentikan RUA setelah terminasi',
    'rua.stop.intro': 'Urutan yang disarankan:',
    'rua.stop.a.title.html': '<strong>A (disarankan):</strong> nonaktifkan DNS otorisasi RUA eksternal agar pengirim tidak bisa mengirim',
    'rua.stop.a.detail': 'Contoh: nonaktifkan TXT/CNAME untuk mengotorisasi tujuan RUA sehingga pengiriman gagal.',
    'rua.stop.b.title.html': '<strong>B:</strong> terima lalu buang (biaya lebih tinggi; pilihan terakhir)',
    'rua.stop.b.detail': 'Buang saat diterima. Jaminan stop kuat, tetapi biaya jaringan/pemrosesan meningkat.',

    'rua.ui.title': 'UI (dipasang tetap di bagian atas dashboard)',
    'rua.ui.li1': 'Sisa waktu: “Tersisa ◯ hari”',
    'rua.ui.li2': 'Tombol lanjutkan: “Tetap aktif”',
    'rua.ui.li3': 'Tombol berhenti sekarang: “Hentikan sekarang”',
    'rua.ui.li4': 'Status selalu terlihat di tampilan awal dan tetap terlihat saat scroll.',

    'rua.links.back': '← Kembali ke pemeriksaan cepat',
    'rua.links.spec': 'Spesifikasi layanan',
    'rua.strategy.title': 'Pendekatan',
    'rua.strategy.body': 'Tetapkan peran layanan RUA dalam DMARC, lalu amankan seluruh proses penerimaan laporan, penguraian XML, dan analisis hasil. Privasi dan pencegahan penyalahgunaan menjadi prioritas.',
    'rua.keypoints.title': 'Poin kunci',
    'rua.keypoints.li1': 'RUA adalah tag DMARC yang berisi URI mailto tujuan pengiriman laporan agregat.',
    'rua.keypoints.li2': 'Layanan RUA menerima email laporan, menguraikan XML, merangkum hasil, dan menampilkannya melalui dasbor yang dikelola sendiri atau pihak ketiga.',
    'rua.keypoints.li3': 'Risiko utama bukan terletak pada DNS, melainkan pada pemrosesan data, pemisahan data antarpelanggan, serta penyalahgunaan seperti file terlalu besar, bom kompresi, atau lonjakan laporan.',
    'rua.definition.title': 'Istilah',
    'rua.definition.li1.html': 'Dalam DMARC, <span class="code">rua=</span> berisi daftar URI tujuan laporan agregat. Jika tag ini tidak ada, laporan agregat tidak dibuat.',
    'rua.definition.li2': 'RFC 9990 mendefinisikan laporan agregat sebagai dokumen XML yang merangkum hasil autentikasi dan penyelarasan berdasarkan IP sumber dan jumlah pesan.',
    'rua.definition.li3.html': '<span class="code">ruf=</span> memiliki tujuan berbeda: tag ini menentukan tujuan laporan kegagalan yang dapat memuat informasi tentang pesan tertentu sehingga lebih sensitif dari sisi privasi.',
    'rua.priorities.title': 'Daftar prioritas',
    'rua.priorities.note': 'P0 mencakup perlindungan wajib, P1 ketahanan operasional, dan P2 kemudahan penggunaan serta kualitas produk.',
    'rua.p0.title.html': '<strong>P0 - Perlindungan wajib</strong>',
    'rua.p0.li1.html': 'Verifikasi kepemilikan domain, misalnya dengan catatan TXT di <span class="code">_dmarc4all-verify.&lt;domain&gt;</span>, sebelum menampilkan data laporan.',
    'rua.p0.li2': 'Lindungi proses penerimaan dengan batas ukuran pesan, ukuran setelah dekompresi, kedalaman arsip bertingkat, dan waktu pemrosesan untuk memblokir bom kompresi.',
    'rua.p0.li3': 'Uraikan XML dengan aman: nonaktifkan XXE, tolak DTD, validasi struktur dan makna data, lalu buang laporan yang tidak valid.',
    'rua.p0.li4': 'Publikasikan aturan privasi dan penyimpanan yang jelas. Jangan simpan XML mentah atau simpan hanya sebentar, dan perlakukan alamat IP sebagai data operasional yang sensitif.',
    'rua.p1.title.html': '<strong>P1 - Ketahanan operasional</strong>',
    'rua.p1.li1': 'Sediakan mode minimisasi data: standar, dianonimkan (IPv4 /24 dan IPv6 /48), atau hanya agregat.',
    'rua.p1.li2': 'Pisahkan data antarpelanggan melalui pemisahan tingkat baris, enkripsi, kontrol akses, dan log audit.',
    'rua.p1.li3': 'Terapkan pembatasan laju dan deteksi lonjakan laporan sesuai pertimbangan keamanan pada Bagian 8 RFC 9990.',
    'rua.p1.li4': 'Jelaskan bahwa data merupakan hasil pengamatan yang dilaporkan penerima, dan tampilkan hasil SPF, DKIM, serta penyelarasan secara terpisah.',
    'rua.p2.title.html': '<strong>P2 - Kemudahan penggunaan dan kualitas</strong>',
    'rua.p2.li1': 'Potongan DMARC siap salin (misalnya p=none; rua=mailto:...) dengan panduan penerapan bertahap.',
    'rua.p2.li2': 'Sertakan organisasi pelapor, periode laporan, waktu analisis, dan versi alat dalam ekspor JSON atau CSV.',
    'rua.p2.li3': 'Secara opsional, tampilkan sinyal keaslian seperti hasil DKIM atau SPF pada email laporan, serta bedakan organisasi pelapor yang dikenal dan yang belum dikenal.',

  });

  // Estonian
  add('et', {
    'rua.pageTitle': 'Toppy DNS / RUA teenuse spetsifikatsioon',
    'rua.pill': 'RUA (DMARC koondraportid) teenus — põhispec',
    'rua.h1': 'RUA lõpp-punkt / peatamise disain / andmekäitlus',
    'rua.tagline': 'Tasuta prooviperiood lõpeb automaatselt 30 päeva pärast. Jätkamiseks on vaja selgesõnalist kinnitust. Pärast peatamist uusi RUA-raporteid vastu ei võeta.',

    'rua.setup.title': 'Kuidas RUA seadistada (kliendi poolel)',
    'rua.setup.intro.html': 'Seadista selle teenuse poolt väljastatud RUA siht (<span class="code">mailto:</span>) oma DMARC kirje <span class="code">rua=</span> parameetrisse. <strong>Säilita olemasolevad DMARC-seaded (p= / sp= / adkim= / aspf= jne)</strong> ja lisa (või uuenda) ainult <span class="code">rua=</span>.',
    'rua.setup.step1.html': '<strong>1)</strong> Muuda oma domeeni DMARC kirjet (tavaliselt <span class="code">_dmarc</span>).',
    'rua.setup.step2.html': '<strong>2)</strong> Lisa (või uuenda) <span class="code">rua=mailto:{RUA_EMAIL}</span>.',
    'rua.setup.step3.html': '<strong>3)</strong> Mõni vastuvõtja nõuab välise RUA-sihtkoha jaoks DNS-i autoriseerimiskirjet, nagu kirjeldab RFC 9990 4. jaotis. Sel juhul <strong>avaldab teenus vajaliku TXT-kirje automaatselt meie domeeni all</strong>; teie DNS-is pole muudatusi vaja.',
    'rua.setup.step4.html': '<strong>4)</strong> Pärast DNS-i levikut hakkavad raportid tavaliselt saabuma 24–48 tunni jooksul.',
    'rua.setup.note': 'Märkus: kui DMARC kirje on juba olemas, säilita olemasolevad tagid/poliitika ja lisa ainult rua= (võimalik on mitu mailto sihtkohta).',

    'rua.disclaimer.title': 'Lahtiütlus',
    'rua.disclaimer.body': 'Tasuta prooviperiood kestab 30 päeva ja jätkub ainult selgesõnalise kinnituse korral. Teenust osutatakse parima võimaliku pingutuse põhimõttel, õiglase kasutuse piirangutega ja ilma SLA-ta.',

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

    'rua.roles.title': 'Vastutava ja volitatud töötleja rollid',
    'rua.roles.li1.html': '<strong>Klient (teie või teie organisatsioon):</strong> on tavaliselt <strong>vastutav töötleja (Controller)</strong>, sest määrab RUA vastuvõtmise ja analüüsimise eesmärgid ning vahendid.',
    'rua.roles.li2.html': '<strong>Teenusepakkuja:</strong> on tavaliselt <strong>volitatud töötleja (Processor)</strong> ja töötleb andmeid DPA-s või lepingus dokumenteeritud juhiste järgi.',

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
    'rua.legal.li1.html': '<strong>Vastutav töötleja (klient):</strong> õiguslik alus on sõltuvalt kasutusest sageli turvalisusega seotud õigustatud huvi (GDPR 6(1)(f)) või lepingu täitmine (6(1)(b)).',
    'rua.legal.li2.html': '<strong>Volitatud töötleja (see teenus):</strong> töötleb andmeid lepingu või DPA ja kliendi dokumenteeritud juhiste alusel (GDPR 28).',
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
    'rua.rights.li2.html': 'Taotlus esitatakse tavaliselt esmalt <strong>vastutavale töötlejale (kliendile)</strong>. Volitatud töötlejana abistame vastutava töötleja taotluse alusel.',

    'rua.contact.title': 'Kontakt',
    'rua.contact.body.html': 'Privaatsus/andmetöötluse küsimused: <strong>privacy@toppymicros.com</strong><br>Operaator: <strong>ToppyMicroServices OÜ</strong> (domeen: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'Kaebused',
    'rua.complaints.body': 'EL/EMP elanikul on õigus esitada kaebus oma kohalikule järelevalveasutusele (SA).',

    'rua.trial.title': 'Prooviperiood ja peatamine (põhipunktid)',
    'rua.trial.li1.html': '<strong>Proov algab:</strong> RUA esimene edukas vastuvõtt (aktiveerimine)',
    'rua.trial.li2.html': '<strong>Proov lõpeb:</strong> 30 päeva pärast algust (UI näitab järelejäänud päevi)',
    'rua.trial.li3.html': '<strong>Jätkamine:</strong> selgesõnaline nõusolek ühe klõpsuga nupul „Jäta aktiivseks“',
    'rua.trial.li4.html': '<strong>Vaikimisi:</strong> teenus peatub 30. päeval automaatselt, kui jätkamist ei kinnitata',
    'rua.trial.li5.html': '<strong>Andmed peatamisel:</strong> kustutatakse vaikimisi (valikuliselt anonüümsed teenusemõõdikud)',

    'rua.stop.title': 'Kuidas peatada RUA pärast lõpetamist',
    'rua.stop.intro': 'Soovituslik järjekord:',
    'rua.stop.a.title.html': '<strong>A (soovitatav):</strong> keelake väline RUA autoriseerimise DNS, et saatjad ei saaks edastada',
    'rua.stop.a.detail': 'Näide: keelake TXT/CNAME, mida kasutatakse RUA sihtkoha autoriseerimiseks, et edastus ei õnnestuks.',
    'rua.stop.b.title.html': '<strong>B:</strong> võta vastu, aga hävita (kallim; viimane võimalus)',
    'rua.stop.b.detail': 'Hävita koheselt vastuvõtul. Tugev peatamise garantii, kuid suurem võrgu/töötluse kulu.',

    'rua.ui.title': 'UI (fikseeritud juhtpaneeli ülaservas)',
    'rua.ui.li1': 'Järelejäänud aeg: „◯ päeva jäänud“',
    'rua.ui.li2': 'Jätkamise nupp: „Jäta aktiivseks“',
    'rua.ui.li3': 'Kohe peatamise nupp: „Peata kohe“',
    'rua.ui.li4': 'Olek on alati esimeses vaates nähtav ja jääb kerimisel fikseeritult nähtavale.',

    'rua.links.back': '← Tagasi kiirkontrolli',
    'rua.links.spec': 'Teenuse kirjeldus',
    'rua.strategy.title': 'Põhimõte',
    'rua.strategy.body': 'Määratle RUA-teenuse roll DMARC-is ning turva kogu protsess aruannete vastuvõtmisest ja XML-i töötlemisest kuni tulemuste analüüsini. Esikohal on privaatsus ja väärkasutuse vältimine.',
    'rua.keypoints.title': 'Põhipunktid',
    'rua.keypoints.li1': 'RUA on DMARC-i silt, mis sisaldab koondaruannete sihtkohtade mailto-URI-sid.',
    'rua.keypoints.li2': 'RUA-teenus võtab aruandemeilid vastu, töötleb XML-i, koondab tulemused ja kuvab need enda või kolmanda osapoole juhtpaneelil.',
    'rua.keypoints.li3': 'Peamine risk ei ole DNS, vaid andmete töötlemine, klientide andmete eraldamine ning ründed, näiteks liiga suured failid, pakkimispommid või aruannete tulv.',
    'rua.definition.title': 'Mõisted',
    'rua.definition.li1.html': 'DMARC-is sisaldab <span class="code">rua=</span> koondaruannete sihtkohtade URI-de loendit. Kui silti ei ole, koondaruandeid ei koostata.',
    'rua.definition.li2': 'RFC 9990 määratleb koondaruande XML-dokumendina, mis võtab autentimise ja joonduse tulemused kokku lähte-IP ning sõnumite arvu järgi.',
    'rua.definition.li3.html': '<span class="code">ruf=</span> täidab teist ülesannet: see määrab tõrkearuannete sihtkohad. Need aruanded võivad sisaldada üksiku sõnumi andmeid ja vajavad seetõttu rangemat privaatsuskaitset.',
    'rua.priorities.title': 'Prioriteetne kontrollnimekiri',
    'rua.priorities.note': 'P0 hõlmab hädavajalikke kaitsemeetmeid, P1 töökindlust ning P2 kasutusmugavust ja toote kvaliteeti.',
    'rua.p0.title.html': '<strong>P0 - Hädavajalikud kaitsemeetmed</strong>',
    'rua.p0.li1.html': 'Kinnita domeeni omandiõigus, näiteks TXT-kirjega aadressil <span class="code">_dmarc4all-verify.&lt;domain&gt;</span>, enne aruandeandmete kuvamist.',
    'rua.p0.li2': 'Kaitse vastuvõttu sõnumi suuruse, lahtipakitud mahu, pesastatud arhiivide sügavuse ja töötlemisaja piirangutega.',
    'rua.p0.li3': 'Töötle XML-i turvaliselt: keela XXE, lükka DTD tagasi, kontrolli struktuuri ja tähendust ning kõrvalda vigased aruanded.',
    'rua.p0.li4': 'Avalda selged privaatsus- ja säilitamisreeglid. Ära säilita algset XML-i või tee seda vaid lühikest aega ning käsitle IP-aadresse tundlike tööandmetena.',
    'rua.p1.title.html': '<strong>P1 - Töökindlus</strong>',
    'rua.p1.li1': 'Paku andmete minimeerimise režiime: standardne, anonüümitud (IPv4 /24 ja IPv6 /48) või ainult koondandmed.',
    'rua.p1.li2': 'Eralda klientide andmed reataseme eraldamise, krüpteerimise, ligipääsukontrolli ja auditilogidega.',
    'rua.p1.li3': 'Rakenda kiirusepiiranguid ja tuvasta aruannete tulv vastavalt RFC 9990 8. jaotise turvakaalutlustele.',
    'rua.p1.li4': 'Märgi andmed selgelt vastuvõtja esitatud vaatlustena ning kuva SPF-i, DKIM-i ja joonduse tulemused eraldi.',
    'rua.p2.title.html': '<strong>P2 - Kasutusmugavus ja kvaliteet</strong>',
    'rua.p2.li1': 'Kopeerimiseks valmis DMARC näited (nt p=none; rua=mailto:...) koos etapilise kasutuselevõtu juhisega.',
    'rua.p2.li2': 'Lisa JSON- või CSV-ekspordile aruandev organisatsioon, aruandeperiood, töötlemise aeg ja tööriista versioon.',
    'rua.p2.li3': 'Näita soovi korral ehtsussignaale, näiteks aruandemeili DKIM-i või SPF-i tulemust, ning erista tuntud ja tundmatuid aruandeallikaid.',

  });

  // Korean
  add('ko', {
    'rua.pageTitle': 'Toppy DNS / RUA 서비스 사양',
    'rua.pill': 'RUA(DMARC 집계 리포트) 서비스 — 핵심 사양',
    'rua.h1': 'RUA 엔드포인트 / 중지 설계 / 데이터 처리',
    'rua.tagline': '무료 체험은 30일 후 자동으로 중지됩니다. 계속 사용하려면 명시적인 동의가 필요합니다. 중지 후에는 새로운 RUA 보고서를 받지 않습니다.',

    'rua.setup.title': 'RUA 설정 방법(고객 측)',
    'rua.setup.intro.html': '이 서비스가 발급한 RUA 수신처(<span class="code">mailto:</span>)를 DMARC 레코드의 <span class="code">rua=</span>에 설정합니다. <strong>기존 DMARC 설정(p= / sp= / adkim= / aspf= 등)은 유지</strong>하고, <span class="code">rua=</span>만 추가(또는 갱신)하세요.',
    'rua.setup.step1.html': '<strong>1)</strong> 도메인의 DMARC 레코드(보통 <span class="code">_dmarc</span>)를 수정합니다.',
    'rua.setup.step2.html': '<strong>2)</strong> <span class="code">rua=mailto:{RUA_EMAIL}</span> 를 추가(또는 갱신)합니다.',
    'rua.setup.step3.html': '<strong>3)</strong> 일부 수신자는 RFC 9990 제4절에 설명된 외부 RUA 목적지 승인용 DNS 레코드를 요구합니다. 이 경우에도 <strong>필요한 TXT 레코드는 서비스가 당사 도메인 아래에 자동으로 게시</strong>하므로 고객 측 DNS는 변경할 필요가 없습니다.',
    'rua.setup.step4.html': '<strong>4)</strong> DNS 반영 후 보통 24–48시간 내에 리포트 수신이 시작됩니다.',
    'rua.setup.note': '참고: DMARC 레코드가 이미 있다면 기존 정책/태그는 유지하고 rua=만 추가하세요(여러 mailto 목적지도 가능).',

    'rua.disclaimer.title': '면책 사항',
    'rua.disclaimer.body': '무료 체험 기간은 30일이며, 명시적으로 동의해야 계속 사용할 수 있습니다. 서비스는 공정 사용 한도 내에서 합리적인 노력으로 제공되며 SLA는 없습니다.',

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

    'rua.roles.title': '역할(개인정보처리자 / 수탁처리자)',
    'rua.roles.li1.html': '<strong>고객(이용자 또는 이용 조직):</strong> RUA 수신과 분석의 목적 및 수단을 결정하므로 일반적으로 <strong>개인정보처리자(Controller)</strong>에 해당합니다.',
    'rua.roles.li2.html': '<strong>서비스 제공자:</strong> 고객의 문서화된 지시에 따라 처리하므로 일반적으로 <strong>수탁처리자(Processor)</strong>에 해당하며, DPA 또는 계약에서 역할을 명확히 합니다.',

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
    'rua.legal.li1.html': '<strong>개인정보처리자(고객):</strong> 이용 목적에 따라 보안에 관한 정당한 이익(GDPR 6(1)(f)) 또는 계약 이행(6(1)(b)) 등이 법적 근거가 될 수 있습니다.',
    'rua.legal.li2.html': '<strong>수탁처리자(본 서비스):</strong> 고객과의 계약 또는 DPA 및 문서화된 지시에 따라 처리합니다(GDPR 28).',
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
    'rua.rights.li2.html': '정보주체의 요청은 일반적으로 <strong>개인정보처리자인 고객</strong>에게 먼저 접수합니다. 본 서비스는 수탁처리자로서 고객의 요청에 협조합니다.',

    'rua.contact.title': '연락처',
    'rua.contact.body.html': '프라이버시/데이터 처리 문의: <strong>privacy@toppymicros.com</strong><br>사업자: <strong>ToppyMicroServices OÜ</strong> (도메인: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': '불만/신고',
    'rua.complaints.body': 'EU/EEA 거주자는 관할 감독기관(SA)에 불만을 제기할 권리가 있습니다.',

    'rua.trial.title': '트라이얼 및 중지(요점)',
    'rua.trial.li1.html': '<strong>트라이얼 시작일:</strong> RUA 수신(활성화)이 처음 성공한 날',
    'rua.trial.li2.html': '<strong>트라이얼 종료일:</strong> 시작일로부터 30일 후(UI는 잔여일 표시)',
    'rua.trial.li3.html': '<strong>계속 사용:</strong> “계속 사용” 버튼을 한 번 눌러 명시적으로 동의',
    'rua.trial.li4.html': '<strong>기본 동작:</strong> 계속 사용하겠다는 동의가 없으면 30일째에 자동 중지',
    'rua.trial.li5.html': '<strong>중지 시 데이터:</strong> 기본 삭제(선택적으로 익명 서비스 메트릭만 유지)',

    'rua.stop.title': '중지 후 RUA 수신을 멈추는 방법',
    'rua.stop.intro': '권장 순서는 다음과 같습니다.',
    'rua.stop.a.title.html': '<strong>A(권장):</strong> 외부 RUA 허용 DNS를 비활성화해 발신 측에서 전송이 불가능하게 만들기',
    'rua.stop.a.detail': '예: RUA 목적지 허용에 사용한 TXT/CNAME을 비활성화해 전송이 성립하지 않게 함.',
    'rua.stop.b.title.html': '<strong>B:</strong> 수신은 하되 폐기(비용 증가, 최후의 수단)',
    'rua.stop.b.detail': '도착 즉시 폐기. 중지 보장은 강하지만 네트워크/처리 비용이 증가합니다.',

    'rua.ui.title': 'UI(대시보드 상단 고정)',
    'rua.ui.li1': '남은 기간: “◯일 남음”',
    'rua.ui.li2': '계속 사용 버튼: “계속 사용”',
    'rua.ui.li3': '즉시 중지 버튼: “지금 중지”',
    'rua.ui.li4': '상태는 항상 첫 화면에서 보이고, 스크롤해도 상단에 고정 표시됩니다.',

    'rua.links.back': '← 빠른 진단으로 돌아가기',
    'rua.links.spec': '서비스 사양',
    'rua.strategy.title': '기본 방향',
    'rua.strategy.body': 'DMARC에서 RUA 서비스가 맡는 역할을 명확히 하고, 보고서 수신부터 XML 분석과 결과 평가까지 전체 과정을 안전하게 설계합니다. 개인정보 보호와 악용 방지를 가장 먼저 고려합니다.',
    'rua.keypoints.title': '핵심 포인트',
    'rua.keypoints.li1': 'RUA는 집계 보고서를 받을 mailto URI를 지정하는 DMARC 태그입니다.',
    'rua.keypoints.li2': 'RUA 서비스는 보고서 메일을 수신하고 XML을 분석해 결과를 집계한 뒤 자체 또는 외부 대시보드에 표시합니다.',
    'rua.keypoints.li3': '주요 위험은 DNS가 아니라 데이터 처리, 고객 간 데이터 분리, 대용량 파일과 압축 폭탄, 보고서 폭주 같은 악용입니다.',
    'rua.definition.title': '용어 정리',
    'rua.definition.li1.html': 'DMARC에서 <span class="code">rua=</span>는 집계 보고서를 받을 URI 목록입니다. 이 태그가 없으면 집계 보고서가 생성되지 않습니다.',
    'rua.definition.li2': 'RFC 9990은 집계 보고서를 소스 IP와 메시지 수별 인증 및 정렬 결과를 요약한 XML 문서로 정의합니다.',
    'rua.definition.li3.html': '<span class="code">ruf=</span>는 용도가 다릅니다. 개별 메시지 정보를 포함할 수 있는 실패 보고서의 목적지를 지정하므로 개인정보 보호에 더 주의해야 합니다.',
    'rua.priorities.title': '우선순위 체크리스트',
    'rua.priorities.note': 'P0는 필수 보호 조치, P1은 운영 안정성, P2는 사용성과 제품 품질을 뜻합니다.',
    'rua.p0.title.html': '<strong>P0 - 필수 보호 조치</strong>',
    'rua.p0.li1.html': '보고서 데이터를 표시하기 전에 <span class="code">_dmarc4all-verify.&lt;domain&gt;</span>의 TXT 레코드 같은 방법으로 도메인 소유권을 확인합니다.',
    'rua.p0.li2': '메시지 크기, 압축 해제 후 크기, 중첩 압축 깊이, 처리 시간에 제한을 두어 압축 폭탄을 차단합니다.',
    'rua.p0.li3': 'XXE를 비활성화하고 DTD를 거부한 뒤 구조와 의미를 검증하며, 잘못된 XML 보고서는 폐기합니다.',
    'rua.p0.li4': '개인정보 보호와 보관 규칙을 명확히 공개합니다. 원본 XML은 저장하지 않거나 짧게만 보관하고 IP 주소는 민감한 운영 정보로 다룹니다.',
    'rua.p1.title.html': '<strong>P1 - 운영 안정성</strong>',
    'rua.p1.li1': '표준, 익명화(IPv4 /24 및 IPv6 /48), 집계 전용 등 데이터 최소화 모드를 제공합니다.',
    'rua.p1.li2': '행 단위 분리, 암호화, 접근 제어, 감사 로그로 고객 간 데이터를 격리합니다.',
    'rua.p1.li3': 'RFC 9990 제8절의 보안 고려사항에 따라 속도 제한과 보고서 폭주 탐지를 적용합니다.',
    'rua.p1.li4': '수신자가 보고한 관측값임을 명확히 표시하고 SPF, DKIM, 정렬 결과를 각각 나누어 보여 줍니다.',
    'rua.p2.title.html': '<strong>P2 - 사용성과 제품 품질</strong>',
    'rua.p2.li1': '복사해서 사용할 수 있는 DMARC 예시(p=none; rua=mailto:...)와 단계별 적용 안내를 제공합니다.',
    'rua.p2.li2': 'JSON 또는 CSV 내보내기에 보고 조직, 대상 기간, 분석 시각, 도구 버전을 포함합니다.',
    'rua.p2.li3': '보고서 메일의 DKIM 또는 SPF 결과 같은 신뢰 신호를 선택적으로 표시하고, 알려진 보고 조직과 미확인 조직을 구분합니다.',

  });

  // Spanish
  add('es', {
    'rua.pageTitle': 'Toppy DNS / Especificación del servicio RUA',
    'rua.pill': 'Servicio RUA (informes agregados DMARC) — Especificación clave',
    'rua.h1': 'Endpoint RUA / diseño de parada / manejo de datos',
    'rua.tagline': 'La prueba gratuita se detiene automáticamente a los 30 días. Para continuar se requiere un consentimiento expreso. Una vez detenida, el servicio no recibirá nuevos informes RUA.',

    'rua.setup.title': 'Cómo configurar RUA (lado del cliente)',
    'rua.setup.intro.html': 'Configura el destino RUA emitido por este servicio (<span class="code">mailto:</span>) en el parámetro <span class="code">rua=</span> de tu registro DMARC. <strong>Mantén tu configuración DMARC existente (p= / sp= / adkim= / aspf=, etc.)</strong> y solo añade (o actualiza) <span class="code">rua=</span>.',
    'rua.setup.step1.html': '<strong>1)</strong> Edita el registro DMARC de tu dominio (normalmente <span class="code">_dmarc</span>).',
    'rua.setup.step2.html': '<strong>2)</strong> Añade (o actualiza) <span class="code">rua=mailto:{RUA_EMAIL}</span>.',
    'rua.setup.step3.html': '<strong>3)</strong> Algunos receptores exigen un registro DNS que autorice destinos RUA externos, como se describe en la sección 4 de RFC 9990. En ese caso, <strong>el servicio publica automáticamente el TXT necesario bajo nuestro dominio</strong>; no tienes que modificar tu DNS.',
    'rua.setup.step4.html': '<strong>4)</strong> Tras la propagación DNS, los informes suelen empezar a llegar en 24–48 horas.',
    'rua.setup.note': 'Nota: si ya tienes un registro DMARC, mantén tus tags/política actuales y añade solo rua= (se permiten múltiples destinos mailto).',

    'rua.disclaimer.title': 'Descargo de responsabilidad',
    'rua.disclaimer.body': 'La prueba gratuita dura 30 días y solo continúa con consentimiento expreso. El servicio se presta con el máximo esfuerzo razonable, sujeto a límites de uso razonable y sin SLA.',

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
    'rua.risk.mitigate.html': 'Para minimizar el riesgo aplicamos <strong>minimización de datos (sin almacenar XML en bruto)</strong>, <strong>acceso con privilegios mínimos</strong>, <strong>procesamiento automatizado</strong>, <strong>solo agregación mínima irreversible</strong> y <strong>borrado y cese de recepción al finalizar</strong>.',

    'rua.data.title': 'Manejo de datos (sin almacenamiento / automatizado)',
    'rua.data.li1': 'No almacenamos el XML RUA en bruto (sin persistencia).',
    'rua.data.li2': 'No asumimos revisión humana de informes individuales.',
    'rua.data.li3': 'Solo generamos agregados irreversibles mínimos para pantalla/recomendaciones y descartamos el origen.',
    'rua.data.li4': 'Al detener el servicio, borramos cualquier dato almacenado (si existe) y dejamos de recibir nuevos informes.',
    'rua.data.note': '“Agregación irreversible” significa que no se puede reconstruir un informe individual (p. ej., totales diarios). Si no es necesario, se diseña para no guardar agregados.',

    'rua.gdpr.title': 'Privacidad / GDPR (resumen)',
    'rua.gdpr.intro': 'Resumen de lo que deben saber los usuarios y cómo tratamos los datos conforme al GDPR (no es asesoría legal).',

    'rua.gdpr.user.title': 'Lo que debes tener en cuenta (importante)',
    'rua.gdpr.user.li1': 'Autoridad y legalidad: úsalo solo para dominios que controles o con permiso explícito (configurar RUA es una acción administrativa).',
    'rua.gdpr.user.li2': 'Posibles datos personales: IPs de origen y a veces emails de contacto pueden aparecer y ser datos personales según el contexto. Define tu base legal según tu política.',
    'rua.gdpr.user.li3': 'Trátalo como confidencial: sin cuerpos, pero expone patrones operativos. Recomendamos tratarlo como información confidencial.',
    'rua.gdpr.user.li4': 'Parada y borrado: al detener el servicio, dejamos de recibir informes y borramos los datos de forma predeterminada. Retira también el destino RUA del DNS (véase más abajo) para evitar nuevos envíos.',

    'rua.gdpr.us.title': 'Qué hacemos (puntos clave)',
    'rua.gdpr.us.li1': 'Minimización: sin XML en bruto; solo agregación mínima irreversible.',
    'rua.gdpr.us.li2': 'Sin uso secundario: no se usa para publicidad/marketing (RUA no sirve para eso y no retenemos datos por informe que lo habiliten).',
    'rua.gdpr.us.li3': 'Seguridad: controles de acceso, mínimo privilegio, cifrado, etc. para proteger confidencialidad e integridad.',
    'rua.gdpr.us.li4': 'Gestión de subprocesadores: si usamos proveedores, se gestionan con términos alineados a GDPR (p. ej., DPA).',
    'rua.gdpr.us.li5': 'Borrado y cooperación: apoyamos solicitudes de borrado/derechos vía el controller (cliente).',

    'rua.roles.title': 'Funciones (Responsable / Encargado del tratamiento)',
    'rua.roles.li1.html': '<strong>Cliente (tú o tu organización):</strong> normalmente actúa como <strong>Responsable del tratamiento</strong>, ya que decide los fines y medios de recepción y análisis de RUA.',
    'rua.roles.li2.html': '<strong>Proveedor del servicio:</strong> normalmente actúa como <strong>Encargado del tratamiento</strong> y procesa los datos siguiendo instrucciones documentadas (DPA/contrato).',

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
    'rua.legal.li1.html': '<strong>Responsable del tratamiento (cliente):</strong> según el uso, la base jurídica suele ser el interés legítimo para proteger la seguridad (GDPR 6(1)(f)) o la ejecución de un contrato (6(1)(b)).',
    'rua.legal.li2.html': '<strong>Encargado del tratamiento (este servicio):</strong> trata los datos conforme al contrato o DPA y a las instrucciones documentadas del cliente (GDPR 28).',
    'rua.legal.note': 'Depende del caso de uso y política interna. En avisos formales, define tu base legal.',

    'rua.retention.title': 'Retención y borrado',
    'rua.retention.li1.html': '<strong>XML RUA en bruto:</strong> no se almacena; se descarta tras el procesamiento.',
    'rua.retention.li2.html': '<strong>Agregados irreversibles:</strong> solo lo necesario; se borran hasta <strong>30 días (fin de prueba)</strong> si no se continúa (objetivo de diseño).',
    'rua.retention.li3.html': '<strong>Al detener el servicio:</strong> se borran los datos relacionados de forma predeterminada y dejan de recibirse nuevos informes.',

    'rua.subprocessors.title': 'Terceros / subprocesadores',
    'rua.subprocessors.body.html': 'Si usamos proveedores para hosting/almacenamiento/monitorización, pueden ser subprocesadores GDPR. En producción, proporcionamos una <strong>lista de proveedores (nombre/país/finalidad)</strong> y acordamos términos adecuados (DPA, SCC, etc.) cuando aplique.',

    'rua.transfer.title': 'Transferencias internacionales (fuera del EEE)',
    'rua.transfer.body': 'Si los datos pueden transferirse fuera del EEE, aplicamos salvaguardas adecuadas como SCC, según corresponda.',

    'rua.rights.title': 'Derechos del interesado (canal de solicitud)',
    'rua.rights.li1': 'Acceso, rectificación, supresión, limitación, oposición, portabilidad, etc. (según aplique)',
    'rua.rights.li2.html': 'Las solicitudes suelen dirigirse primero al <strong>responsable del tratamiento, es decir, al cliente</strong>. Como encargado del tratamiento, colaboramos cuando el responsable lo solicita.',

    'rua.contact.title': 'Contacto',
    'rua.contact.body.html': 'Consultas de privacidad/tratamiento: <strong>privacy@toppymicros.com</strong><br>Operador: <strong>ToppyMicroServices OÜ</strong> (dominio: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'Reclamaciones',
    'rua.complaints.body': 'Los residentes en la UE/EEE tienen derecho a presentar una reclamación ante su autoridad de control (SA).',

    'rua.trial.title': 'Prueba y parada (puntos clave)',
    'rua.trial.li1.html': '<strong>Inicio de prueba:</strong> primera recepción (activación) exitosa de RUA',
    'rua.trial.li2.html': '<strong>Fin de prueba:</strong> 30 días después del inicio (mostrar días restantes)',
    'rua.trial.li3.html': '<strong>Continuar:</strong> consentimiento expreso con un clic en «Mantener activado»',
    'rua.trial.li4.html': '<strong>Por defecto:</strong> se detiene automáticamente el día 30 si no se confirma la continuidad',
    'rua.trial.li5.html': '<strong>Datos al parar:</strong> borrado por defecto (opcional: métricas anónimas)',

    'rua.stop.title': 'Cómo detener RUA tras la terminación',
    'rua.stop.intro': 'Orden recomendado:',
    'rua.stop.a.title.html': '<strong>A (recomendado):</strong> desactivar el DNS de autorización RUA externo para que los remitentes no puedan entregar',
    'rua.stop.a.detail': 'Ejemplo: desactivar el TXT/CNAME usado para autorizar el destino RUA para que la entrega no pueda completarse.',
    'rua.stop.b.title.html': '<strong>B:</strong> aceptar pero descartar (más coste; último recurso)',
    'rua.stop.b.detail': 'Descartar al llegar. Garantiza la parada, pero incrementa costes de red/procesamiento.',

    'rua.ui.title': 'UI (fijado arriba del panel)',
    'rua.ui.li1': 'Tiempo restante: «Quedan ◯ días»',
    'rua.ui.li2': 'Botón de continuidad: «Mantener activado»',
    'rua.ui.li3': 'Botón de parada inmediata: «Detener ahora»',
    'rua.ui.li4': 'El estado se mantiene visible y fijo al hacer scroll.',

    'rua.links.back': '← Volver a la comprobación rápida',
    'rua.links.spec': 'Especificación del servicio',
    'rua.strategy.title': 'Enfoque',
    'rua.strategy.body': 'Definir el papel de un servicio RUA en DMARC y proteger todo el proceso de recepción, análisis del XML y evaluación de los datos. La privacidad y la resistencia frente a abusos son prioritarias.',
    'rua.keypoints.title': 'Puntos clave',
    'rua.keypoints.li1': 'RUA es la etiqueta de DMARC que indica las direcciones de destino de los informes agregados mediante URI mailto.',
    'rua.keypoints.li2': 'Un servicio RUA recibe los mensajes con informes, analiza el XML, agrega las métricas y presenta los resultados en un panel propio o de un tercero.',
    'rua.keypoints.li3': 'El riesgo principal no está en el DNS, sino en el tratamiento de datos, el aislamiento entre clientes y los abusos, como archivos demasiado grandes, bombas de descompresión o avalanchas de informes.',
    'rua.definition.title': 'Definiciones',
    'rua.definition.li1.html': 'En DMARC, <span class="code">rua=</span> contiene la lista de URI a las que se envían los informes agregados. Si se omite, no se generan esos informes.',
    'rua.definition.li2': 'RFC 9990 define los informes agregados como documentos XML que resumen los resultados de autenticación y alineación por IP de origen y número de mensajes.',
    'rua.definition.li3.html': '<span class="code">ruf=</span> tiene otra finalidad: indica el destino de informes de fallos que pueden contener datos de mensajes concretos y requieren mayores precauciones de privacidad.',
    'rua.priorities.title': 'Lista de prioridades',
    'rua.priorities.note': 'P0 reúne las salvaguardas esenciales, P1 la resistencia operativa y P2 la usabilidad y la calidad del producto.',
    'rua.p0.title.html': '<strong>P0 - Salvaguardas esenciales</strong>',
    'rua.p0.li1.html': 'Verificar la titularidad del dominio, por ejemplo mediante un TXT en <span class="code">_dmarc4all-verify.&lt;domain&gt;</span>, antes de mostrar datos de los informes.',
    'rua.p0.li2': 'Proteger la recepción con límites de tamaño, tamaño descomprimido, profundidad de archivos anidados y tiempo de proceso para bloquear bombas de descompresión.',
    'rua.p0.li3': 'Analizar el XML de forma segura: deshabilitar XXE, rechazar DTD, validar la estructura y el significado de los datos, y descartar informes incorrectos.',
    'rua.p0.li4': 'Publicar reglas claras de privacidad y conservación. No guardar el XML original o conservarlo solo durante un periodo breve, y tratar las direcciones IP como datos operativos sensibles.',
    'rua.p1.title.html': '<strong>P1 - Resistencia operativa</strong>',
    'rua.p1.li1': 'Ofrecer modos de minimización de datos: estándar, anonimizado (IPv4 /24 e IPv6 /48) o solo agregados.',
    'rua.p1.li2': 'Aplicar aislamiento entre clientes y controles de acceso mediante separación por filas, cifrado y registros de auditoría.',
    'rua.p1.li3': 'Aplicar límites de frecuencia y detectar avalanchas de informes de acuerdo con las consideraciones de seguridad de la sección 8 de RFC 9990.',
    'rua.p1.li4': 'Indicar claramente que son observaciones comunicadas por los receptores y mostrar por separado los resultados de SPF, DKIM y alineación.',
    'rua.p2.title.html': '<strong>P2 - Usabilidad y calidad</strong>',
    'rua.p2.li1': 'Fragmentos DMARC listos para copiar (por ejemplo, p=none; rua=mailto:...) con guía de despliegue gradual.',
    'rua.p2.li2': 'Incluir en las exportaciones JSON o CSV la organización informante, el periodo, la hora de análisis y la versión de la herramienta.',
    'rua.p2.li3': 'Mostrar opcionalmente señales de autenticidad, como los resultados DKIM o SPF de los mensajes con informes, y distinguir las organizaciones conocidas de las desconocidas.',

  });

  // German
  add('de', {
    'rua.pageTitle': 'Toppy DNS / RUA Service-Spezifikation',
    'rua.pill': 'RUA (DMARC Aggregate Reports) Service — Kernauszug',
    'rua.h1': 'RUA-Endpunkt / Stop-Design / Datenverarbeitung',
    'rua.tagline': 'Der kostenlose Test endet automatisch nach 30 Tagen. Für die Fortsetzung ist eine ausdrückliche Zustimmung erforderlich. Danach werden keine neuen RUA-Berichte mehr empfangen.',

    'rua.setup.title': 'RUA einrichten (Kundenseite)',
    'rua.setup.intro.html': 'Tragen Sie das von diesem Service ausgegebene RUA-Ziel (<span class="code">mailto:</span>) in den <span class="code">rua=</span>-Tag Ihres DMARC-Records ein. <strong>Behalten Sie Ihre bestehenden DMARC-Einstellungen (p= / sp= / adkim= / aspf= usw.) bei</strong> und fügen Sie nur <span class="code">rua=</span> hinzu (oder aktualisieren Sie es).',
    'rua.setup.step1.html': '<strong>1)</strong> Bearbeiten Sie den DMARC-Record Ihrer Domain (typischerweise <span class="code">_dmarc</span>).',
    'rua.setup.step2.html': '<strong>2)</strong> Fügen Sie <span class="code">rua=mailto:{RUA_EMAIL}</span> hinzu (oder aktualisieren Sie es).',
    'rua.setup.step3.html': '<strong>3)</strong> Manche Empfänger verlangen einen DNS-Eintrag zur Autorisierung externer RUA-Ziele, wie in Abschnitt 4 von RFC 9990 beschrieben. In diesem Fall <strong>veröffentlicht der Dienst den benötigten TXT-Eintrag automatisch unter unserer Domain</strong>; an Ihrem DNS sind keine Änderungen nötig.',
    'rua.setup.step4.html': '<strong>4)</strong> Nach DNS-Propagation beginnen Reports typischerweise innerhalb von 24–48 Stunden einzutreffen.',
    'rua.setup.note': 'Hinweis: Wenn bereits ein DMARC-Record existiert, behalten Sie Policy/Tags bei und ergänzen nur rua= (mehrere mailto-Ziele sind möglich).',

    'rua.disclaimer.title': 'Haftungsausschluss',
    'rua.disclaimer.body': 'Der kostenlose Test dauert 30 Tage und wird nur mit ausdrücklicher Zustimmung fortgesetzt. Der Dienst wird nach bestem Bemühen, mit Fair-Use-Grenzen und ohne SLA bereitgestellt.',

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
    'rua.gdpr.us.li4': 'Unterauftragnehmer: Beim Einsatz externer Anbieter gelten DSGVO-konforme Vereinbarungen, beispielsweise ein DPA.',
    'rua.gdpr.us.li5': 'Löschung und Unterstützung: Wir unterstützen den Verantwortlichen, also den Kunden, bei Lösch- und Betroffenenanfragen.',

    'rua.roles.title': 'Rollen (Verantwortlicher / Auftragsverarbeiter)',
    'rua.roles.li1.html': '<strong>Kunde (Sie oder Ihre Organisation):</strong> ist in der Regel der <strong>Verantwortliche (Controller)</strong>, weil er Zweck und Mittel des Empfangs und der Auswertung von RUA festlegt.',
    'rua.roles.li2.html': '<strong>Dienstanbieter:</strong> ist in der Regel der <strong>Auftragsverarbeiter (Processor)</strong> und verarbeitet Daten nach dokumentierten Weisungen im DPA oder Vertrag.',

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
    'rua.legal.li1.html': '<strong>Verantwortlicher (Kunde):</strong> Je nach Nutzung kommen häufig das berechtigte Interesse an der Sicherheit (DSGVO Art. 6 Abs. 1 lit. f) oder die Vertragserfüllung (lit. b) in Betracht.',
    'rua.legal.li2.html': '<strong>Auftragsverarbeiter (dieser Dienst):</strong> verarbeitet Daten auf Grundlage des Vertrags oder DPA und nach dokumentierten Weisungen des Kunden (DSGVO Art. 28).',
    'rua.legal.note': 'Abhängig vom Use Case und interner Policy. Für formale Notices definieren Sie Ihre Grundlage entsprechend.',

    'rua.retention.title': 'Aufbewahrung & Löschung',
    'rua.retention.li1.html': '<strong>Rohe RUA-XML:</strong> wird nicht gespeichert; nach Verarbeitung verworfen.',
    'rua.retention.li2.html': '<strong>Irreversible Aggregate:</strong> nur soweit nötig; Löschung bis <strong>30 Tage (Ende Test)</strong> bei Nicht-Fortsetzung (Designziel).',
    'rua.retention.li3.html': '<strong>Nach Stop:</strong> Standardmäßig Löschung und Intake-Stop.',

    'rua.subprocessors.title': 'Dritte und Unterauftragnehmer',
    'rua.subprocessors.body.html': 'Wenn wir externe Anbieter für Hosting, Speicherung oder Überwachung einsetzen, können diese DSGVO-Unterauftragnehmer sein. Im Produktivbetrieb stellen wir eine <strong>Liste mit Name, Land und Zweck jedes Anbieters</strong> bereit und vereinbaren bei Bedarf DPA, SCC oder andere geeignete Bedingungen.',

    'rua.transfer.title': 'Internationale Transfers (außerhalb EWR)',
    'rua.transfer.body': 'Wenn Daten außerhalb des EWR übertragen werden könnten, setzen wir angemessene Schutzmaßnahmen wie SCC ein.',

    'rua.rights.title': 'Betroffenenrechte (Anfragekanal)',
    'rua.rights.li1': 'Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Portabilität usw. (soweit anwendbar)',
    'rua.rights.li2.html': 'Anfragen richten sich in der Regel zuerst an den <strong>Verantwortlichen, also den Kunden</strong>. Als Auftragsverarbeiter unterstützen wir ihn auf Anfrage.',

    'rua.contact.title': 'Kontakt',
    'rua.contact.body.html': 'Anfragen zu Datenschutz/Datenverarbeitung: <strong>privacy@toppymicros.com</strong><br>Betreiber: <strong>ToppyMicroServices OÜ</strong> (Domain: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'Beschwerden',
    'rua.complaints.body': 'EU/EWR-Bewohner haben das Recht, sich bei ihrer zuständigen Aufsichtsbehörde (SA) zu beschweren.',

    'rua.trial.title': 'Test & Stop (Kernpunkte)',
    'rua.trial.li1.html': '<strong>Test startet:</strong> erster erfolgreicher RUA-Intake (Aktivierung)',
    'rua.trial.li2.html': '<strong>Test endet:</strong> 30 Tage nach Start (UI zeigt Resttage)',
    'rua.trial.li3.html': '<strong>Fortsetzen:</strong> ausdrückliche Zustimmung mit einem Klick auf „Aktiviert lassen“',
    'rua.trial.li4.html': '<strong>Standard:</strong> automatische Beendigung nach 30 Tagen, wenn die Fortsetzung nicht bestätigt wird',
    'rua.trial.li5.html': '<strong>Daten beim Stop:</strong> Standardmäßig gelöscht (optional anonyme Service-Metriken)',

    'rua.stop.title': 'Wie man RUA nach Beendigung stoppt',
    'rua.stop.intro': 'Empfohlene Reihenfolge:',
    'rua.stop.a.title.html': '<strong>A (empfohlen):</strong> externes RUA-Autorisierungs-DNS deaktivieren, damit Sender nicht zustellen können',
    'rua.stop.a.detail': 'Beispiel: TXT/CNAME deaktivieren, das zur Autorisierung des RUA-Ziels genutzt wird, damit Zustellung nicht erfolgreich sein kann.',
    'rua.stop.b.title.html': '<strong>B:</strong> annehmen, aber verwerfen (höhere Kosten; letzter Ausweg)',
    'rua.stop.b.detail': 'Beim Eingang verwerfen. Starker Stop, aber höhere Netzwerk-/Verarbeitungskosten.',

    'rua.ui.title': 'UI (oben im Dashboard fixiert)',
    'rua.ui.li1': 'Restlaufzeit: „Noch ◯ Tage“',
    'rua.ui.li2': 'Fortsetzen: „Aktiviert lassen“',
    'rua.ui.li3': 'Sofort-Stopp: „Jetzt stoppen“',
    'rua.ui.li4': 'Status bleibt above-the-fold sichtbar und beim Scrollen fixiert.',

    'rua.links.back': '← Zurück zur Schnellprüfung',
    'rua.links.spec': 'Dienstbeschreibung',
    'rua.strategy.title': 'Grundsatz',
    'rua.strategy.body': 'Die Rolle eines RUA-Dienstes in DMARC klar definieren und den gesamten Ablauf von Empfang, XML-Verarbeitung und Auswertung absichern. Datenschutz und Schutz vor Missbrauch haben Vorrang.',
    'rua.keypoints.title': 'Kernpunkte',
    'rua.keypoints.li1': 'RUA ist das DMARC-Tag, das die Ziele für aggregierte Berichte als mailto-URIs angibt.',
    'rua.keypoints.li2': 'Ein RUA-Dienst empfängt Berichtsmails, verarbeitet das XML, fasst Messwerte zusammen und stellt die Ergebnisse in einem eigenen oder externen Dashboard dar.',
    'rua.keypoints.li3': 'Das Hauptrisiko liegt nicht im DNS, sondern in der Datenverarbeitung, der Mandantentrennung und möglichen Angriffen wie übergroßen Dateien, ZIP-Bomben oder einer Flut von Berichten.',
    'rua.definition.title': 'Begriffe',
    'rua.definition.li1.html': 'In DMARC enthält <span class="code">rua=</span> die Liste der URIs, an die aggregierte Berichte gesendet werden. Fehlt das Tag, werden keine solchen Berichte erzeugt.',
    'rua.definition.li2': 'RFC 9990 definiert aggregierte Berichte als XML-Dokumente, die Authentifizierungs- und Alignment-Ergebnisse nach Quell-IP und Nachrichtenanzahl zusammenfassen.',
    'rua.definition.li3.html': '<span class="code">ruf=</span> hat einen anderen Zweck: Es nennt Ziele für Fehlerberichte, die Angaben zu einzelnen Nachrichten enthalten können und deshalb datenschutzrechtlich sensibler sind.',
    'rua.priorities.title': 'Priorisierte Checkliste',
    'rua.priorities.note': 'P0 umfasst unverzichtbare Schutzmaßnahmen, P1 die betriebliche Widerstandsfähigkeit und P2 Bedienbarkeit und Produktqualität.',
    'rua.p0.title.html': '<strong>P0 - Unverzichtbare Schutzmaßnahmen</strong>',
    'rua.p0.li1.html': 'Die Domaininhaberschaft, beispielsweise mit einem TXT-Eintrag unter <span class="code">_dmarc4all-verify.&lt;domain&gt;</span>, prüfen, bevor Berichtsdaten angezeigt werden.',
    'rua.p0.li2': 'Den Empfang durch Grenzen für Nachrichten- und entpackte Größen, die Tiefe verschachtelter Archive und die Verarbeitungszeit gegen ZIP-Bomben absichern.',
    'rua.p0.li3': 'XML sicher verarbeiten: XXE deaktivieren, DTDs ablehnen, Struktur und Bedeutung prüfen und fehlerhafte Berichte verwerfen.',
    'rua.p0.li4': 'Klare Datenschutz- und Aufbewahrungsregeln veröffentlichen. Rohes XML gar nicht oder nur kurz speichern und IP-Adressen als sensible Betriebsdaten behandeln.',
    'rua.p1.title.html': '<strong>P1 - Betriebliche Widerstandsfähigkeit</strong>',
    'rua.p1.li1': 'Modi zur Datenminimierung anbieten: Standard, anonymisiert (IPv4 /24 und IPv6 /48) oder nur Aggregate.',
    'rua.p1.li2': 'Mandanten durch Datentrennung, Verschlüsselung, Zugriffssteuerung und Audit-Protokolle voneinander isolieren.',
    'rua.p1.li3': 'Ratenbegrenzung und Fluterkennung gemäß den Sicherheitshinweisen in Abschnitt 8 von RFC 9990 umsetzen.',
    'rua.p1.li4': 'Die Daten klar als von Empfängern gemeldete Beobachtungen kennzeichnen und SPF-, DKIM- und Alignment-Ergebnisse getrennt darstellen.',
    'rua.p2.title.html': '<strong>P2 - Bedienbarkeit und Produktqualität</strong>',
    'rua.p2.li1': 'Kopierfertige DMARC-Beispiele (z. B. p=none; rua=mailto:...) mit Anleitung für die schrittweise Einführung.',
    'rua.p2.li2': 'Exporte (JSON/CSV) mit Metadaten: berichtende Organisation, Zeitraum, Parse-Zeitstempel, Tool-Version.',
    'rua.p2.li3': 'Optional Echtheitssignale wie DKIM- oder SPF-Ergebnisse der Berichtsmails anzeigen und bekannte von unbekannten Berichtsquellen unterscheiden.',

  });

  // Russian
  add('ru', {
    'rua.pageTitle': 'Toppy DNS / Спецификация сервиса RUA',
    'rua.pill': 'Сервис RUA (агрегированные отчеты DMARC) — краткая спецификация',
    'rua.h1': 'RUA endpoint / дизайн остановки / обработка данных',
    'rua.tagline': 'Бесплатный пробный период автоматически завершается через 30 дней. Для продолжения требуется явное подтверждение. После остановки новые отчёты RUA не принимаются.',

    'rua.setup.title': 'Как настроить RUA (со стороны клиента)',
    'rua.setup.intro.html': 'Укажите выданный этим сервисом адрес RUA (<span class="code">mailto:</span>) в параметре <span class="code">rua=</span> вашего DMARC-записа. <strong>Сохраните существующие настройки DMARC (p= / sp= / adkim= / aspf= и т. д.)</strong> и добавьте (или обновите) только <span class="code">rua=</span>.',
    'rua.setup.step1.html': '<strong>1)</strong> Отредактируйте DMARC-запись домена (обычно <span class="code">_dmarc</span>).',
    'rua.setup.step2.html': '<strong>2)</strong> Добавьте (или обновите) <span class="code">rua=mailto:{RUA_EMAIL}</span>.',
    'rua.setup.step3.html': '<strong>3)</strong> Некоторые получатели требуют DNS-запись для авторизации внешнего адреса RUA, как описано в разделе 4 RFC 9990. В этом случае <strong>сервис автоматически публикует нужную TXT-запись в нашем домене</strong>; менять DNS с вашей стороны не требуется.',
    'rua.setup.step4.html': '<strong>4)</strong> После распространения DNS отчеты обычно начинают поступать в течение 24–48 часов.',
    'rua.setup.note': 'Примечание: если DMARC-запись уже есть, сохраните текущие теги/политику и добавьте только rua= (возможны несколько адресов mailto).',

    'rua.disclaimer.title': 'Отказ от ответственности',
    'rua.disclaimer.body': 'Бесплатный пробный период длится 30 дней и продолжается только после явного подтверждения. Сервис предоставляется на основе разумных усилий, с ограничениями добросовестного использования и без SLA.',

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

    'rua.roles.title': 'Роли (контролёр / обработчик данных)',
    'rua.roles.li1.html': '<strong>Клиент (вы или ваша организация):</strong> обычно выступает <strong>контролёром данных (Controller)</strong>, поскольку определяет цели и способы получения и анализа RUA.',
    'rua.roles.li2.html': '<strong>Поставщик сервиса:</strong> обычно выступает <strong>обработчиком данных (Processor)</strong> и действует по документированным указаниям в DPA или договоре.',

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
    'rua.legal.li1.html': '<strong>Контролёр данных (клиент):</strong> в зависимости от цели основанием обычно служит законный интерес в обеспечении безопасности (GDPR 6(1)(f)) или исполнение договора (6(1)(b)).',
    'rua.legal.li2.html': '<strong>Обработчик данных (этот сервис):</strong> обрабатывает данные на основании договора или DPA и документированных указаний клиента (GDPR 28).',
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
    'rua.rights.li2.html': 'Запросы обычно сначала направляются <strong>контролёру данных, то есть клиенту</strong>. Как обработчик данных мы оказываем содействие по его запросу.',

    'rua.contact.title': 'Контакты',
    'rua.contact.body.html': 'Вопросы по конфиденциальности/обработке данных: <strong>privacy@toppymicros.com</strong><br>Оператор: <strong>ToppyMicroServices OÜ</strong> (домен: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'Жалобы',
    'rua.complaints.body': 'Жители ЕС/ЕЭЗ имеют право подать жалобу в местный надзорный орган (SA).',

    'rua.trial.title': 'Пробный период и остановка (ключевые пункты)',
    'rua.trial.li1.html': '<strong>Старт пробного периода:</strong> первое успешное принятие RUA (активация)',
    'rua.trial.li2.html': '<strong>Конец пробного периода:</strong> через 30 дней после старта (UI показывает оставшиеся дни)',
    'rua.trial.li3.html': '<strong>Продолжить:</strong> явное согласие одним нажатием кнопки «Оставить включённым»',
    'rua.trial.li4.html': '<strong>По умолчанию:</strong> автоматическая остановка на 30-й день, если продолжение не подтверждено',
    'rua.trial.li5.html': '<strong>Данные при остановке:</strong> по умолчанию удаляются (опционально — только анонимные метрики)',

    'rua.stop.title': 'Как остановить RUA после прекращения',
    'rua.stop.intro': 'Рекомендуемый порядок:',
    'rua.stop.a.title.html': '<strong>A (рекомендуется):</strong> отключить DNS-авторизацию внешнего RUA, чтобы отправители не могли доставлять',
    'rua.stop.a.detail': 'Пример: отключить TXT/CNAME, используемый для авторизации назначения RUA, чтобы доставка не могла завершиться.',
    'rua.stop.b.title.html': '<strong>B:</strong> принимать, но удалять (дороже; крайний вариант)',
    'rua.stop.b.detail': 'Удалять при получении. Сильная гарантия остановки, но выше затраты на сеть/обработку.',

    'rua.ui.title': 'UI (фиксируется сверху дашборда)',
    'rua.ui.li1': 'Оставшееся время: «Осталось ◯ дней»',
    'rua.ui.li2': 'Кнопка продолжения: «Оставить включённым»',
    'rua.ui.li3': 'Кнопка немедленной остановки: «Остановить сейчас»',
    'rua.ui.li4': 'Статус всегда виден в первом экране и остается закрепленным при прокрутке.',

    'rua.links.back': '← Назад к быстрой проверке',
    'rua.links.spec': 'Спецификация сервиса',
    'rua.strategy.title': 'Подход',
    'rua.strategy.body': 'Чётко определить роль сервиса RUA в DMARC и защитить весь процесс: от приёма отчёта и разбора XML до анализа результатов. Приоритет отдается конфиденциальности и защите от злоупотреблений.',
    'rua.keypoints.title': 'Ключевые пункты',
    'rua.keypoints.li1': 'RUA — это тег DMARC со списком mailto URI, на которые отправляются агрегированные отчёты.',
    'rua.keypoints.li2': 'Сервис RUA принимает письма с отчётами, разбирает XML, сводит результаты и отображает их на собственном или стороннем портале.',
    'rua.keypoints.li3': 'Главный риск связан не с DNS, а с обработкой и разделением данных клиентов, а также с атаками через слишком большие файлы, архивные бомбы или поток отчётов.',
    'rua.definition.title': 'Термины',
    'rua.definition.li1.html': 'В DMARC параметр <span class="code">rua=</span> содержит список URI для доставки агрегированных отчётов. Если тега нет, такие отчёты не формируются.',
    'rua.definition.li2': 'RFC 9990 определяет агрегированные отчёты как XML-документы, которые суммируют результаты аутентификации и выравнивания по IP-адресам источников и количеству сообщений.',
    'rua.definition.li3.html': '<span class="code">ruf=</span> служит другой цели: он задаёт адреса отчётов об ошибках, которые могут содержать сведения об отдельных сообщениях и требуют более строгой защиты конфиденциальности.',
    'rua.priorities.title': 'Приоритеты',
    'rua.priorities.note': 'P0 — обязательные меры защиты, P1 — эксплуатационная устойчивость, P2 — удобство и качество продукта.',
    'rua.p0.title.html': '<strong>P0 - Обязательные меры защиты</strong>',
    'rua.p0.li1.html': 'Подтвердить владение доменом, например с помощью TXT-записи <span class="code">_dmarc4all-verify.&lt;domain&gt;</span>, до показа данных отчётов.',
    'rua.p0.li2': 'Ограничить размер сообщений, объём после распаковки, глубину вложенных архивов и время обработки, чтобы блокировать архивные бомбы.',
    'rua.p0.li3': 'Безопасно разбирать XML: отключить XXE, запретить DTD, проверить структуру и смысл данных и отбросить некорректные отчёты.',
    'rua.p0.li4': 'Опубликовать чёткие правила конфиденциальности и хранения. Не сохранять исходный XML или хранить его недолго, а IP-адреса считать чувствительными эксплуатационными данными.',
    'rua.p1.title.html': '<strong>P1 - Эксплуатационная устойчивость</strong>',
    'rua.p1.li1': 'Предусмотреть режимы минимизации данных: стандартный, анонимизированный (IPv4 /24 и IPv6 /48) или только агрегаты.',
    'rua.p1.li2': 'Разделять данные клиентов с помощью построчной изоляции, шифрования, контроля доступа и журналов аудита.',
    'rua.p1.li3': 'Применять ограничение частоты и обнаружение потока отчётов с учётом положений о безопасности в разделе 8 RFC 9990.',
    'rua.p1.li4': 'Ясно обозначать данные как наблюдения, предоставленные принимающей стороной, и раздельно показывать результаты SPF, DKIM и выравнивания.',
    'rua.p2.title.html': '<strong>P2 - Удобство и качество</strong>',
    'rua.p2.li1': 'Готовые к копированию примеры DMARC (например, p=none; rua=mailto:...) и рекомендации по поэтапному внедрению.',
    'rua.p2.li2': 'Включать в экспорт JSON или CSV организацию-отправителя, отчётный период, время анализа и версию инструмента.',
    'rua.p2.li3': 'При необходимости показывать признаки подлинности, например результаты DKIM или SPF письма с отчётом, и отличать известные источники от неизвестных.',

  });

  // Chinese (Simplified)
  add('zh', {
    'rua.pageTitle': 'Toppy DNS / RUA 服务规格',
    'rua.pill': 'RUA（DMARC 汇总报告）服务 — 关键规格',
    'rua.h1': 'RUA 接收端点 / 停止设计 / 数据处理',
    'rua.tagline': '免费试用将在 30 天后自动停止。继续使用前，需要得到明确确认。停止后，服务将不再接收新的 RUA 报告。',

    'rua.setup.title': '如何配置 RUA（客户侧）',
    'rua.setup.intro.html': '将本服务提供的 RUA 接收地址（<span class="code">mailto:</span>）填入 DMARC 记录的 <span class="code">rua=</span><strong>保留你现有的 DMARC 设置（p= / sp= / adkim= / aspf= 等）</strong>，只需添加（或更新）<span class="code">rua=</span>.',
    'rua.setup.step1.html': '<strong>1)</strong> 编辑你的域名 DMARC 记录（通常为 <span class="code">_dmarc</span>）.',
    'rua.setup.step2.html': '<strong>2)</strong> 添加（或更新）<span class="code">rua=mailto:{RUA_EMAIL}</span>.',
    'rua.setup.step3.html': '<strong>3)</strong> 部分接收方会要求使用 DNS 记录授权外部 RUA 目的地址，具体见 RFC 9990 第 4 节。遇到这种情况时，<strong>本服务会自动在我方域名下发布所需的 TXT 记录</strong>，你无需修改自己的 DNS。',
    'rua.setup.step4.html': '<strong>4)</strong> DNS 记录生效后，通常会在 24 至 48 小时内开始收到报告。',
    'rua.setup.note': '注意：如果你已经有 DMARC 记录，请保留现有策略/标签，仅追加 rua=（也可配置多个 mailto 目的地）.',

    'rua.disclaimer.title': '免责声明',
    'rua.disclaimer.body': '免费试用期为 30 天，只有在明确确认后才会继续。服务按尽力而为原则提供，受合理使用限制，不承诺 SLA。',

    'rua.what.title': '什么是 RUA？',
    'rua.what.body': 'RUA 是 DMARC 聚合报告的接收地址。Gmail、Microsoft 和其他邮件接收方通常每天发送一次 XML 汇总，说明使用你域名的邮件通过身份验证的情况。',
    'rua.what.note': '重要：报告不包含邮件正文，但其中的聚合运营数据仍可能较为敏感。',
    'rua.what.ruf.html': '注意：DMARC 还提供 <span class="code">ruf=</span>，用于指定失败报告的接收地址。这类报告可能包含单封邮件的信息，因此必须谨慎处理隐私和合规风险。本服务仅处理 <span class="code">rua=</span> 聚合报告。',

    'rua.contains.title': 'RUA 报告通常包含',
    'rua.contains.li1': '目标域名（被报告的域名）',
    'rua.contains.li2': '来源 IP 与邮件数量（count）',
    'rua.contains.li3': 'SPF / DKIM / DMARC 评估结果（pass/fail 等）',
    'rua.contains.li4': 'From 域名对齐（alignment）结果',
    'rua.contains.li5': '报告周期（begin/end）及报告组织信息',

    'rua.risk.title': '最大风险（重要）',
    'rua.risk.p1.html': 'RUA 不包含邮件正文，但可能暴露<strong>发送基础设施（源 IP、发送量和发送服务）</strong>的线索。一旦泄露，攻击者可能据此了解发送路径，并用于更有针对性的钓鱼或冒充。',
    'rua.risk.p2.html': '因此并非“没有正文就安全”.它可能成为 <strong>组织邮件运维的地图</strong>.',
    'rua.risk.mitigate.html': '为降低风险，我们执行 <strong>数据最小化（不存储原始 XML）</strong>、<strong>最小权限访问控制</strong>、<strong>自动化处理</strong>、<strong>仅保留最小的不可逆汇总</strong>，以及 <strong>终止时删除 + 停止接收</strong>.',

    'rua.data.title': '数据处理（不存储 / 自动化）',
    'rua.data.li1': '不存储原始 RUA XML（无持久化）.',
    'rua.data.li2': '不以人工逐份查看报告为前提（自动处理）.',
    'rua.data.li3': '仅生成展示和改进建议所需的最小不可逆汇总，然后丢弃源数据。',
    'rua.data.li4': '服务停止时删除相关数据（如有），并停止接收后续报告。',
    'rua.data.note': '“不可逆汇总”是指无法还原单份报告内容的数据，例如每日总量。如果运营中不需要这些数据，也可以不保留任何汇总。',

    'rua.gdpr.title': '隐私 / GDPR（摘要）',
    'rua.gdpr.intro': '本节摘要说明用户应了解的要点，以及我们如何按 GDPR 处理数据（非法律建议）.',

    'rua.gdpr.user.title': '用户需要了解（重要）',
    'rua.gdpr.user.li1': '权限与合法性：仅用于你控制或已获明确授权的域名（设置 RUA 目的地属于管理操作）.',
    'rua.gdpr.user.li2': '可能涉及个人数据：源 IP 和联系邮箱在某些情况下可能属于个人数据。请根据内部政策明确相应的合法依据。',
    'rua.gdpr.user.li3': '作为机密信息处理：虽然报告没有邮件正文，但可能暴露运营模式，因此建议按机密信息管理。',
    'rua.gdpr.user.li4': '停止与删除：服务停止后，我们默认停止接收新报告并删除相关数据。还请按照下文说明在 DNS 端完成停止操作。',

    'rua.gdpr.us.title': '我们如何处理（要点）',
    'rua.gdpr.us.li1': '数据最小化：不存储原始 XML，只处理必要的最小不可逆汇总。',
    'rua.gdpr.us.li2': '不作二次用途：不用于广告/营销（RUA 本身不适用于该目的，我们也不保留可用于该目的的按报告数据）.',
    'rua.gdpr.us.li3': '安全措施：通过访问控制、最小权限和加密等措施保护数据的机密性与完整性。',
    'rua.gdpr.us.li4': '受托方管理：如果使用外部供应商，将依据符合 GDPR 的条款（如 DPA）进行管理。',
    'rua.gdpr.us.li5': '删除与协助：对于由数据控制者（客户）提出的删除请求或数据主体权利请求，我们会提供协助。',

    'rua.roles.title': '角色（Controller / Processor）',
    'rua.roles.li1.html': '<strong>客户（你或你的组织）：</strong>通常是<strong>数据控制者（Controller）</strong>，负责决定接收和分析 RUA 的目的与方式。',
    'rua.roles.li2.html': '<strong>服务提供方：</strong>通常是<strong>数据处理者（Processor）</strong>，按照合同或 DPA 以及书面指示处理数据。',

    'rua.dataTypes.title': '可能处理的数据（常见）',
    'rua.dataTypes.li1': '域名、报告周期、认证结果（SPF/DKIM/DMARC pass/fail 等）',
    'rua.dataTypes.li2': '来源 IP 与数量（汇总）',
    'rua.dataTypes.li3': '报告组织信息（以及某些情况下联系邮箱）',
    'rua.dataTypes.note': '注意：IP 地址和联系邮箱在某些情况下可能属于个人数据。',

    'rua.purpose.title': '处理目的',
    'rua.purpose.li1': '识别冒充/误认证迹象，验证发送路径健康状况（安全运维）',
    'rua.purpose.li2': '提供 SPF/DKIM/DMARC 配置改进建议并验证分阶段部署',
    'rua.purpose.li3': '以最小数据维持服务并防止滥用（限速、故障/事件响应）',

    'rua.legal.title': '法律依据（一般示例）',
    'rua.legal.li1.html': '<strong>数据控制者（客户）：</strong>根据具体用途，通常可能依据合法利益（GDPR 6(1)(f)，例如安全保障）或履行合同（6(1)(b)）。',
    'rua.legal.li2.html': '<strong>处理者（本服务）侧：</strong> 基于合同/DPA 并按书面指示处理（GDPR 28）.',
    'rua.legal.note': '适用的法律依据取决于使用场景和内部政策。客户应在正式隐私声明中明确相应依据。',

    'rua.retention.title': '保留期限与删除',
    'rua.retention.li1.html': '<strong>原始 RUA XML：</strong>不存储，并在处理后丢弃。',
    'rua.retention.li2.html': '<strong>不可逆汇总：</strong> 仅限必要范围；若不继续使用，最迟在 <strong>30 天（试用结束）</strong> 内删除（设计目标）.',
    'rua.retention.li3.html': '<strong>服务停止后：</strong>默认删除相关数据，并停止接收新报告。',

    'rua.subprocessors.title': '第三方 / 分包处理方',
    'rua.subprocessors.body.html': '如果将托管、存储或监控等工作委托给第三方，该第三方可能属于 GDPR 所称的次级处理者。正式运营时将提供<strong>供应商清单，包括名称、所在国家和用途</strong>，并根据需要签订 DPA、SCC 等条款。',

    'rua.transfer.title': '跨境传输（EEA 之外）',
    'rua.transfer.body': '如果数据可能传输到 EEA 以外地区，我们将依法采用 SCC 等适当的保障措施。',

    'rua.rights.title': '数据主体权利（请求渠道）',
    'rua.rights.li1': '访问、更正、删除、限制处理、反对、数据可携带等（适用范围内）',
    'rua.rights.li2.html': '此类请求通常先由<strong>数据控制者（客户）</strong>受理。作为数据处理者，我们会根据控制者的请求提供协助。',

    'rua.contact.title': '联系',
    'rua.contact.body.html': '隐私/数据处理咨询：<strong>privacy@toppymicros.com</strong><br>运营方：<strong>ToppyMicroServices OÜ</strong>（域名：<strong>toppymicros.com</strong>）',

    'rua.complaints.title': '投诉',
    'rua.complaints.body': 'EU / EEA 居民有权向其所在地的监管机构提出投诉。',

    'rua.trial.title': '试用与停止（要点）',
    'rua.trial.li1.html': '<strong>试用开始：</strong> 首次成功接收（激活）RUA',
    'rua.trial.li2.html': '<strong>试用结束：</strong> 开始后 30 天（UI 显示剩余天数）',
    'rua.trial.li3.html': '<strong>继续使用：</strong>点击一次“保持启用”按钮，明确表示同意',
    'rua.trial.li4.html': '<strong>默认行为：</strong>如果未确认继续使用，将在第 30 天自动停止',
    'rua.trial.li5.html': '<strong>停止时数据：</strong> 默认删除（可选仅保留匿名服务指标）',

    'rua.stop.title': '终止后如何停止 RUA',
    'rua.stop.intro': '推荐顺序：',
    'rua.stop.a.title.html': '<strong>A（推荐）：</strong> 关闭外部 RUA 授权 DNS，让发送方无法投递',
    'rua.stop.a.detail': '例如，停用用于授权 RUA 目的地址的 TXT 或 CNAME 记录，使后续报告无法投递。',
    'rua.stop.b.title.html': '<strong>B：</strong> 接收但丢弃（成本更高；最后手段）',
    'rua.stop.b.detail': '报告到达后立即丢弃。这能确保停止处理，但仍会产生网络和接收成本。',

    'rua.ui.title': 'UI（固定在仪表盘顶部）',
    'rua.ui.li1': '剩余时间：“还剩 ◯ 天”',
    'rua.ui.li2': '继续按钮：“保持启用”',
    'rua.ui.li3': '立即停止按钮：“立即停止”',
    'rua.ui.li4': '状态会显示在打开页面时即可看到的位置，并在滚动时保持固定。',

    'rua.links.back': '← 返回快速检查',
    'rua.links.spec': '服务说明',
    'rua.strategy.title': '基本原则',
    'rua.strategy.body': '明确 RUA 服务在 DMARC 中的职责，并保护从接收报告、解析 XML 到评估结果的整个流程。隐私保护和防止滥用应放在首位。',
    'rua.keypoints.title': '关键要点',
    'rua.keypoints.li1': 'RUA 是 DMARC 中用于指定聚合报告接收地址的标签，值为 mailto URI。',
    'rua.keypoints.li2': 'RUA 服务接收报告邮件、解析 XML、汇总结果，并通过自建或第三方仪表板展示。',
    'rua.keypoints.li3': '主要风险不在 DNS，而在数据处理、客户数据隔离，以及超大文件、压缩炸弹和报告洪泛等滥用。',
    'rua.definition.title': '术语说明',
    'rua.definition.li1.html': '在 DMARC 中，<span class="code">rua=</span> 是聚合报告接收地址的 URI 列表。未设置该标签时，不会生成聚合报告。',
    'rua.definition.li2': 'RFC 9990 将聚合报告定义为 XML 文档，按源 IP 和邮件数量汇总身份验证及对齐结果。',
    'rua.definition.li3.html': '<span class="code">ruf=</span> 用途不同，它指定失败报告的接收地址。这类报告可能包含单封邮件的信息，因此需要更谨慎地保护隐私。',
    'rua.priorities.title': '优先级清单',
    'rua.priorities.note': 'P0 是必要的保护措施，P1 是运营韧性，P2 是易用性和产品质量。',
    'rua.p0.title.html': '<strong>P0 - 必要的保护措施</strong>',
    'rua.p0.li1.html': '在展示报告数据前验证域名所有权，例如在 <span class="code">_dmarc4all-verify.&lt;domain&gt;</span> 发布 TXT 记录。',
    'rua.p0.li2': '限制邮件大小、解压后大小、嵌套压缩层级和处理时间，以阻止压缩炸弹。',
    'rua.p0.li3': '安全解析 XML：禁用 XXE、拒绝 DTD、验证结构和语义，并丢弃格式错误的报告。',
    'rua.p0.li4': '明确公布隐私和保留规则。原始 XML 不保存或仅短期保存，并将 IP 地址视为敏感的运营数据。',
    'rua.p1.title.html': '<strong>P1 - 运营韧性</strong>',
    'rua.p1.li1': '提供标准、匿名化（IPv4 /24 和 IPv6 /48）或仅保留聚合结果的数据最小化模式。',
    'rua.p1.li2': '通过行级隔离、加密、访问控制和审计日志隔离不同客户的数据。',
    'rua.p1.li3': '按照 RFC 9990 第 8 节的安全注意事项实施速率限制并检测报告洪泛。',
    'rua.p1.li4': '明确标注数据是接收方提供的观测结果，并分别显示 SPF、DKIM 和对齐结果。',
    'rua.p2.title.html': '<strong>P2 - 易用性和产品质量</strong>',
    'rua.p2.li1': '可直接复制使用的 DMARC 示例（如 p=none; rua=mailto:...），并附分阶段部署指南。',
    'rua.p2.li2': '在 JSON 或 CSV 导出中包含报告组织、报告周期、解析时间和工具版本。',
    'rua.p2.li3': '可选显示报告邮件的 DKIM 或 SPF 结果等可信信号，并区分已知和未知的报告组织。',

  });

  // Khmer
  add('km', {
    'rua.pageTitle': 'Toppy DNS / សេចក្ដីបញ្ជាក់សេវា RUA',
    'rua.pill': 'សេវា RUA (របាយការណ៍សរុប DMARC) — សេចក្ដីសង្ខេប',
    'rua.h1': 'ច្រកទទួល RUA / ការរចនាបញ្ឈប់ / ការដោះស្រាយទិន្នន័យ',
    'rua.tagline': 'ការសាកល្បងឥតគិតថ្លៃនឹងបញ្ឈប់ដោយស្វ័យប្រវត្តិបន្ទាប់ពី 30 ថ្ងៃ។ ដើម្បីបន្តប្រើ ត្រូវមានការយល់ព្រមជាក់លាក់។ បន្ទាប់ពីបញ្ឈប់ សេវានឹងមិនទទួលរបាយការណ៍ RUA ថ្មីទៀតទេ។',

    'rua.setup.title': 'របៀបកំណត់ RUA (ខាងអតិថិជន)',
    'rua.setup.intro.html': 'ដាក់អាសយដ្ឋាន RUA ដែលសេវានេះផ្តល់ (<span class="code">mailto:</span>) ទៅក្នុង tag <span class="code">rua=</span> នៅលើ DMARC record របស់អ្នក។ <strong>រក្សាទុកការកំណត់ DMARC ដែលមានស្រាប់ (p= / sp= / adkim= / aspf= ជាដើម)</strong> ហើយគ្រាន់តែបន្ថែម (ឬកែប្រែ) <span class="code">rua=</span> ប៉ុណ្ណោះ។',
    'rua.setup.step1.html': '<strong>1)</strong> កែប្រែ DMARC record របស់ដែន (ភាគច្រើនជា <span class="code">_dmarc</span>)។',
    'rua.setup.step2.html': '<strong>2)</strong> បន្ថែម (ឬកែប្រែ) <span class="code">rua=mailto:{RUA_EMAIL}</span>។',
    'rua.setup.step3.html': '<strong>3)</strong> អ្នកទទួលខ្លះអាចទាមទារកំណត់ត្រា DNS ដើម្បីអនុញ្ញាតគោលដៅ RUA ខាងក្រៅ ដូចបានពណ៌នានៅផ្នែកទី 4 នៃ RFC 9990។ ក្នុងករណីនេះ <strong>សេវានឹងផ្សព្វផ្សាយកំណត់ត្រា TXT ដែលត្រូវការដោយស្វ័យប្រវត្តិក្រោមដូម៉ែនរបស់យើង</strong> ដូច្នេះអ្នកមិនចាំបាច់កែ DNS ទេ។',
    'rua.setup.step4.html': '<strong>4)</strong> បន្ទាប់ពី DNS អនុវត្ត របាយការណ៍ជាទូទៅនឹងចាប់ផ្តើមមកក្នុង 24–48 ម៉ោង។',
    'rua.setup.note': 'ចំណាំ: ប្រសិនបើមាន DMARC record រួចហើយ សូមរក្សាទុក tag/policy ដើម ហើយបន្ថែមតែ rua= ប៉ុណ្ណោះ (អាចមាន mailto ច្រើន)។',

    'rua.disclaimer.title': 'សេចក្ដីបដិសេធទំនួលខុសត្រូវ',
    'rua.disclaimer.body': 'រយៈពេលសាកល្បងឥតគិតថ្លៃគឺ 30 ថ្ងៃ ហើយបន្តបានតែពេលមានការយល់ព្រមជាក់លាក់។ សេវាត្រូវបានផ្តល់ជូនតាមសមត្ថភាព ក្រោមដែនកំណត់នៃការប្រើប្រាស់ដោយសមរម្យ និងគ្មាន SLA។',

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
    'rua.gdpr.us.li5': 'ការលុប និងកិច្ចសហការ៖ គាំទ្រសំណើលុប និងការអនុវត្តសិទ្ធិរបស់ម្ចាស់ទិន្នន័យ តាមរយៈអ្នកគ្រប់គ្រងទិន្នន័យ (អតិថិជន)។',

    'rua.roles.title': 'តួនាទីរបស់អ្នកគ្រប់គ្រង និងអ្នកដំណើរការទិន្នន័យ',
    'rua.roles.li1.html': '<strong>អតិថិជន (អ្នក ឬអង្គការរបស់អ្នក)៖</strong> ជាទូទៅជា <strong>អ្នកគ្រប់គ្រងទិន្នន័យ (Controller)</strong> ព្រោះជាអ្នកកំណត់គោលបំណង និងមធ្យោបាយទទួលនិងវិភាគ RUA។',
    'rua.roles.li2.html': '<strong>អ្នកផ្តល់សេវា៖</strong> ជាទូទៅជា <strong>អ្នកដំណើរការទិន្នន័យ (Processor)</strong> ហើយដំណើរការតាមសេចក្តីណែនាំជាលាយលក្ខណ៍អក្សរក្នុង DPA ឬកិច្ចសន្យា។',

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
    'rua.legal.li1.html': '<strong>អ្នកគ្រប់គ្រងទិន្នន័យ (អតិថិជន)៖</strong> អាស្រ័យលើការប្រើប្រាស់ មូលដ្ឋានច្បាប់អាចជាផលប្រយោជន៍ស្របច្បាប់ផ្នែកសន្តិសុខ (GDPR 6(1)(f)) ឬការអនុវត្តកិច្ចសន្យា (6(1)(b))។',
    'rua.legal.li2.html': '<strong>អ្នកដំណើរការទិន្នន័យ (សេវានេះ)៖</strong> ដំណើរការតាមកិច្ចសន្យា ឬ DPA និងសេចក្តីណែនាំជាលាយលក្ខណ៍អក្សររបស់អតិថិជន (GDPR 28)។',
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
    'rua.rights.li2.html': 'ជាទូទៅ សំណើត្រូវដាក់ទៅ <strong>អ្នកគ្រប់គ្រងទិន្នន័យ (អតិថិជន)</strong> ជាមុន។ ក្នុងនាមជាអ្នកដំណើរការទិន្នន័យ យើងនឹងសហការតាមសំណើរបស់អ្នកគ្រប់គ្រងទិន្នន័យ។',

    'rua.contact.title': 'ទំនាក់ទំនង',
    'rua.contact.body.html': 'សំណួរអំពីឯកជនភាព/ការដំណើរការទិន្នន័យ: <strong>privacy@toppymicros.com</strong><br>ប្រតិបត្តិការ: <strong>ToppyMicroServices OÜ</strong> (ដែន: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'ការតវ៉ា',
    'rua.complaints.body': 'អ្នករស់នៅ EU/EEA មានសិទ្ធិតវ៉ាទៅអាជ្ញាធរត្រួតពិនិត្យ (SA) ក្នុងតំបន់របស់ខ្លួន។',

    'rua.trial.title': 'សាកល្បង និងបញ្ឈប់ (ចំណុចសំខាន់)',
    'rua.trial.li1.html': '<strong>ចាប់ផ្តើមសាកល្បង:</strong> ការទទួល RUA ជោគជ័យលើកដំបូង (activate)',
    'rua.trial.li2.html': '<strong>ចប់សាកល្បង:</strong> 30 ថ្ងៃបន្ទាប់ពីចាប់ផ្តើម (បង្ហាញថ្ងៃនៅសល់)',
    'rua.trial.li3.html': '<strong>បន្តប្រើ៖</strong> យល់ព្រមដោយច្បាស់លាស់តាមរយៈការចុច “បន្តបើក” មួយដង',
    'rua.trial.li4.html': '<strong>លំនាំដើម៖</strong> សេវានឹងបញ្ឈប់ដោយស្វ័យប្រវត្តិនៅថ្ងៃទី 30 ប្រសិនបើមិនបានបញ្ជាក់ថាចង់បន្ត',
    'rua.trial.li5.html': '<strong>ទិន្នន័យពេលបញ្ឈប់:</strong> លុបជាលំនាំដើម (ជាជម្រើសរក្សាទុកតែមេត្រិកអនាមិក)',

    'rua.stop.title': 'របៀបបញ្ឈប់ RUA បន្ទាប់ពីបញ្ចប់',
    'rua.stop.intro': 'លំដាប់ណែនាំ:',
    'rua.stop.a.title.html': '<strong>A (ណែនាំ):</strong> បិទ DNS អនុញ្ញាត RUA ខាងក្រៅ ដើម្បីឲ្យអ្នកផ្ញើមិនអាចផ្ញើបាន',
    'rua.stop.a.detail': 'ឧទាហរណ៍: បិទ TXT/CNAME ដែលប្រើសម្រាប់អនុញ្ញាតគោលដៅ RUA ដើម្បីឲ្យការផ្ញើមិនជោគជ័យ។',
    'rua.stop.b.title.html': '<strong>B:</strong> ទទួល ប៉ុន្តែបោះចោល (ចំណាយខ្ពស់; ជាជម្រើសចុងក្រោយ)',
    'rua.stop.b.detail': 'បោះចោលភ្លាមៗពេលមកដល់។ ធានាបញ្ឈប់បានខ្លាំង ប៉ុន្តែចំណាយលើបណ្តាញ/ដំណើរការកើនឡើង។',

    'rua.ui.title': 'UI (បង្ហាញថេរខាងលើ dashboard)',
    'rua.ui.li1': 'រយៈពេលនៅសល់៖ “នៅសល់ ◯ ថ្ងៃ”',
    'rua.ui.li2': 'ប៊ូតុងបន្ត៖ “បន្តបើក”',
    'rua.ui.li3': 'ប៊ូតុងបញ្ឈប់ភ្លាមៗ៖ “បញ្ឈប់ឥឡូវ”',
    'rua.ui.li4': 'ស្ថានភាពត្រូវឃើញបានភ្លាមៗ និងនៅតែឃើញពេល scroll។',

    'rua.links.back': '← ត្រឡប់ទៅការត្រួតពិនិត្យរហ័ស',
    'rua.links.spec': 'សេចក្ដីបញ្ជាក់សេវា',
    'rua.strategy.title': 'គោលការណ៍',
    'rua.strategy.body': 'កំណត់តួនាទីរបស់សេវា RUA ក្នុង DMARC ឱ្យច្បាស់ ហើយការពារដំណើរការទាំងមូល ចាប់ពីការទទួលរបាយការណ៍ ការវិភាគ XML រហូតដល់ការវាយតម្លៃលទ្ធផល។ ភាពឯកជន និងការទប់ស្កាត់ការប្រើប្រាស់ខុស គឺជាអាទិភាព។',
    'rua.keypoints.title': 'ចំណុចសំខាន់ៗ',
    'rua.keypoints.li1': 'RUA គឺជា tag របស់ DMARC ដែលមានបញ្ជី mailto URI សម្រាប់ទទួលរបាយការណ៍សរុប។',
    'rua.keypoints.li2': 'សេវា RUA ទទួលអ៊ីមែលរបាយការណ៍ វិភាគ XML សរុបលទ្ធផល ហើយបង្ហាញតាមផ្ទាំងគ្រប់គ្រងផ្ទាល់ខ្លួន ឬរបស់ភាគីទីបី។',
    'rua.keypoints.li3': 'ហានិភ័យចម្បងមិនមែននៅ DNS ទេ ប៉ុន្តែនៅការគ្រប់គ្រងទិន្នន័យ ការបំបែកទិន្នន័យរបស់អតិថិជន និងការវាយប្រហារដោយឯកសារធំ ឯកសារបង្ហាប់ដែលមានគ្រោះថ្នាក់ ឬរបាយការណ៍ច្រើនខុសប្រក្រតី។',
    'rua.definition.title': 'និយមន័យ',
    'rua.definition.li1.html': 'ក្នុង DMARC តម្លៃ <span class="code">rua=</span> គឺជាបញ្ជី URI ដែលទទួលរបាយការណ៍សរុប។ ប្រសិនបើមិនមាន tag នេះ របាយការណ៍សរុបនឹងមិនត្រូវបានបង្កើតទេ។',
    'rua.definition.li2': 'RFC 9990 កំណត់របាយការណ៍សរុបជាឯកសារ XML ដែលសង្ខេបលទ្ធផលការផ្ទៀងផ្ទាត់ និងការតម្រឹមតាម IP ប្រភព និងចំនួនសារ។',
    'rua.definition.li3.html': '<span class="code">ruf=</span> មានគោលបំណងផ្សេង គឺកំណត់ទីតាំងទទួលរបាយការណ៍បរាជ័យ។ របាយការណ៍ទាំងនេះអាចមានព័ត៌មានអំពីសារនីមួយៗ ដូច្នេះត្រូវការការការពារឯកជនភាពខ្ពស់ជាង។',
    'rua.priorities.title': 'បញ្ជីអាទិភាព',
    'rua.priorities.note': 'P0 គឺវិធានការការពារចាំបាច់ P1 គឺភាពធន់ក្នុងប្រតិបត្តិការ និង P2 គឺភាពងាយស្រួលប្រើ និងគុណភាពផលិតផល។',
    'rua.p0.title.html': '<strong>P0 - វិធានការការពារចាំបាច់</strong>',
    'rua.p0.li1.html': 'ផ្ទៀងផ្ទាត់ភាពជាម្ចាស់ដែន (ឧ. TXT នៅ <span class="code">_dmarc4all-verify.&lt;domain&gt;</span>) មុនបង្ហាញទិន្នន័យរបាយការណ៍។',
    'rua.p0.li2': 'កំណត់ទំហំសារ ទំហំបន្ទាប់ពីពន្លា ជម្រៅនៃឯកសារបង្ហាប់ជាន់គ្នា និងពេលវេលាដំណើរការ ដើម្បីទប់ស្កាត់ឯកសារបង្ហាប់ដែលមានគ្រោះថ្នាក់។',
    'rua.p0.li3': 'វិភាគ XML ដោយសុវត្ថិភាព៖ បិទ XXE បដិសេធ DTD ពិនិត្យរចនាសម្ព័ន្ធ និងអត្ថន័យទិន្នន័យ ហើយបោះចោលរបាយការណ៍មិនត្រឹមត្រូវ។',
    'rua.p0.li4': 'ផ្សព្វផ្សាយគោលការណ៍ឯកជនភាព និងការរក្សាទុកឱ្យច្បាស់។ មិនរក្សាទុក XML ដើម ឬរក្សាទុកតែរយៈពេលខ្លី ហើយចាត់ទុកអាសយដ្ឋាន IP ជាទិន្នន័យប្រតិបត្តិការដែលមានភាពរសើប។',
    'rua.p1.title.html': '<strong>P1 - ភាពធន់ក្នុងប្រតិបត្តិការ</strong>',
    'rua.p1.li1': 'ផ្តល់ជម្រើសកាត់បន្ថយទិន្នន័យ៖ ស្តង់ដារ មិនបង្ហាញអត្តសញ្ញាណ (IPv4 /24 និង IPv6 /48) ឬរក្សាទុកតែទិន្នន័យសរុប។',
    'rua.p1.li2': 'បំបែកទិន្នន័យរបស់អតិថិជនដោយការបែងចែកតាមជួរ ការអ៊ិនគ្រីប ការគ្រប់គ្រងសិទ្ធិចូល និងកំណត់ហេតុសវនកម្ម។',
    'rua.p1.li3': 'អនុវត្តការកំណត់អត្រា និងរកឃើញលំហូររបាយការណ៍ខុសប្រក្រតី តាមការពិចារណាផ្នែកសុវត្ថិភាពនៅផ្នែកទី 8 នៃ RFC 9990។',
    'rua.p1.li4': 'បញ្ជាក់ថាទិន្នន័យគឺជាលទ្ធផលដែលអ្នកទទួលបានរាយការណ៍ ហើយបង្ហាញលទ្ធផល SPF, DKIM និងការតម្រឹមដាច់ដោយឡែក។',
    'rua.p2.title.html': '<strong>P2 - ភាពងាយស្រួលប្រើ និងគុណភាព</strong>',
    'rua.p2.li1': 'ឧទាហរណ៍ DMARC ដែលអាចចម្លងទៅប្រើបាន (ឧ. p=none; rua=mailto:...) និងការណែនាំអនុវត្តជាដំណាក់កាល។',
    'rua.p2.li2': 'បញ្ចូលអង្គការដែលផ្ញើរបាយការណ៍ រយៈពេលរបាយការណ៍ ពេលវេលាវិភាគ និងកំណែឧបករណ៍ក្នុងឯកសារ JSON ឬ CSV។',
    'rua.p2.li3': 'អាចបង្ហាញសញ្ញានៃភាពត្រឹមត្រូវ ដូចជាលទ្ធផល DKIM ឬ SPF របស់អ៊ីមែលរបាយការណ៍ និងបែងចែកប្រភពដែលស្គាល់ពីប្រភពដែលមិនទាន់ស្គាល់។',

  });

  // Burmese (Myanmar)
  add('my', {
    'rua.pageTitle': 'Toppy DNS / RUA ဝန်ဆောင်မှု သတ်မှတ်ချက်',
    'rua.pill': 'RUA (DMARC Aggregate Reports) ဝန်ဆောင်မှု — အကျဉ်းချုပ်သတ်မှတ်ချက်',
    'rua.h1': 'RUA လက်ခံနေရာ / ရပ်တန့်ဒီဇိုင်း / ဒေတာကိုင်တွယ်မှု',
    'rua.tagline': 'အခမဲ့ စမ်းသပ်ကာလသည် 30 ရက်အပြီး အလိုအလျောက် ရပ်တန့်ပါမည်။ ဆက်လက်အသုံးပြုရန် ရှင်းလင်းစွာ အတည်ပြုရပါမည်။ ရပ်တန့်ပြီးနောက် RUA အစီရင်ခံစာအသစ်များကို လက်ခံတော့မည် မဟုတ်ပါ။',

    'rua.setup.title': 'RUA ကို ဘယ်လိုသတ်မှတ်မလဲ (ဖောက်သည်ဘက်)',
    'rua.setup.intro.html': 'ဒီဝန်ဆောင်မှုက ထုတ်ပေးတဲ့ RUA လက်ခံလိပ်စာ (<span class="code">mailto:</span>) ကို သင့် DMARC record ရဲ့ <span class="code">rua=</span> ထဲမှာ သတ်မှတ်ပါ။ <strong>ရှိပြီးသား DMARC သတ်မှတ်ချက်များ (p= / sp= / adkim= / aspf= စသည်) ကို ထိန်းထားပြီး</strong> <span class="code">rua=</span> ကိုသာ ထည့် (သို့) ပြင်ဆင်ပါ။',
    'rua.setup.step1.html': '<strong>1)</strong> သင့်ဒိုမိန်းရဲ့ DMARC record ကို ပြင်ပါ (ယေဘုယျအားဖြင့် <span class="code">_dmarc</span>)။',
    'rua.setup.step2.html': '<strong>2)</strong> <span class="code">rua=mailto:{RUA_EMAIL}</span> ကို ထည့် (သို့) ပြင်ဆင်ပါ။',
    'rua.setup.step3.html': '<strong>3)</strong> လက်ခံသူအချို့သည် RFC 9990 အပိုင်း 4 တွင် ဖော်ပြထားသည့်အတိုင်း ပြင်ပ RUA လိပ်စာကို ခွင့်ပြုရန် DNS မှတ်တမ်းတစ်ခု လိုအပ်နိုင်ပါသည်။ ထိုအခါ <strong>လိုအပ်သော TXT မှတ်တမ်းကို ဝန်ဆောင်မှုက ကျွန်ုပ်တို့၏ဒိုမိန်းအောက်တွင် အလိုအလျောက် ထုတ်ပြန်ပေးမည်</strong> ဖြစ်သောကြောင့် သင့် DNS ကို ပြင်ဆင်ရန် မလိုပါ။',
    'rua.setup.step4.html': '<strong>4)</strong> DNS ပြန့်ပွားပြီးနောက် ယေဘုယျအားဖြင့် 24–48 နာရီအတွင်း report များ စတင်ရောက်လာပါမယ်။',
    'rua.setup.note': 'မှတ်ချက်: DMARC record ရှိပြီးသားဖြစ်ရင် ရှိပြီးသား tag/policy ကို ထိန်းထားပြီး rua= ကိုသာ ထပ်ထည့်ပါ (mailto မျိုးစုံလည်း ထည့်နိုင်ပါသည်)။',

    'rua.disclaimer.title': 'အကန့်အသတ်/ငြင်းဆိုချက်',
    'rua.disclaimer.body': 'အခမဲ့ စမ်းသပ်ကာလမှာ 30 ရက်ဖြစ်ပြီး ရှင်းလင်းစွာ အတည်ပြုမှသာ ဆက်လက်အသုံးပြုနိုင်ပါသည်။ ဝန်ဆောင်မှုကို တတ်နိုင်သမျှ အကောင်းဆုံးပေးထားပြီး မျှတစွာအသုံးပြုမှု ကန့်သတ်ချက်များရှိကာ SLA မပါဝင်ပါ။',

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
    'rua.gdpr.user.li4': 'ရပ်တန့်ခြင်းနှင့် ဖျက်ခြင်း: ဝန်ဆောင်မှုရပ်ပြီးနောက် အစီရင်ခံစာအသစ်များ လက်ခံခြင်းကို ရပ်ကာ ဆက်နွယ်ဒေတာကို ပုံမှန်အားဖြင့် ဖျက်ပါမည်။ DNS ဘက်တွင်လည်း မဖြစ်မနေ ရပ်တန့်ပါ (အောက်တွင်ကြည့်ပါ)။',

    'rua.gdpr.us.title': 'ကျွန်ုပ်တို့လုပ်ဆောင်သည့်အချက်များ (အချက်အလက်)',
    'rua.gdpr.us.li1': 'ဒေတာအနည်းဆုံး: raw XML မသိမ်း၊ အနည်းဆုံး irreversible aggregate သာ။',
    'rua.gdpr.us.li2': 'ရည်ရွယ်ချက်မဟုတ်သောအသုံးပြုမှုမရှိ: ကြော်ငြာ/မားကက်တင်းအတွက် မအသုံးပြုပါ (RUA မတော်တဆမဟုတ်သလို report-level data မသိမ်းပါ)။',
    'rua.gdpr.us.li3': 'လုံခြုံရေး: access control, least privilege, encryption စသည်ဖြင့် လျှို့ဝှက်မှုနှင့် တိကျမှန်ကန်မှုကို ကာကွယ်ပါသည်။',
    'rua.gdpr.us.li4': 'Sub-processor စီမံခန့်ခွဲမှု: vendor အသုံးပြုပါက GDPR နှင့်ကိုက်ညီသော သတ်မှတ်ချက်(DPA စသည်) ဖြင့် စီမံပါသည်။',
    'rua.gdpr.us.li5': 'ဖျက်ခြင်းနှင့် ပူးပေါင်းဆောင်ရွက်ခြင်း: ဒေတာထိန်းချုပ်သူ (ဖောက်သည်) မှတစ်ဆင့် ဖျက်ခြင်းနှင့် အခွင့်အရေးဆိုင်ရာ တောင်းဆိုမှုများကို ပူးပေါင်းကူညီပါသည်။',

    'rua.roles.title': 'ဒေတာထိန်းချုပ်သူနှင့် ဒေတာစီမံဆောင်ရွက်သူတို့၏ အခန်းကဏ္ဍ',
    'rua.roles.li1.html': '<strong>ဖောက်သည် (သင် သို့မဟုတ် သင့်အဖွဲ့အစည်း):</strong> RUA လက်ခံခြင်းနှင့် ခွဲခြမ်းစိတ်ဖြာခြင်း၏ ရည်ရွယ်ချက်နှင့် နည်းလမ်းကို ဆုံးဖြတ်သောကြောင့် ပုံမှန်အားဖြင့် <strong>ဒေတာထိန်းချုပ်သူ (Controller)</strong> ဖြစ်သည်။',
    'rua.roles.li2.html': '<strong>ဝန်ဆောင်မှုပေးသူ:</strong> စာချုပ် သို့မဟုတ် DPA တွင် မှတ်တမ်းတင်ထားသော ဖောက်သည်၏ညွှန်ကြားချက်အတိုင်း လုပ်ဆောင်သဖြင့် ပုံမှန်အားဖြင့် <strong>ဒေတာစီမံဆောင်ရွက်သူ (Processor)</strong> ဖြစ်သည်။',

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
    'rua.legal.li1.html': '<strong>ဒေတာထိန်းချုပ်သူ (ဖောက်သည်):</strong> အသုံးပြုသည့်ရည်ရွယ်ချက်ပေါ်မူတည်၍ လုံခြုံရေးဆိုင်ရာ တရားဝင်အကျိုးစီးပွား (GDPR 6(1)(f)) သို့မဟုတ် စာချုပ်အကောင်အထည်ဖော်ခြင်း (6(1)(b)) ကို တရားဝင်အခြေခံအဖြစ် အသုံးပြုနိုင်သည်။',
    'rua.legal.li2.html': '<strong>ဒေတာစီမံဆောင်ရွက်သူ (ဤဝန်ဆောင်မှု):</strong> စာချုပ် သို့မဟုတ် DPA နှင့် ဖောက်သည်၏ မှတ်တမ်းတင်ထားသော ညွှန်ကြားချက်အတိုင်း လုပ်ဆောင်သည် (GDPR 28)။',
    'rua.legal.note': 'သက်ဆိုင်သည့် တရားဝင်အခြေခံသည် အသုံးပြုပုံနှင့် အဖွဲ့အစည်း၏ မူဝါဒပေါ် မူတည်သည်။ တရားဝင်အသိပေးချက်တွင် မိမိအသုံးပြုမှုနှင့် ကိုက်ညီသော အခြေခံကို ဖော်ပြပါ။',

    'rua.retention.title': 'ထိန်းသိမ်းကာလနှင့် ဖျက်ခြင်း',
    'rua.retention.li1.html': '<strong>Raw RUA XML:</strong> မသိမ်း; လုပ်ဆောင်ပြီးနောက် ဖျက်သည်။',
    'rua.retention.li2.html': '<strong>Irreversible aggregates:</strong> လိုအပ်သလောက်သာ; ဆက်မလုပ်ပါက <strong>30 ရက် (trial အဆုံး)</strong> အတွင်း ဖျက် (ဒီဇိုင်းရည်မှန်းချက်)။',
    'rua.retention.li3.html': '<strong>ရပ်တန့်ပြီးနောက်:</strong> ဆက်နွယ်ဒေတာကို ပုံမှန်အားဖြင့် ဖျက်ပြီး intake ကို ရပ်သည်။',

    'rua.subprocessors.title': 'တတိယပုဂ္ဂိုလ် / Sub-processors',
    'rua.subprocessors.body.html': 'Hosting/storage/monitoring အတွက် vendor အသုံးပြုပါက GDPR sub-processor ဖြစ်နိုင်သည်။ ထုတ်လုပ်မှုတွင် <strong>vendor စာရင်း (အမည်/နိုင်ငံ/ရည်ရွယ်ချက်)</strong> ကိုပေးပြီး လိုအပ်သလို DPA, SCC စသည်ကို ပြုလုပ်ပါမည်။',

    'rua.transfer.title': 'နိုင်ငံအပြင်သို့ လွှဲပြောင်းခြင်း (EEA အပြင်)',
    'rua.transfer.body': 'EEA အပြင်သို့ လွှဲပြောင်းနိုင်ပါက လိုအပ်သလို SCC စသည့် ကာကွယ်မှုများကို အသုံးပြုပါမည်။',

    'rua.rights.title': 'ဒေတာပိုင်ရှင်အခွင့်အရေး (တောင်းဆိုရန်)',
    'rua.rights.li1': 'ဝင်ရောက်ကြည့်ရှုခွင့်၊ ပြင်ဆင်ခွင့်၊ ဖျက်ပယ်ခွင့်၊ လုပ်ဆောင်မှုကန့်သတ်ခွင့်၊ ကန့်ကွက်ခွင့်နှင့် ဒေတာလွှဲပြောင်းရယူခွင့် စသည် (သက်ဆိုင်သည့်အတိုင်း)',
    'rua.rights.li2.html': 'တောင်းဆိုမှုကို ပုံမှန်အားဖြင့် <strong>ဒေတာထိန်းချုပ်သူ (ဖောက်သည်)</strong> ထံ ဦးစွာတင်ပြရသည်။ ဒေတာစီမံဆောင်ရွက်သူအနေဖြင့် ထိန်းချုပ်သူ၏တောင်းဆိုချက်အတိုင်း ကျွန်ုပ်တို့ ပူးပေါင်းဆောင်ရွက်ပါသည်။',

    'rua.contact.title': 'ဆက်သွယ်ရန်',
    'rua.contact.body.html': 'ကိုယ်ရေးကိုယ်တာ/ဒေတာကိုင်တွယ်မှု မေးခွန်းများ: <strong>privacy@toppymicros.com</strong><br>အုပ်ချုပ်သူ: <strong>ToppyMicroServices OÜ</strong> (domain: <strong>toppymicros.com</strong>)',

    'rua.complaints.title': 'တိုင်ကြားချက်',
    'rua.complaints.body': 'EU/EEA နေထိုင်သူများသည် မိမိဒေသ ဆိုင်ရာ စောင့်ကြည့်ရေးအာဏာပိုင်(SA) ထံ တိုင်ကြားခွင့်ရှိသည်။',

    'rua.trial.title': 'Trial နှင့် ရပ်တန့်ခြင်း (အချက်အလက်)',
    'rua.trial.li1.html': '<strong>Trial စတင်:</strong> RUA intake (activation) ပထမဆုံးအောင်မြင်သည့်နေ့',
    'rua.trial.li2.html': '<strong>Trial ပြီးဆုံး:</strong> စတင်ပြီး 30 ရက် (UI တွင် ကျန်ရက်ပြသ)',
    'rua.trial.li3.html': '<strong>ဆက်လက်အသုံးပြုရန် -</strong> “ဆက်ဖွင့်ထားရန်” ကို တစ်ချက်နှိပ်ပြီး အတိအလင်း သဘောတူပါ။',
    'rua.trial.li4.html': '<strong>မူလအခြေအနေ -</strong> ဆက်လက်အသုံးပြုရန် အတည်မပြုပါက 30 ရက်မြောက်နေ့တွင် အလိုအလျောက် ရပ်တန့်ပါမည်။',
    'rua.trial.li5.html': '<strong>ရပ်တန့်ချိန် ဒေတာ:</strong> ပုံမှန်အားဖြင့် ဖျက် (ရွေးချယ်မှု: အမည်မဖော် metrics)',

    'rua.stop.title': 'ရပ်တန့်ပြီးနောက် RUA ကို ဘယ်လိုရပ်မလဲ',
    'rua.stop.intro': 'အကြံပြုအဆင့်အစဉ်:',
    'rua.stop.a.title.html': '<strong>A (အကြံပြု):</strong> ပြင်ပ RUA authorization DNS ကို ပိတ်ပြီး sender မပို့နိုင်အောင် လုပ်ခြင်း',
    'rua.stop.a.detail': 'ဥပမာ: RUA destination ကို authorization လုပ်သော TXT/CNAME ကို ပိတ်၍ delivery မအောင်မြင်အောင်လုပ်ခြင်း။',
    'rua.stop.b.title.html': '<strong>B:</strong> လက်ခံပြီးဖျက် (ကုန်ကျစရိတ်ပို; နောက်ဆုံးရွေးချယ်မှု)',
    'rua.stop.b.detail': 'ရောက်လာချိန်တင် ဖျက်ပစ်ပါ။ ရပ်တန့်အာမခံကောင်းသော်လည်း network/processing ကုန်ကျစရိတ်တက်သည်။',

    'rua.ui.title': 'UI (dashboard အပေါ်တွင် တည်တံ့)',
    'rua.ui.li1': 'ကျန်ရှိသည့်ကာလ - “◯ ရက် ကျန်”',
    'rua.ui.li2': 'ဆက်လက်အသုံးပြုရန် ခလုတ် - “ဆက်ဖွင့်ထားရန်”',
    'rua.ui.li3': 'ချက်ချင်းရပ်တန့်ရန် ခလုတ် - “ယခုရပ်ရန်”',
    'rua.ui.li4': 'အခြေအနေကို အမြဲပထမမြင်ကွင်းတွင် တွေ့နိုင်ပြီး scroll လုပ်လည်း ထိပ်တွင်မြင်ရသည်။',

    'rua.links.back': '← အမြန်စစ်ဆေးမှုသို့ ပြန်သွားရန်',
    'rua.links.spec': 'ဝန်ဆောင်မှု သတ်မှတ်ချက်စာတမ်း',
    'rua.strategy.title': 'အခြေခံမူ',
    'rua.strategy.body': 'DMARC တွင် RUA ဝန်ဆောင်မှု၏ အခန်းကဏ္ဍကို ရှင်းလင်းစွာ သတ်မှတ်ပြီး အစီရင်ခံစာလက်ခံခြင်း၊ XML ခွဲခြမ်းစိတ်ဖြာခြင်းနှင့် ရလဒ်သုံးသပ်ခြင်း လုပ်ငန်းစဉ်တစ်ခုလုံးကို လုံခြုံအောင် ပြုလုပ်ပါ။ ကိုယ်ရေးလုံခြုံမှုနှင့် အလွဲသုံးစားမှုကာကွယ်ရေးကို ဦးစားပေးပါသည်။',
    'rua.keypoints.title': 'အချက်အလက်အဓိက',
    'rua.keypoints.li1': 'RUA သည် စုပေါင်းအစီရင်ခံစာများ လက်ခံမည့် mailto URI စာရင်းကို သတ်မှတ်သော DMARC tag ဖြစ်သည်။',
    'rua.keypoints.li2': 'RUA ဝန်ဆောင်မှုသည် အစီရင်ခံအီးမေးလ်များကို လက်ခံ၍ XML ကို ခွဲခြမ်းစိတ်ဖြာကာ ရလဒ်များကို စုပေါင်းပြီး ကိုယ်ပိုင် သို့မဟုတ် ပြင်ပစီမံခန့်ခွဲမှု မျက်နှာပြင်တွင် ဖော်ပြသည်။',
    'rua.keypoints.li3': 'အဓိကအန္တရာယ်မှာ DNS မဟုတ်ဘဲ ဒေတာကိုင်တွယ်မှု၊ ဖောက်သည်တစ်ဦးချင်း၏ ဒေတာခွဲခြားမှုနှင့် ဖိုင်အလွန်ကြီးခြင်း၊ အန္တရာယ်ရှိသော ဖိသိပ်ဖိုင် သို့မဟုတ် အစီရင်ခံစာအများအပြား ဝင်ရောက်ခြင်းကဲ့သို့သော တိုက်ခိုက်မှုများ ဖြစ်သည်။',
    'rua.definition.title': 'ဝေါဟာရ',
    'rua.definition.li1.html': 'DMARC တွင် <span class="code">rua=</span> သည် စုပေါင်းအစီရင်ခံစာများ လက်ခံမည့် URI စာရင်း ဖြစ်သည်။ ဤ tag မရှိပါက စုပေါင်းအစီရင်ခံစာကို မထုတ်ပေးပါ။',
    'rua.definition.li2': 'RFC 9990 သည် စုပေါင်းအစီရင်ခံစာကို အရင်းအမြစ် IP နှင့် စာအရေအတွက်အလိုက် အထောက်အထားစစ်ဆေးမှုနှင့် ကိုက်ညီမှုရလဒ်များကို အကျဉ်းချုပ်ထားသော XML စာတမ်းအဖြစ် သတ်မှတ်ထားသည်။',
    'rua.definition.li3.html': '<span class="code">ruf=</span> သည် မအောင်မြင်မှုအစီရင်ခံစာအတွက် ဖြစ်သည်။ မေးလ်တစ်စောင်ချင်းဆိုင်ရာ အချက်အလက် ပါဝင်နိုင်သဖြင့် ကိုယ်ရေးလုံခြုံမှုအရ ပိုမိုသတိထားရသည်။',
    'rua.priorities.title': 'ဦးစားပေးစာရင်း',
    'rua.priorities.note': 'P0 သည် မဖြစ်မနေလိုအပ်သော ကာကွယ်မှုများ၊ P1 သည် လက်တွေ့အသုံးပြုရာတွင် ခံနိုင်ရည်ရှိမှု၊ P2 သည် အသုံးပြုရလွယ်ကူမှုနှင့် ထုတ်ကုန်အရည်အသွေးတို့ကို ဆိုလိုသည်။',
    'rua.p0.title.html': '<strong>P0 - မဖြစ်မနေလိုအပ်သော ကာကွယ်မှုများ</strong>',
    'rua.p0.li1.html': 'အစီရင်ခံဒေတာကို ပြမည်မတိုင်ခင် ဒိုမိန်ပိုင်ဆိုင်မှုကို စစ်ဆေးရန် (ဥပမာ <span class="code">_dmarc4all-verify.&lt;domain&gt;</span> TXT)။',
    'rua.p0.li2': 'မေးလ်အရွယ်အစား၊ ဖြည်ပြီးနောက်အရွယ်အစား၊ အဆင့်ဆင့်ထည့်ထားသော ဖိသိပ်ဖိုင်အနက်နှင့် လုပ်ဆောင်ချိန်ကို ကန့်သတ်ပြီး အန္တရာယ်ရှိသော ဖိသိပ်ဖိုင်များကို တားဆီးပါ။',
    'rua.p0.li3': 'XML ကို လုံခြုံစွာ ခွဲခြမ်းစိတ်ဖြာပါ။ XXE ကို ပိတ်ပြီး DTD ကို ငြင်းပယ်ကာ ဖွဲ့စည်းပုံနှင့် အဓိပ္ပါယ်ကို စစ်ဆေးပြီး မမှန်သော အစီရင်ခံစာများကို ပယ်ဖျက်ပါ။',
    'rua.p0.li4': 'ကိုယ်ရေးလုံခြုံမှုနှင့် သိမ်းဆည်းကာလ စည်းမျဉ်းများကို ရှင်းလင်းစွာ ထုတ်ပြန်ပါ။ မူရင်း XML ကို မသိမ်းပါ သို့မဟုတ် အချိန်တိုသာ သိမ်းပြီး IP လိပ်စာများကို အရေးကြီးသော လုပ်ငန်းဒေတာအဖြစ် သတ်မှတ်ပါ။',
    'rua.p1.title.html': '<strong>P1 - လက်တွေ့အသုံးပြုရာတွင် ခံနိုင်ရည်ရှိမှု</strong>',
    'rua.p1.li1': 'ဒေတာလျှော့ချမှုအတွက် ပုံမှန်၊ အမည်မဖော် (IPv4 /24 နှင့် IPv6 /48) သို့မဟုတ် စုပေါင်းဒေတာသာ သိမ်းသည့် ရွေးချယ်စရာများ ပေးပါ။',
    'rua.p1.li2': 'ဖောက်သည်ဒေတာကို အတန်းအလိုက် ခွဲခြားခြင်း၊ စာဝှက်ခြင်း၊ ဝင်ရောက်ခွင့်ထိန်းချုပ်ခြင်းနှင့် စစ်ဆေးမှတ်တမ်းများဖြင့် သီးခြားထားပါ။',
    'rua.p1.li3': 'RFC 9990 အပိုင်း 8 ရှိ လုံခြုံရေးဆိုင်ရာ အချက်များနှင့်အညီ လက်ခံနှုန်းကို ကန့်သတ်ပြီး ပုံမှန်မဟုတ်သော အစီရင်ခံစာအများအပြား ဝင်ရောက်မှုကို ရှာဖွေပါ။',
    'rua.p1.li4': 'ဒေတာသည် လက်ခံသူက ပေးပို့သော စောင့်ကြည့်ရလဒ်ဖြစ်ကြောင်း ရှင်းလင်းစွာ ဖော်ပြပြီး SPF၊ DKIM နှင့် ကိုက်ညီမှုရလဒ်များကို သီးခြားပြပါ။',
    'rua.p2.title.html': '<strong>P2 - အသုံးပြုရလွယ်ကူမှုနှင့် အရည်အသွေး</strong>',
    'rua.p2.li1': 'ကူးယူသုံးနိုင်သော DMARC ဥပမာများ (ဥပမာ p=none; rua=mailto:...) နှင့် အဆင့်လိုက် အသုံးချရန် လမ်းညွှန်။',
    'rua.p2.li2': 'JSON သို့မဟုတ် CSV ထုတ်ယူမှုတွင် အစီရင်ခံအဖွဲ့၊ အစီရင်ခံကာလ၊ ခွဲခြမ်းစိတ်ဖြာချိန်နှင့် ကိရိယာဗားရှင်းကို ထည့်ပါ။',
    'rua.p2.li3': 'အစီရင်ခံအီးမေးလ်၏ DKIM သို့မဟုတ် SPF ရလဒ်ကဲ့သို့ ယုံကြည်ရမှုဆိုင်ရာ အချက်များကို လိုအပ်သလို ပြပြီး သိရှိထားသော အစီရင်ခံအဖွဲ့နှင့် မသိရသေးသော အဖွဲ့ကို ခွဲခြားပါ။',

  });

  const statusCopy = {
    ja: {
      'rua.status.title': '現在利用できる機能',
      'rua.tagline': '設計目標：無料トライアルは30日で自動停止し、継続には明示的な同意を求めます。以下は現在の提供状況ではなく、サービスの技術・運用設計です。',
      'rua.status.body': 'このページは RUA サービスの設計資料です。このページからサービスの申込みや利用開始はできません。手元の RUA レポートは、ブラウザ内で RUA Analyzer を使って解析できます。',
      'rua.status.action': 'RUA Analyzer を開く',
      'rua.technical.summary': '技術仕様・運用設計を表示'
    },
    en: {
      'rua.status.title': 'Available now',
      'rua.tagline': 'Design target: a free trial stops after 30 days unless the user explicitly continues. The details below describe the technical and operational design, not current service availability.',
      'rua.status.body': 'This page documents the RUA service design. It does not provide enrollment or activation. You can analyze RUA reports you already have with the browser-local RUA Analyzer.',
      'rua.status.action': 'Open RUA Analyzer',
      'rua.technical.summary': 'Show technical and operational design'
    },
    es: {
      'rua.status.title': 'Disponible ahora',
      'rua.tagline': 'Objetivo de diseño: la prueba gratuita se detiene a los 30 días salvo continuación explícita. Los detalles siguientes describen el diseño técnico y operativo, no la disponibilidad actual del servicio.',
      'rua.status.body': 'Esta página documenta el diseño del servicio RUA. No permite registrarse ni activarlo. Puedes analizar los informes RUA que ya tengas con RUA Analyzer, que funciona en el navegador.',
      'rua.status.action': 'Abrir RUA Analyzer',
      'rua.technical.summary': 'Mostrar el diseño técnico y operativo'
    },
    de: {
      'rua.status.title': 'Derzeit verfügbar',
      'rua.tagline': 'Entwurfsziel: Der kostenlose Test endet nach 30 Tagen, sofern er nicht ausdrücklich fortgesetzt wird. Die folgenden Angaben beschreiben den technischen und betrieblichen Entwurf, nicht die aktuelle Verfügbarkeit.',
      'rua.status.body': 'Diese Seite dokumentiert den Entwurf des RUA-Dienstes. Eine Anmeldung oder Aktivierung ist hier nicht möglich. Vorhandene RUA-Berichte kannst du mit dem lokal im Browser laufenden RUA Analyzer auswerten.',
      'rua.status.action': 'RUA Analyzer öffnen',
      'rua.technical.summary': 'Technischen und betrieblichen Entwurf anzeigen'
    },
    ko: {
      'rua.status.title': '현재 사용할 수 있는 기능',
      'rua.tagline': '설계 목표: 사용자가 명시적으로 계속하지 않으면 무료 체험은 30일 후 종료됩니다. 아래 내용은 현재 서비스 제공 상태가 아니라 기술 및 운영 설계를 설명합니다.',
      'rua.status.body': '이 페이지는 RUA 서비스 설계 문서입니다. 여기에서 서비스 신청이나 활성화는 할 수 없습니다. 이미 가지고 있는 RUA 보고서는 브라우저에서 실행되는 RUA Analyzer로 분석할 수 있습니다.',
      'rua.status.action': 'RUA Analyzer 열기',
      'rua.technical.summary': '기술 및 운영 설계 보기'
    },
    vi: {
      'rua.status.title': 'Hiện có thể sử dụng',
      'rua.tagline': 'Mục tiêu thiết kế: bản dùng thử miễn phí dừng sau 30 ngày nếu người dùng không chủ động tiếp tục. Nội dung dưới đây mô tả thiết kế kỹ thuật và vận hành, không phải tình trạng cung cấp hiện tại.',
      'rua.status.body': 'Trang này mô tả thiết kế dịch vụ RUA, không cung cấp đăng ký hoặc kích hoạt. Bạn có thể phân tích báo cáo RUA đang có bằng RUA Analyzer chạy cục bộ trong trình duyệt.',
      'rua.status.action': 'Mở RUA Analyzer',
      'rua.technical.summary': 'Hiện thiết kế kỹ thuật và vận hành'
    },
    th: {
      'rua.status.title': 'ใช้งานได้ในขณะนี้',
      'rua.tagline': 'เป้าหมายการออกแบบ: ช่วงทดลองใช้ฟรีจะหยุดหลัง 30 วัน เว้นแต่ผู้ใช้ยืนยันให้ทำงานต่อ รายละเอียดด้านล่างเป็นการออกแบบทางเทคนิคและการดำเนินงาน ไม่ใช่สถานะการเปิดให้บริการในปัจจุบัน',
      'rua.status.body': 'หน้านี้เป็นเอกสารการออกแบบบริการ RUA และไม่สามารถสมัครหรือเปิดใช้บริการได้ที่นี่ คุณสามารถวิเคราะห์รายงาน RUA ที่มีอยู่ด้วย RUA Analyzer ซึ่งทำงานภายในเบราว์เซอร์',
      'rua.status.action': 'เปิด RUA Analyzer',
      'rua.technical.summary': 'แสดงการออกแบบด้านเทคนิคและการดำเนินงาน'
    },
    km: {
      'rua.status.title': 'អ្វីដែលអាចប្រើបានឥឡូវនេះ',
      'rua.tagline': 'គោលដៅរចនា៖ ការសាកល្បងឥតគិតថ្លៃឈប់បន្ទាប់ពី 30 ថ្ងៃ លុះត្រាតែអ្នកប្រើបញ្ជាក់បន្ត។ ព័ត៌មានខាងក្រោមពិពណ៌នាអំពីការរចនាបច្ចេកទេស និងប្រតិបត្តិការ មិនមែនស្ថានភាពផ្តល់សេវាបច្ចុប្បន្នទេ។',
      'rua.status.body': 'ទំព័រនេះពិពណ៌នាអំពីការរចនាសេវា RUA ប៉ុណ្ណោះ ហើយមិនអាចចុះឈ្មោះ ឬបើកសេវាបានទេ។ អ្នកអាចវិភាគរបាយការណ៍ RUA ដែលមានរួចដោយ RUA Analyzer ដែលដំណើរការក្នុងកម្មវិធីរុករក។',
      'rua.status.action': 'បើក RUA Analyzer',
      'rua.technical.summary': 'បង្ហាញការរចនាបច្ចេកទេស និងប្រតិបត្តិការ'
    },
    my: {
      'rua.status.title': 'ယခုအသုံးပြုနိုင်သည့် လုပ်ဆောင်ချက်',
      'rua.tagline': 'ဒီဇိုင်းရည်မှန်းချက်အရ အသုံးပြုသူက ဆက်လုပ်ရန် အတိအလင်းမရွေးလျှင် အခမဲ့ trial ကို 30 ရက်အကြာ ရပ်မည်။ အောက်ပါအချက်များသည် လက်ရှိဝန်ဆောင်မှုပေးနေမှုမဟုတ်ဘဲ နည်းပညာနှင့် လည်ပတ်မှုဒီဇိုင်းကို ဖော်ပြသည်။',
      'rua.status.body': 'ဤစာမျက်နှာသည် RUA ဝန်ဆောင်မှုဒီဇိုင်းကို ရှင်းပြထားခြင်းသာ ဖြစ်ပြီး ဝန်ဆောင်မှုစာရင်းသွင်းခြင်း သို့မဟုတ် ဖွင့်ခြင်း မပြုနိုင်ပါ။ ရှိပြီးသား RUA report များကို browser အတွင်း အလုပ်လုပ်သော RUA Analyzer ဖြင့် စစ်ဆေးနိုင်သည်။',
      'rua.status.action': 'RUA Analyzer ဖွင့်ရန်',
      'rua.technical.summary': 'နည်းပညာနှင့် လည်ပတ်မှုဒီဇိုင်းကို ပြရန်'
    },
    id: {
      'rua.status.title': 'Tersedia sekarang',
      'rua.tagline': 'Target desain: uji coba gratis berhenti setelah 30 hari kecuali pengguna secara tegas melanjutkannya. Rincian berikut menjelaskan desain teknis dan operasional, bukan ketersediaan layanan saat ini.',
      'rua.status.body': 'Halaman ini mendokumentasikan desain layanan RUA. Pendaftaran atau aktivasi tidak tersedia di sini. Laporan RUA yang sudah Anda miliki dapat dianalisis dengan RUA Analyzer yang berjalan lokal di browser.',
      'rua.status.action': 'Buka RUA Analyzer',
      'rua.technical.summary': 'Tampilkan desain teknis dan operasional'
    },
    et: {
      'rua.status.title': 'Praegu kasutatav',
      'rua.tagline': 'Kavandi eesmärk: tasuta prooviperiood lõpeb 30 päeva pärast, kui kasutaja seda selgelt ei jätka. Allolev kirjeldab tehnilist ja töökorralduslikku kavandit, mitte teenuse praegust saadavust.',
      'rua.status.body': 'See leht kirjeldab RUA teenuse kavandit. Siin ei saa teenusega liituda ega seda aktiveerida. Olemasolevaid RUA aruandeid saab analüüsida brauseris lokaalselt töötava RUA Analyzeriga.',
      'rua.status.action': 'Ava RUA Analyzer',
      'rua.technical.summary': 'Näita tehnilist ja töökorralduslikku kavandit'
    },
    zh: {
      'rua.status.title': '当前可用功能',
      'rua.tagline': '设计目标：除非用户明确选择继续，否则免费试用在30天后停止。以下内容介绍技术和运营设计，并不表示服务当前已经开放。',
      'rua.status.body': '本页介绍 RUA 服务的设计，不能在此申请或启用服务。你可以使用在浏览器本地运行的 RUA Analyzer 分析已有的 RUA 报告。',
      'rua.status.action': '打开 RUA Analyzer',
      'rua.technical.summary': '显示技术与运营设计'
    },
    ru: {
      'rua.status.title': 'Доступно сейчас',
      'rua.tagline': 'Цель проекта: бесплатный период прекращается через 30 дней без явного продления. Ниже описана техническая и эксплуатационная схема, а не текущая доступность службы.',
      'rua.status.body': 'Эта страница описывает проект службы RUA. Зарегистрироваться или активировать службу здесь нельзя. Имеющиеся отчёты RUA можно проанализировать в RUA Analyzer, который работает локально в браузере.',
      'rua.status.action': 'Открыть RUA Analyzer',
      'rua.technical.summary': 'Показать техническую и эксплуатационную схему'
    },
    bn: {
      'rua.status.title': 'এখন যা ব্যবহার করা যায়',
      'rua.tagline': 'Design লক্ষ্য: user স্পষ্টভাবে চালিয়ে না গেলে free trial 30 দিন পর বন্ধ হবে। নিচের তথ্য বর্তমান service availability নয়; এটি technical ও operational design বর্ণনা করে।',
      'rua.status.body': 'এই পৃষ্ঠায় RUA service-এর design বর্ণনা করা হয়েছে। এখান থেকে service-এ নিবন্ধন বা activation করা যায় না। আপনার কাছে থাকা RUA report browser-এর ভেতরে চলা RUA Analyzer দিয়ে বিশ্লেষণ করতে পারেন।',
      'rua.status.action': 'RUA Analyzer খুলুন',
      'rua.technical.summary': 'প্রযুক্তিগত ও পরিচালন design দেখুন'
    }
  };
  for (const [lang, entries] of Object.entries(statusCopy)) add(lang, entries);
})();

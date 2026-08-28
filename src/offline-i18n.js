import { LANG_STORAGE_KEY, SUPPORTED_LANGS } from './i18n.js?v=21';

const MESSAGES = {
	ja: ['DMARC4all オフライン', 'オフライン', 'ライブ診断には接続が必要です', 'アプリ画面はオフラインでも開けますが、DNS照会と、明示的に有効化したRDAP／HTTPS参照チェックにはネットワーク接続が必要です。', 'クイック診断を開く', 'RUAガイドを開く'],
	en: ['DMARC4all Offline', 'Offline', 'Connection needed for live checks', 'The app shell is available offline, but live DNS checks and any explicitly enabled RDAP/HTTPS reference checks need a network connection.', 'Open Quick Check', 'Open RUA Guide'],
	es: ['DMARC4all sin conexión', 'Sin conexión', 'Se necesita conexión para las comprobaciones en vivo', 'La aplicación puede abrirse sin conexión, pero las consultas DNS y las comprobaciones RDAP/HTTPS activadas expresamente requieren acceso a la red.', 'Abrir diagnóstico rápido', 'Abrir guía de RUA'],
	de: ['DMARC4all offline', 'Offline', 'Live-Prüfungen benötigen eine Verbindung', 'Die App-Oberfläche ist offline verfügbar. DNS-Abfragen und ausdrücklich aktivierte RDAP-/HTTPS-Referenzprüfungen benötigen jedoch eine Netzwerkverbindung.', 'Schnellcheck öffnen', 'RUA-Leitfaden öffnen'],
	ko: ['DMARC4all 오프라인', '오프라인', '실시간 진단에는 연결이 필요합니다', '앱 화면은 오프라인에서도 열 수 있지만 DNS 조회와 명시적으로 활성화한 RDAP/HTTPS 참조 확인에는 네트워크 연결이 필요합니다.', '빠른 진단 열기', 'RUA 안내 열기'],
	vi: ['DMARC4all ngoại tuyến', 'Ngoại tuyến', 'Cần kết nối để kiểm tra trực tiếp', 'Giao diện ứng dụng có thể mở khi ngoại tuyến, nhưng truy vấn DNS và kiểm tra tham chiếu RDAP/HTTPS được bật rõ ràng cần kết nối mạng.', 'Mở kiểm tra nhanh', 'Mở hướng dẫn RUA'],
	th: ['DMARC4all ออฟไลน์', 'ออฟไลน์', 'ต้องเชื่อมต่อเพื่อการตรวจสอบแบบสด', 'เปิดหน้าจอแอปแบบออฟไลน์ได้ แต่การค้นหา DNS และการตรวจสอบอ้างอิง RDAP/HTTPS ที่เปิดใช้อย่างชัดเจนต้องใช้การเชื่อมต่อเครือข่าย', 'เปิดการตรวจสอบด่วน', 'เปิดคู่มือ RUA'],
	km: ['DMARC4all ក្រៅបណ្តាញ', 'ក្រៅបណ្តាញ', 'ត្រូវការការតភ្ជាប់សម្រាប់ការពិនិត្យផ្ទាល់', 'អាចបើកផ្ទាំងកម្មវិធីក្រៅបណ្តាញបាន ប៉ុន្តែការស្វែងរក DNS និងការពិនិត្យយោង RDAP/HTTPS ដែលបានបើកជាក់លាក់ ត្រូវការបណ្តាញ។', 'បើកការពិនិត្យរហ័ស', 'បើកមគ្គុទ្ទេសក៍ RUA'],
	my: ['DMARC4all အော့ဖ်လိုင်း', 'အော့ဖ်လိုင်း', 'တိုက်ရိုက်စစ်ဆေးရန် ချိတ်ဆက်မှုလိုအပ်သည်', 'အက်ပ်မျက်နှာပြင်ကို အော့ဖ်လိုင်းတွင် ဖွင့်နိုင်သော်လည်း DNS စုံစမ်းမှုနှင့် သီးခြားဖွင့်ထားသော RDAP/HTTPS ရည်ညွှန်းစစ်ဆေးမှုများအတွက် ကွန်ရက်လိုအပ်သည်။', 'အမြန်စစ်ဆေးမှုဖွင့်ရန်', 'RUA လမ်းညွှန်ဖွင့်ရန်'],
	id: ['DMARC4all luring', 'Luring', 'Koneksi diperlukan untuk pemeriksaan langsung', 'Antarmuka aplikasi tersedia saat luring, tetapi kueri DNS dan pemeriksaan referensi RDAP/HTTPS yang diaktifkan secara eksplisit memerlukan jaringan.', 'Buka pemeriksaan cepat', 'Buka panduan RUA'],
	et: ['DMARC4all võrguühenduseta', 'Võrguühenduseta', 'Reaalajas kontroll vajab ühendust', 'Rakenduse kest avaneb võrguühenduseta, kuid DNS-päringud ja sõnaselgelt lubatud RDAP-/HTTPS-viitekontrollid vajavad võrguühendust.', 'Ava kiirkontroll', 'Ava RUA juhend'],
	zh: ['DMARC4all 离线', '离线', '实时检查需要网络连接', '应用界面可离线打开，但DNS查询以及明确启用的RDAP/HTTPS参考检查需要网络连接。', '打开快速检查', '打开RUA指南'],
	ru: ['DMARC4all без сети', 'Нет сети', 'Для проверки в реальном времени требуется подключение', 'Интерфейс приложения доступен без сети, но для DNS-запросов и явно включённых справочных проверок RDAP/HTTPS требуется подключение.', 'Открыть быструю проверку', 'Открыть руководство RUA'],
	bn: ['DMARC4all offline', 'Offline', 'Live পরীক্ষার জন্য connection দরকার', 'App offline-এ খোলে, কিন্তু DNS query এবং স্পষ্টভাবে চালু করা RDAP/HTTPS reference check-এর জন্য network দরকার।', 'দ্রুত পরীক্ষা খুলুন', 'RUA guide খুলুন']
};

const KEYS = ['documentTitle', 'eyebrow', 'title', 'body', 'quickCheck', 'ruaGuide'];
let saved = '';
try { saved = localStorage.getItem(LANG_STORAGE_KEY) || ''; } catch { /* storage can be unavailable */ }
const query = new URLSearchParams(location.search).get('lang') || '';
const browser = String(navigator.language || '').slice(0, 2).toLowerCase();
const lang = [query, saved, browser, document.documentElement.lang]
	.map((value) => String(value || '').slice(0, 2).toLowerCase())
	.find((value) => SUPPORTED_LANGS.includes(value)) || 'en';
const dictionary = Object.fromEntries(KEYS.map((key, index) => [key, MESSAGES[lang][index]]));

document.documentElement.lang = lang;
document.title = dictionary.documentTitle;
for (const node of document.querySelectorAll('[data-offline-i18n]')) {
	node.textContent = dictionary[node.getAttribute('data-offline-i18n')] || '';
}
for (const anchor of document.querySelectorAll('a[href]')) {
	const url = new URL(anchor.getAttribute('href'), location.href);
	url.searchParams.set('lang', lang);
	anchor.setAttribute('href', `${url.pathname.split('/').pop()}${url.search}${url.hash}`);
}

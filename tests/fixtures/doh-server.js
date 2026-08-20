import { createServer } from 'node:http';

const server = createServer((request, response) => {
	const url = new URL(request.url, 'http://127.0.0.1');
	const name = url.searchParams.get('name');
	const type = url.searchParams.get('type');
	let payload = { Status: 0, Answer: [] };
	if (name === '_dmarc.example.com') {
		payload.Answer = [{ name, type: 16, TTL: 300, data: '"v=DMARC1; p=reject; rua=mailto:dmarc@example.com"' }];
	} else if (name === 'example.com' && type === 'TXT') {
		const includes = Array.from({ length: 11 }, (_, index) => `include:s${index}.example`).join(' ');
		payload.Answer = [{ name, type: 16, TTL: 300, data: `"v=spf1 ${includes} -all"` }];
	} else if (name === 'example.com' && type === 'MX') {
		payload.Answer = [{ name, type: 15, TTL: 300, data: '10 mail.example.com.' }];
	} else if (name === 'missing._domainkey.example.com') {
		payload = { Status: 3, Answer: [] };
	}
	response.writeHead(200, { 'content-type': 'application/dns-json' });
	response.end(JSON.stringify(payload));
});

server.listen(0, '127.0.0.1', () => {
	process.stdout.write(`${server.address().port}\n`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => server.close(() => process.exit(0)));
}

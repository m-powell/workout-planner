// Generates simple solid-color placeholder PNG icons for the PWA manifest.
// Replace static/icons/*.png with real artwork later — this just unblocks installability.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

function crc32(buf) {
	let c;
	const table = crc32.table ?? (crc32.table = (() => {
		const t = new Uint32Array(256);
		for (let n = 0; n < 256; n++) {
			c = n;
			for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
			t[n] = c;
		}
		return t;
	})());
	let crc = 0xffffffff;
	for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
	return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
	const typeBuf = Buffer.from(type, 'ascii');
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length);
	const crcBuf = Buffer.alloc(4);
	crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
	return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function solidPng(size, [r, g, b], marginRatio = 0) {
	const margin = Math.round(size * marginRatio);
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(size, 0);
	ihdr.writeUInt32BE(size, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 2; // color type: RGB
	ihdr[10] = 0;
	ihdr[11] = 0;
	ihdr[12] = 0;

	const rowLen = size * 3;
	const raw = Buffer.alloc((rowLen + 1) * size);
	for (let y = 0; y < size; y++) {
		const rowStart = y * (rowLen + 1);
		raw[rowStart] = 0; // filter: none
		for (let x = 0; x < size; x++) {
			const inBounds = x >= margin && x < size - margin && y >= margin && y < size - margin;
			const px = rowStart + 1 + x * 3;
			if (inBounds) {
				raw[px] = r;
				raw[px + 1] = g;
				raw[px + 2] = b;
			} else {
				raw[px] = 15;
				raw[px + 1] = 23;
				raw[px + 2] = 42; // slate-950 background
			}
		}
	}

	const idat = deflateSync(raw);
	const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
	return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

mkdirSync('static/icons', { recursive: true });
const emerald = [16, 185, 129];

writeFileSync('static/icons/icon-192.png', solidPng(192, emerald, 0));
writeFileSync('static/icons/icon-512.png', solidPng(512, emerald, 0));
writeFileSync('static/icons/icon-maskable-512.png', solidPng(512, emerald, 0.15));

console.log('Generated placeholder icons in static/icons/');

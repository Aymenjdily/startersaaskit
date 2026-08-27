/**
 * Builds `public/og.png`, the 1200x630 card social platforms show.
 *
 * ## Why a script and not a checked-in image somebody made once
 *
 * A social card is derived from the logo and the brand colour. Committed as an
 * opaque binary it drifts the first time either changes, and nothing in a diff
 * says so. This regenerates it from `public/logo-trimmed.png`, so the card is
 * always the current mark on the current background:
 *
 *     node scripts/build-og-image.mjs
 *
 * ## Why it decodes and encodes PNG by hand
 *
 * The alternative is a dependency — sharp, canvas, satori — each of which
 * brings native binaries or a font pipeline to composite one image onto
 * another. `zlib` is in Node, PNG's container is four chunk types, and the
 * whole job is about a hundred lines. It is not a general PNG library and does
 * not pretend to be: it reads the 8-bit RGB/RGBA files this repo actually has
 * and refuses anything else rather than producing quiet nonsense.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";

const WIDTH = 1200;
const HEIGHT = 630;

/** `--color-base` from `src/styles.css`. The card has to match the site. */
const BACKGROUND = [0x0d, 0x10, 0x0f];

const SOURCE = "public/logo-trimmed.png";
const OUTPUT = "public/og.png";

/** How much of the card's width the wordmark takes. */
const LOGO_WIDTH_RATIO = 0.62;

// ---------------------------------------------------------------- decoding --

/** Every chunk in a PNG, in order, as `{ type, data }`. */
function chunks(file) {
	const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

	if (!file.subarray(0, 8).equals(signature)) throw new Error("not a PNG");

	const out = [];

	for (let at = 8; at < file.length; ) {
		const length = file.readUInt32BE(at);
		const type = file.toString("ascii", at + 4, at + 8);

		out.push({ type, data: file.subarray(at + 8, at + 8 + length) });
		/* 4 length + 4 type + data + 4 CRC. */
		at += 12 + length;
	}

	return out;
}

/**
 * A PNG as flat RGBA.
 *
 * Each scanline carries a filter byte that describes how its bytes were
 * predicted from the ones above and to the left; undoing that is the only real
 * work here. The five filter types are the whole of PNG's compression cleverness
 * and they are why a decoder cannot just inflate and cast.
 */
function decode(file) {
	const parts = chunks(file);
	const header = parts.find((one) => one.type === "IHDR");

	if (!header) throw new Error("no IHDR");

	const width = header.data.readUInt32BE(0);
	const height = header.data.readUInt32BE(4);
	const depth = header.data.readUInt8(8);
	const colour = header.data.readUInt8(9);

	if (depth !== 8) throw new Error(`only 8-bit supported, got ${depth}`);
	if (colour !== 2 && colour !== 6) {
		throw new Error(`only RGB and RGBA supported, got colour type ${colour}`);
	}

	const channels = colour === 6 ? 4 : 3;
	const raw = inflateSync(
		Buffer.concat(parts.filter((one) => one.type === "IDAT").map((one) => one.data)),
	);

	const stride = width * channels;
	const pixels = Buffer.alloc(width * height * 4);
	let previous = Buffer.alloc(stride);

	for (let y = 0; y < height; y++) {
		const at = y * (stride + 1);
		const filter = raw[at];
		const line = Buffer.from(raw.subarray(at + 1, at + 1 + stride));

		for (let i = 0; i < stride; i++) {
			const left = i >= channels ? line[i - channels] : 0;
			const up = previous[i];
			const upLeft = i >= channels ? previous[i - channels] : 0;

			if (filter === 1) line[i] = (line[i] + left) & 0xff;
			else if (filter === 2) line[i] = (line[i] + up) & 0xff;
			else if (filter === 3) line[i] = (line[i] + ((left + up) >> 1)) & 0xff;
			else if (filter === 4) line[i] = (line[i] + paeth(left, up, upLeft)) & 0xff;
			else if (filter !== 0) throw new Error(`bad filter ${filter}`);
		}

		for (let x = 0; x < width; x++) {
			const from = x * channels;
			const to = (y * width + x) * 4;

			pixels[to] = line[from];
			pixels[to + 1] = line[from + 1];
			pixels[to + 2] = line[from + 2];
			pixels[to + 3] = channels === 4 ? line[from + 3] : 0xff;
		}

		previous = line;
	}

	return { width, height, pixels };
}

/** PNG's own predictor: whichever neighbour is closest to their gradient. */
function paeth(a, b, c) {
	const p = a + b - c;
	const pa = Math.abs(p - a);
	const pb = Math.abs(p - b);
	const pc = Math.abs(p - c);

	if (pa <= pb && pa <= pc) return a;
	return pb <= pc ? b : c;
}

// ---------------------------------------------------------------- resizing --

/**
 * Box filter, not nearest neighbour.
 *
 * The wordmark shrinks to roughly a third of its width, and nearest neighbour
 * at that ratio throws away two of every three pixels — which on type shows up
 * as broken stems and ragged curves. Averaging the source rectangle each
 * destination pixel covers is a few more lines and the difference between a
 * logo and a smear.
 *
 * Alpha is premultiplied for the average and undone afterwards, or transparent
 * pixels drag their (arbitrary) colour into the edges and the mark gets a halo.
 */
function resize(image, width, height) {
	const out = Buffer.alloc(width * height * 4);
	const scaleX = image.width / width;
	const scaleY = image.height / height;

	for (let y = 0; y < height; y++) {
		const fromY = Math.floor(y * scaleY);
		const toY = Math.max(fromY + 1, Math.floor((y + 1) * scaleY));

		for (let x = 0; x < width; x++) {
			const fromX = Math.floor(x * scaleX);
			const toX = Math.max(fromX + 1, Math.floor((x + 1) * scaleX));

			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			let n = 0;

			for (let sy = fromY; sy < toY; sy++) {
				for (let sx = fromX; sx < toX; sx++) {
					const at = (sy * image.width + sx) * 4;
					const alpha = image.pixels[at + 3] / 255;

					r += image.pixels[at] * alpha;
					g += image.pixels[at + 1] * alpha;
					b += image.pixels[at + 2] * alpha;
					a += image.pixels[at + 3];
					n++;
				}
			}

			const at = (y * width + x) * 4;
			const alpha = a / n / 255;

			out[at] = alpha ? Math.round(r / n / alpha) : 0;
			out[at + 1] = alpha ? Math.round(g / n / alpha) : 0;
			out[at + 2] = alpha ? Math.round(b / n / alpha) : 0;
			out[at + 3] = Math.round(a / n);
		}
	}

	return { width, height, pixels: out };
}

// ---------------------------------------------------------------- encoding --

function chunk(type, data) {
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length);

	const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(body));

	return Buffer.concat([length, body, crc]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
	let c = n;
	for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	return c >>> 0;
});

function crc32(buffer) {
	let c = 0xffffffff;
	for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

/** Opaque RGB out: the card is never composited over anything. */
function encode({ width, height, pixels }) {
	const stride = width * 3;
	const raw = Buffer.alloc(height * (stride + 1));

	for (let y = 0; y < height; y++) {
		/* Filter 0. The image is a flat background behind a logo, so the
		   predictors buy little and cost a pass. */
		raw[y * (stride + 1)] = 0;
		for (let x = 0; x < width; x++) {
			const from = (y * width + x) * 4;
			const to = y * (stride + 1) + 1 + x * 3;

			raw[to] = pixels[from];
			raw[to + 1] = pixels[from + 1];
			raw[to + 2] = pixels[from + 2];
		}
	}

	const header = Buffer.alloc(13);
	header.writeUInt32BE(width, 0);
	header.writeUInt32BE(height, 4);
	header.writeUInt8(8, 8);
	header.writeUInt8(2, 9);

	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk("IHDR", header),
		chunk("IDAT", deflateSync(raw, { level: 9 })),
		chunk("IEND", Buffer.alloc(0)),
	]);
}

// ------------------------------------------------------------------- build --

const logo = decode(readFileSync(SOURCE));
const logoWidth = Math.round(WIDTH * LOGO_WIDTH_RATIO);
const scaled = resize(
	logo,
	logoWidth,
	Math.round((logo.height / logo.width) * logoWidth),
);

const card = Buffer.alloc(WIDTH * HEIGHT * 4);

for (let i = 0; i < WIDTH * HEIGHT; i++) {
	card[i * 4] = BACKGROUND[0];
	card[i * 4 + 1] = BACKGROUND[1];
	card[i * 4 + 2] = BACKGROUND[2];
	card[i * 4 + 3] = 0xff;
}

const offsetX = Math.round((WIDTH - scaled.width) / 2);
const offsetY = Math.round((HEIGHT - scaled.height) / 2);

for (let y = 0; y < scaled.height; y++) {
	for (let x = 0; x < scaled.width; x++) {
		const from = (y * scaled.width + x) * 4;
		const alpha = scaled.pixels[from + 3] / 255;

		if (alpha === 0) continue;

		const to = ((y + offsetY) * WIDTH + (x + offsetX)) * 4;

		/* Source-over. The logo is antialiased, so its edge pixels are partly
		   transparent and have to blend rather than replace. */
		for (let c = 0; c < 3; c++) {
			card[to + c] = Math.round(
				scaled.pixels[from + c] * alpha + card[to + c] * (1 - alpha),
			);
		}
	}
}

const png = encode({ width: WIDTH, height: HEIGHT, pixels: card });

writeFileSync(OUTPUT, png);

console.log(
	`${OUTPUT}  ${WIDTH}x${HEIGHT}  ${(png.length / 1024).toFixed(0)}KB  ` +
		`sha256:${createHash("sha256").update(png).digest("hex").slice(0, 12)}`,
);

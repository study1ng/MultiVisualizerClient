// Distinct colors for label IDs (1-based), reused cyclically.
const LABEL_COLORS: readonly [number, number, number][] = [
	[255, 80, 80], [80, 200, 120], [90, 140, 255], [240, 200, 60],
	[200, 100, 240], [60, 220, 220], [255, 150, 60],
];

const labelColor = (id: number) => LABEL_COLORS[(id - 1) % LABEL_COLORS.length];

const clamp255 = (n: number) => (n < 0 ? 0 : n > 255 ? 255 : n);

/**
 * Render one slice to a canvas: window the grayscale base (WL/WW) and
 * alpha-blend colored labels on top. A missing base renders as black.
 */
export function drawSlice(
	canvas: HTMLCanvasElement,
	sliceData: Float32Array | null,
	width: number,
	height: number,
	wl: number,
	ww: number,
	labelData?: Int32Array | null,
	labelAlpha = 0.4,
): void {
	const ctx = canvas.getContext("2d")!;
	canvas.width = width;
	canvas.height = height;

	const lo = wl - ww / 2; // lower window bound
	const scale = 255 / (ww || 1); // intensity -> 0..255

	const imageData = ctx.createImageData(width, height);
	const d = imageData.data;
	const total = width * height;

	for (let i = 0; i < total; i++) {
		const n = sliceData ? clamp255((sliceData[i] - lo) * scale) : 0;

		const idx = i * 4;
		const id = labelData ? labelData[i] : 0;
		if (id > 0) {
			const [r, g, b] = labelColor(id);
			d[idx] = n * (1 - labelAlpha) + r * labelAlpha;
			d[idx + 1] = n * (1 - labelAlpha) + g * labelAlpha;
			d[idx + 2] = n * (1 - labelAlpha) + b * labelAlpha;
		} else {
			d[idx] = d[idx + 1] = d[idx + 2] = n;
		}
		d[idx + 3] = 255;
	}
	ctx.putImageData(imageData, 0, 0);
}

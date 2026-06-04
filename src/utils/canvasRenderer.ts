const LABEL_COLORS: [number, number, number][] = [
	[255, 80, 80], [80, 200, 120], [90, 140, 255], [240, 200, 60],
	[200, 100, 240], [60, 220, 220], [255, 150, 60],
];

function labelColor(id: number): [number, number, number] {
	return LABEL_COLORS[(id - 1) % LABEL_COLORS.length];
}

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

	const lo = wl - ww / 2;
	const scale = 255 / (ww || 1);

	const imageData = ctx.createImageData(width, height);
	const d = imageData.data;
	const total = width * height;

	for (let i = 0; i < total; i++) {
		// base が無ければ黒(0)
		let n = 0;
		if (sliceData) {
			n = (sliceData[i] - lo) * scale;
			n = n < 0 ? 0 : n > 255 ? 255 : n;
		}

		const idx = i * 4;
		const id = labelData ? labelData[i] : 0;
		if (id > 0) {
			const [r, g, b] = labelColor(id);
			d[idx]     = n * (1 - labelAlpha) + r * labelAlpha;
			d[idx + 1] = n * (1 - labelAlpha) + g * labelAlpha;
			d[idx + 2] = n * (1 - labelAlpha) + b * labelAlpha;
		} else {
			d[idx] = d[idx + 1] = d[idx + 2] = n;
		}
		d[idx + 3] = 255;
	}
	ctx.putImageData(imageData, 0, 0);
}
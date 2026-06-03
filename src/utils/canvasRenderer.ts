const LABEL_COLORS: [number, number, number][] = [
    [255, 80, 80],   // 1
    [80, 200, 120],  // 2
    [90, 140, 255],  // 3
    [240, 200, 60],  // 4
    [200, 100, 240], // 5
    [60, 220, 220],  // 6
    [255, 150, 60],  // 7
];

function labelColor(id: number): [number, number, number] {
    // 想定外のIDはパレットを循環して割り当て
    return LABEL_COLORS[(id - 1) % LABEL_COLORS.length];
}

export function drawSlice(
    canvas: HTMLCanvasElement,
    sliceData: Float32Array,
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
    for (let i = 0; i < sliceData.length; i++) {
        let n = (sliceData[i] - lo) * scale;
        n = n < 0 ? 0 : n > 255 ? 255 : n;

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
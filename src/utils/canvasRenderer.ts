export function drawSlice(
    canvas: HTMLCanvasElement,
    sliceData: Float32Array,
    width: number,
    height: number,
    wl: number,
    ww: number
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
        d[idx] = d[idx + 1] = d[idx + 2] = n;
        d[idx + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
}
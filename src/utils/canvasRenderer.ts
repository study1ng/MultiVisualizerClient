export function drawSlice(
    canvas: HTMLCanvasElement,
    sliceData: Float32Array,
    width: number,
    height: number
): void {
    const ctx = canvas.getContext("2d")!;
    canvas.width = width;
    canvas.height = height;

    // 実際の値の範囲を確認
    let min = Infinity, max = -Infinity;
    for (const v of sliceData) {
        if (v < min) min = v;
        if (v > max) max = v;
    }
    console.log("スライスの値の範囲:", min, "〜", max); // ← 確認

    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < sliceData.length; i++) {
        // クランプして正規化（範囲外の値を切り捨て）
        const normalized = Math.max(0, Math.min(255,
            ((sliceData[i] - min) / (max - min)) * 255
        ));
        const idx = i * 4;
        imageData.data[idx]     = normalized;
        imageData.data[idx + 1] = normalized;
        imageData.data[idx + 2] = normalized;
        imageData.data[idx + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
}
import npyjs from "npyjs";
import {unzlibSync } from "fflate"; 

export interface ParsedNpy {
    data: ArrayBufferView;
    shape: number[];
    dtype: string;
}

export async function parseNpy(uint8: Uint8Array): Promise<ParsedNpy> {
    const decompressed = unzlibSync(uint8);
    const buffer = decompressed.buffer.slice(
        decompressed.byteOffset,
        decompressed.byteOffset + decompressed.byteLength
    ) as ArrayBuffer;

    const npy = new npyjs();
    return await npy.load(buffer);
}

export function getAxialSlice(
    data: ArrayBufferView,
    shape: number[],
    index: number
): Float32Array {
    const [X, Y, Z] = shape;

    const typedData = new Float64Array(
        data.buffer,
        data.byteOffset,
        data.byteLength / Float64Array.BYTES_PER_ELEMENT
    );

    // 値の範囲をデバッグ
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < typedData.length; i++) {
        if (typedData[i] < min) min = typedData[i];
        if (typedData[i] > max) max = typedData[i];
    }
    console.log("値の範囲:", min, "〜", max); // ← 確認

    const slice = new Float32Array(X * Y);
    for (let y = 0; y < Y; y++) {
        for (let x = 0; x < X; x++) {
            slice[y * X + x] = typedData[x + y * X + index * X * Y];
        }
    }
    return slice;
}
import npyjs from "npyjs";
import { unzlibSync } from "fflate";

export interface ParsedNpy {
    data: ArrayBufferView;
    shape: number[];
    dtype: string;
    fortranOrder: boolean; // 追加
}

// npyヘッダから fortran_order を読む（v1.0 / v2.0 対応）
function readFortranOrder(buf: Uint8Array): boolean {
    const major = buf[6];
    let headerStart: number;
    let headerLen: number;
    if (major === 1) {
        headerLen = buf[8] | (buf[9] << 8);            // uint16 LE
        headerStart = 10;
    } else {
        headerLen = buf[8] | (buf[9] << 8) | (buf[10] << 16) | (buf[11] << 24); // uint32 LE
        headerStart = 12;
    }
    const header = new TextDecoder("latin1").decode(
        buf.subarray(headerStart, headerStart + headerLen)
    );
    return /'fortran_order':\s*True/.test(header);
}

export async function parseNpy(uint8: Uint8Array): Promise<ParsedNpy> {
    const decompressed = unzlibSync(uint8);
    const buffer = decompressed.buffer.slice(
        decompressed.byteOffset,
        decompressed.byteOffset + decompressed.byteLength
    ) as ArrayBuffer;

    const fortranOrder = readFortranOrder(decompressed); // ← 並び順を取得
    console.log("fortran_order:", fortranOrder);          // 確認用

    const npy = new npyjs();
    const result = await npy.load(buffer);
    return { ...result, fortranOrder };
}

export function getAxialSlice(
    data: ArrayBufferView,
    shape: number[],
    index: number,
    fortranOrder: boolean
): Float32Array {
    const [S0, S1, S2] = shape; // 軸2をスライス軸、軸0=幅・軸1=高さとする

    const typed = new Float64Array(
        data.buffer,
        data.byteOffset,
        data.byteLength / Float64Array.BYTES_PER_ELEMENT
    );

    // 並び順に応じた各軸のストライド
    let st0: number, st1: number, st2: number;
    if (fortranOrder) {
        st0 = 1;          // 列優先：最初の軸が最も速い
        st1 = S0;
        st2 = S0 * S1;
    } else {
        st2 = 1;          // 行優先：最後の軸が最も速い
        st1 = S2;
        st0 = S1 * S2;
    }

    const slice = new Float32Array(S0 * S1);
    for (let y = 0; y < S1; y++) {
        for (let x = 0; x < S0; x++) {
            slice[y * S0 + x] = typed[x * st0 + y * st1 + index * st2];
        }
    }
    return slice;
}
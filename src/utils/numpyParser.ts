import npyjs from "npyjs";
import { unzlibSync } from "fflate";

export interface ParsedNpy {
    data: ArrayBufferView;
    shape: number[];
    dtype: string;
    fortranOrder: boolean; 
}

function readFortranOrder(buf: Uint8Array): boolean {
    const major = buf[6];
    let headerStart: number;
    let headerLen: number;
    if (major === 1) {
        headerLen = buf[8] | (buf[9] << 8);            
        headerStart = 10;
    } else {
        headerLen = buf[8] | (buf[9] << 8) | (buf[10] << 16) | (buf[11] << 24); 
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

    const fortranOrder = readFortranOrder(decompressed); 
    console.log("fortran_order:", fortranOrder);          
    const npy = new npyjs();
    const result = await npy.load(buffer);
    return { ...result, fortranOrder };
}

export interface Volume {
    data: Float32Array; // [count][height][width]
    width: number;      // shape[0]
    height: number;     // shape[1]
    count: number;      // shape[2]
    min: number;
    max: number;
}


// ロード時に1回だけ呼ぶ：
export function buildVolume(parsed: ParsedNpy): Volume {
    const [S0, S1, S2] = parsed.shape;
    const width = S0, height = S1, count = S2;

    const src = new Float64Array(
        parsed.data.buffer,
        parsed.data.byteOffset,
        parsed.data.byteLength / Float64Array.BYTES_PER_ELEMENT
    );

    let st0: number, st1: number, st2: number;
    if (parsed.fortranOrder) {
        st0 = 1; st1 = S0; st2 = S0 * S1;
    } else {
        st2 = 1; st1 = S2; st0 = S1 * S2;
    }

    const sliceSize = width * height;
    const out = new Float32Array(count * sliceSize);
    let min = Infinity, max = -Infinity;

    for (let s = 0; s < count; s++) {
        const base = s * sliceSize;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const v = src[x * st0 + y * st1 + s * st2];
                out[base + y * width + x] = v;
                if (v < min) min = v;
                if (v > max) max = v;
            }
        }
    }
    return { data: out, width, height, count, min, max };
}
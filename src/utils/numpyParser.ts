import npyjs from "npyjs";
import { unzlibSync } from "fflate";

export interface ParsedNpy {
    data: ArrayBufferView;
    shape: number[];
    dtype: string;
    fortranOrder: boolean;
}

/** Read the `fortran_order` flag from a .npy header (supports v1 and v2). */
function readFortranOrder(buf: Uint8Array): boolean {
    const major = buf[6];
    // v1 stores a 2-byte header length at offset 8; v2 stores a 4-byte one.
    const headerLen =
        major === 1
            ? buf[8] | (buf[9] << 8)
            : buf[8] | (buf[9] << 8) | (buf[10] << 16) | (buf[11] << 24);
    const headerStart = major === 1 ? 10 : 12;
    const header = new TextDecoder("latin1").decode(
        buf.subarray(headerStart, headerStart + headerLen),
    );
    return /'fortran_order':\s*True/.test(header);
}

/** Decompress a zlib-wrapped .npy blob and parse it into a typed array. */
export async function parseNpy(uint8: Uint8Array): Promise<ParsedNpy> {
    const decompressed = unzlibSync(uint8);
    const buffer = decompressed.buffer.slice(
        decompressed.byteOffset,
        decompressed.byteOffset + decompressed.byteLength,
    ) as ArrayBuffer;

    const fortranOrder = readFortranOrder(decompressed);
    const npy = new npyjs();
    const result = await npy.load(buffer);
    return { ...result, fortranOrder };
}

/** Element strides for a 3D array, depending on its memory order. */
function strides(shape: number[], fortranOrder: boolean) {
    const [s0, s1, s2] = shape;
    return fortranOrder
        ? { st0: 1, st1: s0, st2: s0 * s1 } // column-major
        : { st0: s1 * s2, st1: s2, st2: 1 }; // row-major
}

/**
 * Destination index of a voxel within one slice. Applies a 180deg in-plane
 * rotation (flip both X and Y) so the volume matches the canvas orientation.
 */
function flippedIndex(x: number, y: number, width: number, height: number) {
    return (height - 1 - y) * width + (width - 1 - x);
}

export interface Volume {
    data: Float32Array; // [count][height][width]
    width: number; // shape[0]
    height: number; // shape[1]
    count: number; // shape[2]
    min: number;
    max: number;
}

/** Build a CT volume (grayscale floats) from a parsed .npy array. */
export function buildVolume(parsed: ParsedNpy): Volume {
    const [width, height, count] = parsed.shape;
    // Use the typed array directly so any numeric dtype is handled correctly.
    const src = parsed.data as unknown as ArrayLike<number>;
    const { st0, st1, st2 } = strides(parsed.shape, parsed.fortranOrder);

    const sliceSize = width * height;
    const out = new Float32Array(count * sliceSize);
    let min = Infinity;
    let max = -Infinity;

    for (let s = 0; s < count; s++) {
        const base = s * sliceSize;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const v = src[x * st0 + y * st1 + s * st2];
                out[base + flippedIndex(x, y, width, height)] = v;
                if (v < min) min = v;
                if (v > max) max = v;
            }
        }
    }
    return { data: out, width, height, count, min, max };
}

export interface LabelVolume {
    data: Int32Array; // [count][height][width] label IDs
    width: number;
    height: number;
    count: number;
    labels: number[]; // distinct non-zero label IDs, ascending
}

/** Build a label volume (integer IDs) from a parsed .npy array. */
export function buildLabelVolume(parsed: ParsedNpy): LabelVolume {
    const [width, height, count] = parsed.shape;
    const src = parsed.data as unknown as ArrayLike<number>;
    const { st0, st1, st2 } = strides(parsed.shape, parsed.fortranOrder);

    const sliceSize = width * height;
    const out = new Int32Array(count * sliceSize);
    const labelSet = new Set<number>();

    for (let s = 0; s < count; s++) {
        const base = s * sliceSize;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const v = src[x * st0 + y * st1 + s * st2] | 0; // coerce to int
                out[base + flippedIndex(x, y, width, height)] = v;
                if (v !== 0) labelSet.add(v);
            }
        }
    }

    return {
        data: out,
        width,
        height,
        count,
        labels: [...labelSet].sort((a, b) => a - b),
    };
}

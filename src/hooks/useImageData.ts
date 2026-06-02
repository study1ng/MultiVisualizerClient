import { useState } from "react";
import get3DImage from "../api/get_3dimg";
import { parseNpy, getAxialSlice } from "../utils/numpyParser";
import type { ParsedNpy } from "../utils/numpyParser"; // 

export function useImageData() {
    const [baseParsed, setBaseParsed] = useState<ParsedNpy | null>(null);
    const [sliceIndex, setSliceIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const unzipped = await get3DImage();

            console.log("ZIPの中身:", Object.keys(unzipped));

            const parsed = await parseNpy(unzipped["base.bin"]);
            console.log("dtype:", parsed.dtype);
            console.log("shape:", parsed.shape);

            setBaseParsed(parsed);
            setSliceIndex(Math.floor(parsed.shape[2] / 2));
        } finally {
            setLoading(false);
        }
    };
    const currentSlice = baseParsed
        ? getAxialSlice(baseParsed.data, baseParsed.shape, sliceIndex)
        : null;

    return { baseParsed, sliceIndex, setSliceIndex, currentSlice, load, loading };
}
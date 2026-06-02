import { useState, useMemo, useCallback } from "react";
import get3DImage from "../api/get_3dimg";
import { parseNpy, buildVolume } from "../utils/numpyParser";
import type { Volume } from "../utils/numpyParser";

export function useImageData() {
    const [volume, setVolume] = useState<Volume | null>(null);
    const [sliceIndex, setSliceIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [wl, setWl] = useState(0);
    const [ww, setWw] = useState(1);

    const load = async () => {
        setLoading(true);
        try {
            const unzipped = await get3DImage();
            const parsed = await parseNpy(unzipped["base.bin"]);
            const vol = buildVolume(parsed); 

            setVolume(vol);
            setSliceIndex(Math.floor(vol.count / 2));
            setWl((vol.min + vol.max) / 2);   
            setWw(vol.max - vol.min);         
        } finally {
            setLoading(false);
        }
    };

   
    const currentSlice = useMemo(() => {
        if (!volume) return null;
        const sliceSize = volume.width * volume.height;
        return volume.data.subarray(
            sliceIndex * sliceSize,
            (sliceIndex + 1) * sliceSize
        );
    }, [volume, sliceIndex]);

    const moveSlice = useCallback((deltaY: number) => {
        const dir = deltaY > 0 ? 1 : -1;
        setSliceIndex((prev) => {
            if (!volume) return prev;
            return Math.max(0, Math.min(volume.count - 1, prev + dir));
        });
    }, [volume]);

    return {
        volume, sliceIndex, setSliceIndex, currentSlice,
        load, loading, wl, setWl, ww, setWw, moveSlice,
    };
}
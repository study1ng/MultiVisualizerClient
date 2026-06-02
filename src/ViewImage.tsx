import ImageCanvas from "./components/ImageCanvas";
import { useImageData } from "./hooks/useImageData";

export default function ViewImage() {
    const {
        volume, sliceIndex, setSliceIndex, currentSlice,
        load, loading, wl, setWl, ww, setWw, moveSlice,
    } = useImageData();

    const range = volume ? volume.max - volume.min : 1;
    const step = range / 500;

    return (
        <div>
            <button onClick={load} disabled={loading}>
                {loading ? "読み込み中..." : "画像を読み込む"}
            </button>

            {volume && currentSlice && (
                <>
                    <input
                        type="range"
                        min={0}
                        max={volume.count - 1}
                        value={sliceIndex}
                        onChange={e => setSliceIndex(Number(e.target.value))}
                    />
                    <p>スライス: {sliceIndex} / {volume.count - 1}</p>

                    <div>
                        <label>WL: {Number(wl.toPrecision(4))}　</label>
                        <input
                            type="range"
                            min={volume.min} max={volume.max} step={step}
                            value={wl}
                            onChange={e => setWl(Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label>WW: {Number(ww.toPrecision(4))}　</label>
                        <input
                            type="range"
                            min={step} max={range} step={step}
                            value={ww}
                            onChange={e => setWw(Number(e.target.value))}
                        />
                    </div>

                    <ImageCanvas
                        sliceData={currentSlice}
                        width={volume.width}
                        height={volume.height}
                        wl={wl}
                        ww={ww}
                        onWheel={moveSlice}
                    />
                </>
            )}
        </div>
    );
}
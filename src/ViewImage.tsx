import ImageCanvas from "./components/ImageCanvas";
import { useImageData } from "./hooks/useImageData";

export default function ViewImage() {
    const { baseParsed, sliceIndex, setSliceIndex, currentSlice, load, loading } = useImageData();

    return (
        <div>
            <button onClick={load} disabled={loading}>
                {loading ? "読み込み中..." : "画像を読み込む"}
            </button>

            {baseParsed && currentSlice && (
                <>
                    <input
                        type="range"
                        min={0}
                        max={baseParsed.shape[2] - 1}
                        value={sliceIndex}
                        onChange={e => setSliceIndex(Number(e.target.value))}
                    />
                    <p>スライス: {sliceIndex} / {baseParsed.shape[2] - 1}</p>
                    <ImageCanvas
                        sliceData={currentSlice}
                        width={baseParsed.shape[0]}
                        height={baseParsed.shape[1]}
                    />
                </>
            )}
        </div>
    );
}
import ImageCanvas from "./components/ImageCanvas";
import { useImageData } from "./hooks/useImageData";

export default function ViewImage() {
	const {
		volume, panels, load, loading,
		wl, setWl, ww, setWw,
		showLabel, setShowLabel,
		sync, setSync,
		setSlice, moveSlice,
	} = useImageData();

	const range = volume ? volume.max - volume.min : 1;
	const step = range / 500;

	return (
		<div>
			<button onClick={load} disabled={loading}>
				{loading ? "読み込み中..." : "画像を読み込む"}
			</button>

			{volume && panels.length > 0 && (
				<>
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
					<div>
						<label>
							<input
								type="checkbox"
								checked={showLabel}
								onChange={e => setShowLabel(e.target.checked)}
							/>
							ラベルを表示
						</label>
						<label style={{ marginLeft: 16 }}>
							<input
								type="checkbox"
								checked={sync}
								onChange={e => setSync(e.target.checked)}
							/>
							スライスを同期
						</label>
					</div>

					<div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12 }}>
						{panels.map((p, i) => (
							<div key={p.name} style={{ display: "flex", flexDirection: "column" }}>
								<strong>{p.name}</strong>
								<ImageCanvas
									sliceData={p.baseSlice}
									labelData={showLabel ? p.labelSlice : null}
									width={volume.width}
									height={volume.height}
									wl={wl}
									ww={ww}
									onWheel={dy => moveSlice(i, dy)}
								/>
								<input
									type="range"
									min={0}
									max={volume.count - 1}
									value={p.sliceIndex}
									onChange={e => setSlice(i, Number(e.target.value))}
								/>
								<span>スライス: {p.sliceIndex} / {volume.count - 1}</span>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}
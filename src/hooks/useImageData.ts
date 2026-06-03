import { useState, useMemo, useCallback } from "react";
import get3DImage from "../api/get_3dimg";
import { parseNpy, buildVolume, buildLabelVolume } from "../utils/numpyParser";
import type { Volume, LabelVolume } from "../utils/numpyParser";

export interface NamedLabel {
	name: string;
	volume: LabelVolume;
}

export interface PanelSlice {
	name: string;
	baseSlice: Float32Array;
	labelSlice: Int32Array;
	sliceIndex: number;
}

// gt を先頭に、その他は名前順(数値込み)で並べる
function orderLabelKeys(keys: string[]): string[] {
	return keys.sort((a, b) => {
		const ag = a.startsWith("gt");
		const bg = b.startsWith("gt");
		if (ag && !bg) return -1;
		if (!ag && bg) return 1;
		return a.localeCompare(b, undefined, { numeric: true });
	});
}

export function useImageData() {
	const [volume, setVolume] = useState<Volume | null>(null);
	const [labels, setLabels] = useState<NamedLabel[]>([]);
	const [sliceIndices, setSliceIndices] = useState<number[]>([]);
	const [loading, setLoading] = useState(false);
	const [wl, setWl] = useState(0);
	const [ww, setWw] = useState(1);
	const [showLabel, setShowLabel] = useState(true);
	const [sync, setSync] = useState(true);

	const load = async () => {
		setLoading(true);
		try {
			const unzipped = await get3DImage();
			const parsed = await parseNpy(unzipped["base.bin"]);
			const vol = buildVolume(parsed);

			// base.bin / payload.json 以外をすべてラベルとして読み込む
			const labelKeys = orderLabelKeys(
				Object.keys(unzipped).filter(
					k => k !== "base.bin" && k !== "payload.json",
				),
			);

			const loadedLabels: NamedLabel[] = [];
			for (const key of labelKeys) {
				const p = await parseNpy(unzipped[key]);
				loadedLabels.push({
					name: key.replace(/\.bin$/, ""),
					volume: buildLabelVolume(p),
				});
			}

			const mid = Math.floor(vol.count / 2);
			setVolume(vol);
			setLabels(loadedLabels);
			setSliceIndices(loadedLabels.map(() => mid));
			setWl((vol.min + vol.max) / 2);
			setWw(vol.max - vol.min);
		} finally {
			setLoading(false);
		}
	};

	// 各パネル用のスライスを切り出す(同じベースCT + 各ラベル)
	const panels = useMemo<PanelSlice[]>(() => {
		if (!volume) return [];
		const sliceSize = volume.width * volume.height;
		return labels.map((lab, i) => {
			const si = sliceIndices[i] ?? 0;
			const baseSlice = volume.data.subarray(
				si * sliceSize,
				(si + 1) * sliceSize,
			);
			const lSize = lab.volume.width * lab.volume.height;
			const labelSlice = lab.volume.data.subarray(
				si * lSize,
				(si + 1) * lSize,
			);
			return { name: lab.name, baseSlice, labelSlice, sliceIndex: si };
		});
	}, [volume, labels, sliceIndices]);

	const clamp = useCallback(
		(v: number) => (volume ? Math.max(0, Math.min(volume.count - 1, v)) : 0),
		[volume],
	);

	// スライダー用(絶対値指定)
	const setSlice = useCallback(
		(panel: number, value: number) => {
			setSliceIndices(prev => {
				const c = clamp(value);
				if (sync) return prev.map(() => c); // 同期: 全パネルを同じ値に
				const next = [...prev];
				next[panel] = c;
				return next;
			});
		},
		[sync, clamp],
	);

	// ホイール用(相対移動)
	const moveSlice = useCallback(
		(panel: number, deltaY: number) => {
			const dir = deltaY > 0 ? 1 : -1;
			setSliceIndices(prev => {
				if (sync) {
					const c = clamp(prev[panel] + dir);
					return prev.map(() => c);
				}
				const next = [...prev];
				next[panel] = clamp(prev[panel] + dir);
				return next;
			});
		},
		[sync, clamp],
	);

	return {
		volume,
		labels,
		panels,
		loading,
		wl, setWl,
		ww, setWw,
		showLabel, setShowLabel,
		sync, setSync,
		setSlice,
		moveSlice,
		load,
	};
}
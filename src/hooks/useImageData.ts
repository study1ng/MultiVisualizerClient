import { useState, useMemo, useCallback } from "react";
import { fetchImages, type LoadRequest } from "../api/get_3dimg";
import { parseNpy, buildVolume, buildLabelVolume } from "../utils/numpyParser";
import type { Volume, LabelVolume } from "../utils/numpyParser";

export interface NamedLabel {
	name: string;
	volume: LabelVolume;
}

export interface PanelSlice {
	name: string;
	baseSlice: Float32Array | null;
	labelSlice: Int32Array | null;
	sliceIndex: number;
}

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
	const [labelAlpha, setLabelAlpha] = useState(0.4);
	const [sync, setSync] = useState(true);

	// 寸法とスライス数は base が無ければ最初のラベルから決める
	const dims = useMemo(() => {
		if (volume) return { w: volume.width, h: volume.height };
		if (labels[0]) return { w: labels[0].volume.width, h: labels[0].volume.height };
		return null;
	}, [volume, labels]);

	const count = volume ? volume.count : labels[0]?.volume.count ?? 0;

	const load = async (req: LoadRequest) => {
		setLoading(true);
		try {
			const unzipped = await fetchImages(req);

			// base.bin があれば CT ボリュームを構築（無ければ null）
			const baseBin = unzipped["base.bin"];
			const vol = baseBin ? buildVolume(await parseNpy(baseBin)) : null;

			// base.bin / payload.json 以外をすべてラベルとして読み込む
			const labelKeys = orderLabelKeys(
				Object.keys(unzipped).filter(
					(k) => k !== "base.bin" && k !== "payload.json",
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

			const cnt = vol ? vol.count : loadedLabels[0]?.volume.count ?? 0;
			const mid = Math.floor(cnt / 2);
			// ラベルがあればラベル数ぶん、無く base だけなら1パネル
			const panelCount = loadedLabels.length > 0 ? loadedLabels.length : vol ? 1 : 0;

			setVolume(vol);
			setLabels(loadedLabels);
			setSliceIndices(Array(panelCount).fill(mid));
			if (vol) {
				setWl((vol.min + vol.max) / 2);
				setWw(vol.max - vol.min);
			}
		} finally {
			setLoading(false);
		}
	};

	const panels = useMemo<PanelSlice[]>(() => {
		if (!dims) return [];
		const sliceSize = dims.w * dims.h;

		if (labels.length > 0) {
			return labels.map((lab, i) => {
				const si = sliceIndices[i] ?? 0;
				const baseSlice = volume
					? volume.data.subarray(si * sliceSize, (si + 1) * sliceSize)
					: null; // base が無ければ黒背景にラベルだけ描画
				const lSize = lab.volume.width * lab.volume.height;
				const labelSlice = lab.volume.data.subarray(si * lSize, (si + 1) * lSize);
				return { name: lab.name, baseSlice, labelSlice, sliceIndex: si };
			});
		}

		// ラベルなし・base のみ → 1パネル
		if (volume) {
			const si = sliceIndices[0] ?? 0;
			const baseSlice = volume.data.subarray(si * sliceSize, (si + 1) * sliceSize);
			return [{ name: "base", baseSlice, labelSlice: null, sliceIndex: si }];
		}
		return [];
	}, [volume, labels, sliceIndices, dims]);

	const clamp = useCallback(
		(v: number) => (count ? Math.max(0, Math.min(count - 1, v)) : 0),
		[count],
	);

	const setSlice = useCallback(
		(panel: number, value: number) => {
			setSliceIndices((prev) => {
				const c = clamp(value);
				if (sync) return prev.map(() => c);
				const next = [...prev];
				next[panel] = c;
				return next;
			});
		},
		[sync, clamp],
	);

	const moveSlice = useCallback(
		(panel: number, deltaY: number) => {
			const dir = deltaY > 0 ? 1 : -1;
			setSliceIndices((prev) => {
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
		width: dims?.w,
		height: dims?.h,
		count,
		loading,
		wl, setWl,
		ww, setWw,
		showLabel, setShowLabel,
		labelAlpha, setLabelAlpha,
		sync, setSync,
		setSlice,
		moveSlice,
		load,
	};
}
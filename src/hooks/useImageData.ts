import { useCallback, useMemo, useState } from "react";
import { fetchImages, type LoadRequest } from "../api/get_3dimg";
import { buildLabelVolume, buildVolume, parseNpy } from "../utils/numpyParser";
import type { LabelVolume, Volume } from "../utils/numpyParser";

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

/** Sort label keys so the ground truth ("gt...") comes first, then numerically. */
function orderLabelKeys(keys: string[]): string[] {
	return keys.sort((a, b) => {
		const ag = a.startsWith("gt");
		const bg = b.startsWith("gt");
		if (ag !== bg) return ag ? -1 : 1;
		return a.localeCompare(b, undefined, { numeric: true });
	});
}

/** Extract slice `index` (a width*height block) from a flat volume array. */
function sliceOf<T extends Float32Array | Int32Array>(
	data: T,
	index: number,
	size: number,
): T {
	return data.subarray(index * size, (index + 1) * size) as T;
}

export function useImageData() {
	const [volume, setVolume] = useState<Volume | null>(null);
	const [labels, setLabels] = useState<NamedLabel[]>([]);
	const [sliceIndices, setSliceIndices] = useState<number[]>([]);
	const [loading, setLoading] = useState(false);

	// Display controls.
	const [wl, setWl] = useState(0);
	const [ww, setWw] = useState(1);
	const [showLabel, setShowLabel] = useState(true);
	const [labelAlpha, setLabelAlpha] = useState(0.4);
	const [sync, setSync] = useState(true);

	// Dimensions come from the base volume, or the first label when there's no base.
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

			// Build the CT volume when base.bin is present (otherwise null).
			const baseBin = unzipped["base.bin"];
			const vol = baseBin ? buildVolume(await parseNpy(baseBin)) : null;

			// Everything except base.bin / payload.json is treated as a label.
			const labelKeys = orderLabelKeys(
				Object.keys(unzipped).filter(
					(k) => k !== "base.bin" && k !== "payload.json",
				),
			);
			const loadedLabels: NamedLabel[] = [];
			for (const key of labelKeys) {
				const parsed = await parseNpy(unzipped[key]);
				loadedLabels.push({
					name: key.replace(/\.bin$/, ""),
					volume: buildLabelVolume(parsed),
				});
			}

			const cnt = vol ? vol.count : loadedLabels[0]?.volume.count ?? 0;
			const mid = Math.floor(cnt / 2);
			// One panel per label, or a single panel for a base-only volume.
			const panelCount = loadedLabels.length || (vol ? 1 : 0);

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

	// One PanelSlice per panel, recomputed when slices/volumes change.
	const panels = useMemo<PanelSlice[]>(() => {
		if (!dims) return [];
		const baseSize = dims.w * dims.h;

		if (labels.length > 0) {
			return labels.map((lab, i) => {
				const si = sliceIndices[i] ?? 0;
				const lSize = lab.volume.width * lab.volume.height;
				return {
					name: lab.name,
					baseSlice: volume ? sliceOf(volume.data, si, baseSize) : null,
					labelSlice: sliceOf(lab.volume.data, si, lSize),
					sliceIndex: si,
				};
			});
		}

		// Base only -> a single panel.
		if (volume) {
			const si = sliceIndices[0] ?? 0;
			return [{
				name: "base",
				baseSlice: sliceOf(volume.data, si, baseSize),
				labelSlice: null,
				sliceIndex: si,
			}];
		}
		return [];
	}, [volume, labels, sliceIndices, dims]);

	const clamp = useCallback(
		(v: number) => (count ? Math.max(0, Math.min(count - 1, v)) : 0),
		[count],
	);

	// Update one panel's slice; with sync on, all panels move together.
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

	// Step one panel's slice by wheel direction (sync-aware).
	const moveSlice = useCallback(
		(panel: number, deltaY: number) => {
			const dir = deltaY > 0 ? 1 : -1;
			setSliceIndices((prev) => {
				const c = clamp(prev[panel] + dir);
				if (sync) return prev.map(() => c);
				const next = [...prev];
				next[panel] = c;
				return next;
			});
		},
		[sync, clamp],
	);

	return {
		volume, labels, panels,
		width: dims?.w, height: dims?.h, count, loading,
		wl, setWl, ww, setWw,
		showLabel, setShowLabel,
		labelAlpha, setLabelAlpha,
		sync, setSync,
		setSlice, moveSlice, load,
	};
}

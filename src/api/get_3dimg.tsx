import { unzipSync, type Unzipped } from "fflate";

export interface LoadRequest {
	base?: string;
	gt?: string;
	fn?: string[];
}

// Most recently fetched archive; shared between the viewer and the dashboard.
let _cache: Unzipped | null = null;

export function getCachedImages(): Unzipped | null {
	return _cache;
}

/**
 * Ask the server to prepare the requested volumes, then download and unzip
 * the resulting archive. env.tsx defaults are used only when every field is
 * empty; otherwise just the provided files are rendered.
 */
export async function fetchImages(req: LoadRequest): Promise<Unzipped> {
	const base = (req.base ?? "").trim();
	const gt = (req.gt ?? "").trim();
	const fn = (req.fn ?? []).map((f) => f.trim()).filter(Boolean);

	const allEmpty = !base && !gt && fn.length === 0;
	const useBase = allEmpty ? globalThis.base_filename : base;
	const useGt = allEmpty ? globalThis.gt_filename : gt;
	const useFn = allEmpty ? globalThis.fn_filenames : fn;

	const viewMethod = encodeURIComponent("ax=axial,process=normal");
	const query = new URLSearchParams();
	if (useBase) query.set("base", useBase);
	if (useGt) query.set("gt", useGt);
	for (const f of useFn) query.append("fn", f);

	// 1) The request returns a UUID identifying the prepared archive.
	const uuid: string = await (
		await fetch(`/api/${viewMethod}/?${query.toString()}`)
	).json();

	// 2) Download and unzip that archive, then cache it.
	const zipResp = await fetch(`/api/${uuid}.zip`);
	const bytes = new Uint8Array(await zipResp.arrayBuffer());

	_cache = unzipSync(bytes);
	return _cache;
}

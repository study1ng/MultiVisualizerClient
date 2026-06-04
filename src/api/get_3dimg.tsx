import { unzipSync, type Unzipped } from "fflate";

export interface LoadRequest {
	base?: string;
	gt?: string;
	fn?: string[];
}

let _unzipped: Unzipped | null = null;

// ダッシュボード等が参照する、最後に読み込んだ結果
export function getCachedImages(): Unzipped | null {
	return _unzipped;
}

export async function fetchImages(req: LoadRequest): Promise<Unzipped> {
	const base = (req.base ?? "").trim();
	const gt = (req.gt ?? "").trim();
	const fn = (req.fn ?? []).map((f) => f.trim()).filter(Boolean);

	// すべて空欄のときのみデフォルト（env.tsx）を使う
	const allEmpty = !base && !gt && fn.length === 0;
	const useBase = allEmpty ? globalThis.base_filename : base;
	const useGt = allEmpty ? globalThis.gt_filename : gt;
	const useFn = allEmpty ? globalThis.fn_filenames : fn;

	const view_method = encodeURIComponent("ax=axial,process=normal");
	const query = new URLSearchParams();
	if (useBase) query.set("base", useBase);
	if (useGt) query.set("gt", useGt);
	for (const f of useFn) query.append("fn", f);

	const url = `/api/${view_method}/?${query.toString()}`;
	const uuid = await (await fetch(url)).json();

	const zipResp = await fetch(`/api/${uuid}.zip`);
	const bytes = new Uint8Array(await zipResp.arrayBuffer());

	_unzipped = unzipSync(bytes);
	return _unzipped;
}
import { unzipSync, type Unzipped } from "fflate";
// import npyjs from "npyjs";

function promptOrDefault(message: string, fallback: string): string {
	const value = prompt(message);
	return value === null || value === "" ? fallback : value;
}

let _unzipped: Unzipped | null = null;
async function _get3DImage() {
	console.log(new Error().stack);
	const url_endpoint = "/api/";

	const view_method = encodeURIComponent("ax=axial,process=normal");
	const base_filename = promptOrDefault(
		"base_filename",
		globalThis.base_filename,
	);
	const gt_filename = promptOrDefault("gt_filename", globalThis.gt_filename);
	const filenames: string[] = [];
	while (true) {
		const filename = prompt("filename");
		if (filename === null || filename === "") break;
		filenames.push(filename);
	}

	if (filenames.length === 0) {
		filenames.push(...globalThis.fn_filenames);
	}

	const query = new URLSearchParams();
	query.set("base", base_filename);
	query.set("gt", gt_filename);
	for (const f of filenames) {
		query.append("fn", f);
	}

	const url = `${url_endpoint}${view_method}/?${query.toString()}`;

	// UUIDを取得
	const uuidResponse = await fetch(url);
	const uuid = await uuidResponse.json();

	// ZIPを取得
	const zip_url = `${url_endpoint}${uuid}.zip`;
	const zipdataResponse = await fetch(zip_url); // Response型
	const zipdataBytes = new Uint8Array(await zipdataResponse.arrayBuffer()); // Uint8Array型

	// 解凍
	const unzipped = unzipSync(zipdataBytes);
	_unzipped = unzipped;
}

export default async function get3DImage(): Promise<Unzipped> {
	if (_unzipped == null) {
		await _get3DImage();
	}
	return _unzipped!;
}

import { unzipSync, type Unzipped } from "fflate";
// import npyjs from "npyjs";

let _unzipped: Unzipped | null = null;
async function _get3DImage() {
	const url_endpoint = "/api/";

	const view_method = encodeURIComponent("ax=axial,process=normal");
	const base_filename = encodeURIComponent(
		"/home/skitazawa/MultiVisualizerClient/.teststatic/118_6010021635259_0202_071.nii.gz",
	);
	const gt_filename = encodeURIComponent(
		"/home/skitazawa/MultiVisualizerClient/.teststatic/99_533_gt.nii.gz",
	);
	const filenames = [
		encodeURIComponent(
			"/home/skitazawa/MultiVisualizerClient/.teststatic/99_533_out.nii.gz",
		),
	];

	const url = `${url_endpoint}${view_method}/?base=${base_filename}&gt=${gt_filename}&fn=${filenames[0]}`;

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

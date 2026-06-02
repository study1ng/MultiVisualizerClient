import { unzipSync, strFromU8 } from "fflate";

export default async function get3DImage() {
    const url_endpoint = '/api/';

    const view_method = encodeURIComponent("ax=axial,process=normal");
    const base_filename = encodeURIComponent("/home/skitazawa/MultiVisualizerClient/.teststatic/99_533_image.nii.gz");
    const gt_filename = encodeURIComponent("/home/skitazawa/MultiVisualizerClient/.teststatic/99_533_gt.nii.gz");
    const filenames = [encodeURIComponent("/home/skitazawa/MultiVisualizerClient/.teststatic/99_533_out.nii.gz")];

    const url = `${url_endpoint}${view_method}/?base=${base_filename}&gt=${gt_filename}&fn[]=${filenames[0]}`;

    // ① UUIDを取得
    const uuidResponse = await fetch(url);
    const uuid = await uuidResponse.json();

    // ② ZIPを取得
    const zip_url = `${url_endpoint}${uuid}.zip`;
    const zipdataResponse = await fetch(zip_url);                        // Response型
    const zipdataBytes = new Uint8Array(await zipdataResponse.arrayBuffer()); // Uint8Array型

    // ③ 解凍
    const unzipped = unzipSync(zipdataBytes);

    for (const name in unzipped) {
        const data = unzipped[name];
        console.log(name, data);
    }
}
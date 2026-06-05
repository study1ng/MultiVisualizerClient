// src/config.ts
// Default file paths used when the load dialog is left entirely empty.
export const DEFAULT_FILES = {
  base: "/path/to/your/image.nii.gz", // CTボリューム
  gt: "/path/to/your/gt.nii.gz",      // 正解ラベル（任意）
  fn: [                               // 推論結果（複数可・任意）
    "/path/to/your/out.nii.gz",
  ],
};
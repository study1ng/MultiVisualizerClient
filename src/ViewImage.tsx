// export function ViewImage({image}) {
//   return (
//     <div style={{background:`url(${image})`}}></div>
//   );
// }

import { useState } from "react";
import get3DImage from "./api/get_3dimg.tsx"; // 関数のファイルパスに合わせて

export default function ViewImage() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await get3DImage();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading}>
        {loading ? "読み込み中..." : "3D画像を取得"}
      </button>
    </div>
  );
}
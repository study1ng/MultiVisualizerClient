import { useEffect, useRef, useState } from "react";
import { drawSlice } from "../utils/canvasRenderer";
import { useTheme } from "@mui/material";
interface Props {
    sliceData: Float32Array | null; 
    labelData?: Int32Array | null;
    labelAlpha?: number;
    width: number;   // ネイティブ画素幅（例 128）
    height: number;  // ネイティブ画素高（例 112）
    wl: number;
    ww: number;
    onWheel: (deltaY: number) => void;
}

const EDGE = 12;       // 枠と判定する縁の幅(px)
const MIN_W = 64;      // 最小表示幅
const MAX_W = 1000;    // 最大表示幅

export default function ImageCanvas({ sliceData, labelData, labelAlpha=0.4, width, height, wl, ww, onWheel }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const aspect = width / height;
    const theme = useTheme();
    const ring = theme.palette.primary.main;
    const radius = Math.min(8, Number(theme.shape.borderRadius));

    // 表示サイズ（CSSピクセル）。初期は控えめに。
    const [displayW, setDisplayW] = useState(width * 2);
    const displayH = displayW / aspect;

    const [cursor, setCursor] = useState("default");
    const dragging = useRef(false);
    const handle = useRef<"e" | "s" | "se" | null>(null);

    // --- 描画（従来どおり）---
    useEffect(() => {
        if (canvasRef.current) {
            drawSlice(canvasRef.current, sliceData, width, height, wl, ww, labelData, labelAlpha);
        }
    }, [sliceData, labelData, labelAlpha, width, height, wl, ww]);

    // --- ホイールでスライス移動（中央でのみ。リサイズ中は無効）---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const h = (e: WheelEvent) => {
            if (dragging.current) return;
            e.preventDefault();
            onWheel(e.deltaY);
        };
        canvas.addEventListener("wheel", h, { passive: false });
        return () => canvas.removeEventListener("wheel", h);
    }, [onWheel]);

    // 縁のどこにいるか判定
    const detect = (e: React.PointerEvent) => {
        const r = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const nearRight = x > r.width - EDGE;
        const nearBottom = y > r.height - EDGE;
        if (nearRight && nearBottom) return "se";
        if (nearRight) return "e";
        if (nearBottom) return "s";
        return null;
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (dragging.current) {
            const r = canvasRef.current!.getBoundingClientRect();
            let w = displayW;
            if (handle.current === "e") {
                w = e.clientX - r.left;
            } else if (handle.current === "s") {
                w = (e.clientY - r.top) * aspect;
            } else if (handle.current === "se") {
                // 横・縦の大きい方に合わせる
                w = Math.max(e.clientX - r.left, (e.clientY - r.top) * aspect);
            }
            setDisplayW(Math.max(MIN_W, Math.min(MAX_W, w)));
            return;
        }
        // 非ドラッグ時はカーソルだけ更新
        const h = detect(e);
        setCursor(h === "se" ? "nwse-resize" : h === "e" ? "ew-resize" : h === "s" ? "ns-resize" : "default");
    };

    const onPointerDown = (e: React.PointerEvent) => {
        const h = detect(e);
        if (!h) return;             // 縁以外は無視（ホイール等を妨げない）
        e.preventDefault();
        dragging.current = true;
        handle.current = h;
        canvasRef.current!.setPointerCapture(e.pointerId);
    };

    const endDrag = (e: React.PointerEvent) => {
        if (!dragging.current) return;
        dragging.current = false;
        handle.current = null;
        canvasRef.current?.releasePointerCapture(e.pointerId);
    };

    return (
        <canvas
            ref={canvasRef}
            onPointerMove={onPointerMove}
            onPointerDown={onPointerDown}
            onPointerUp={endDrag}
            onPointerLeave={() => !dragging.current && setCursor("default")}
            style={{
                width: displayW,
                height: displayH,
                imageRendering: "pixelated",
                touchAction: "none",
                cursor,
                display: "block",
                borderRadius: radius,
                backgroundColor: "#000",
                boxShadow: `0 0 0 1px ${ring}55, 0 0 22px ${ring}22, 0 12px 30px rgba(0,0,0,0.5)`,
            }}
        />
    );
}
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material";
import { drawSlice } from "../utils/canvasRenderer";

interface Props {
    sliceData: Float32Array | null;
    labelData?: Int32Array | null;
    labelAlpha?: number;
    width: number; // native pixel width (e.g. 128)
    height: number; // native pixel height (e.g. 112)
    wl: number;
    ww: number;
    onWheel: (deltaY: number) => void;
}

const EDGE = 12; // px treated as a resize border
const MIN_W = 64; // min display width
const MAX_W = 1000; // max display width

type Handle = "e" | "s" | "se" | null;

export default function ImageCanvas({
    sliceData, labelData, labelAlpha = 0.4,
    width, height, wl, ww, onWheel,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const aspect = width / height;
    const theme = useTheme();
    const ring = theme.palette.primary.main;
    const radius = Math.min(8, Number(theme.shape.borderRadius));

    // Display size in CSS pixels; height is derived from the aspect ratio.
    const [displayW, setDisplayW] = useState(width * 2);
    const displayH = displayW / aspect;

    const [cursor, setCursor] = useState("default");
    const dragging = useRef(false);
    const handle = useRef<Handle>(null);

    // Repaint whenever the slice or window settings change.
    useEffect(() => {
        if (canvasRef.current) {
            drawSlice(canvasRef.current, sliceData, width, height, wl, ww, labelData, labelAlpha);
        }
    }, [sliceData, labelData, labelAlpha, width, height, wl, ww]);

    // Wheel scrolls through slices (disabled while resizing). Non-passive so we
    // can preventDefault the page scroll.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const onWheelEvent = (e: WheelEvent) => {
            if (dragging.current) return;
            e.preventDefault();
            onWheel(e.deltaY);
        };
        canvas.addEventListener("wheel", onWheelEvent, { passive: false });
        return () => canvas.removeEventListener("wheel", onWheelEvent);
    }, [onWheel]);

    // Which resize edge (if any) the pointer is currently over.
    const detect = (e: React.PointerEvent): Handle => {
        const r = canvasRef.current!.getBoundingClientRect();
        const nearRight = e.clientX - r.left > r.width - EDGE;
        const nearBottom = e.clientY - r.top > r.height - EDGE;
        if (nearRight && nearBottom) return "se";
        if (nearRight) return "e";
        if (nearBottom) return "s";
        return null;
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (dragging.current) {
            const r = canvasRef.current!.getBoundingClientRect();
            let w = displayW;
            if (handle.current === "e") w = e.clientX - r.left;
            else if (handle.current === "s") w = (e.clientY - r.top) * aspect;
            // Corner: follow whichever axis grew more.
            else if (handle.current === "se")
                w = Math.max(e.clientX - r.left, (e.clientY - r.top) * aspect);
            setDisplayW(Math.max(MIN_W, Math.min(MAX_W, w)));
            return;
        }
        // Idle: update the cursor to hint at the resize affordance.
        const h = detect(e);
        setCursor(
            h === "se" ? "nwse-resize" : h === "e" ? "ew-resize" : h === "s" ? "ns-resize" : "default",
        );
    };

    const onPointerDown = (e: React.PointerEvent) => {
        const h = detect(e);
        if (!h) return; // ignore the interior so wheel/scroll still works
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

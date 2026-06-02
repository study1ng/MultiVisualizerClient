import { useEffect, useRef } from "react";
import { drawSlice } from "../utils/canvasRenderer";

interface Props {
    sliceData: Float32Array;
    width: number;
    height: number;
}

export default function ImageCanvas({ sliceData, width, height }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            drawSlice(canvasRef.current, sliceData, width, height);
        }
    }, [sliceData, width, height]);

    return (
    <canvas
        ref={canvasRef}
        style={{ width: 336, height: 294, imageRendering: "pixelated" }}
    />
);
}
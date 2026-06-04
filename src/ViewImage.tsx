import { useState } from "react";
import ImageCanvas from "./components/ImageCanvas";
import LoadDialog from "./components/LoadDialog";
import { useImageData } from "./hooks/useImageData";
import {
	Box, Paper, Button, Slider, Typography, Chip,
	FormControlLabel, Switch, Stack, CircularProgress,
} from "@mui/material";

// 折り返さない等幅数字スタイル
const readout = {
	fontFamily: '"IBM Plex Mono", monospace',
	fontVariantNumeric: "tabular-nums",
	whiteSpace: "nowrap" as const,
} as const;

// WL/WW 用: 桁数が増えても短く収まる表示
const fmtVal = (v: number) => {
	const a = Math.abs(v);
	if (a !== 0 && (a >= 1e5 || a < 1e-3)) return v.toExponential(2); // 例 1.23e+5
	if (Number.isInteger(v)) return String(v);
	return v.toFixed(2); // 例 -12.34
};

export default function ViewImage() {
	const {
		volume, panels, width, height, count, load, loading,
		wl, setWl, ww, setWw,
		showLabel, setShowLabel,
		labelAlpha, setLabelAlpha,
		sync, setSync,
		setSlice, moveSlice,
	} = useImageData();

	const [dialogOpen, setDialogOpen] = useState(false);
	const range = volume ? volume.max - volume.min : 1;
	const step = range / 500;
	const hasLabels = panels.some((p) => p.labelSlice);

	return (
		<Box>
			<Paper sx={{ p: 2.5, mb: 3 }}>
				<Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ md: "center" }}>
					<Button
						variant="contained"
						onClick={() => setDialogOpen(true)}
						disabled={loading}
						startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
						sx={{ minWidth: 168 }}
					>
						{loading ? "読み込み中..." : "画像を読み込む"}
					</Button>

					{volume && (
						<>
							<Box sx={{ minWidth: 180, flex: 1 }}>
								<Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1} sx={{ minWidth: 0 }}>
									<Typography variant="overline" color="text.secondary" noWrap>Window Level</Typography>
									<Typography variant="body2" sx={readout} color="primary.light">
										{fmtVal(wl)}
									</Typography>
								</Stack>
								<Slider min={volume.min} max={volume.max} step={step}
									value={wl} onChange={(_, v) => setWl(v as number)} />
							</Box>
							<Box sx={{ minWidth: 180, flex: 1 }}>
								<Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1} sx={{ minWidth: 0 }}>
									<Typography variant="overline" color="text.secondary" noWrap>Window Width</Typography>
									<Typography variant="body2" sx={readout} color="primary.light">
										{fmtVal(ww)}
									</Typography>
								</Stack>
								<Slider min={step} max={range} step={step}
									value={ww} onChange={(_, v) => setWw(v as number)} />
							</Box>
						</>
					)}

					{(volume || hasLabels) && (
						<>
							<Box sx={{ minWidth: 180, flex: 1 }}>
								<Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1} sx={{ minWidth: 0 }}>
									<Typography variant="overline" color="text.secondary" noWrap>ラベル不透明度</Typography>
									<Typography variant="body2" sx={readout} color="primary.light">
										{Math.round(labelAlpha * 100)}%
									</Typography>
								</Stack>
								<Slider min={0} max={1} step={0.01}
									value={labelAlpha} disabled={!showLabel || !hasLabels}
									onChange={(_, v) => setLabelAlpha(v as number)} />
							</Box>
							<Stack>
								<FormControlLabel
									control={<Switch checked={showLabel} onChange={(e) => setShowLabel(e.target.checked)} />}
									label="ラベルを表示" />
								<FormControlLabel
									control={<Switch checked={sync} onChange={(e) => setSync(e.target.checked)} />}
									label="スライスを同期" />
							</Stack>
						</>
					)}
				</Stack>
			</Paper>

			{panels.length > 0 && width && height && (
				<Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5 }}>
					{panels.map((p, i) => {
						const isGt = p.name.startsWith("gt");
						return (
							<Paper key={p.name} sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
								<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.5 }}>
									<Chip label={p.name} size="small"
										color={isGt ? "primary" : "default"}
										variant={isGt ? "filled" : "outlined"}
										sx={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 500 }} />
									<Typography variant="body2" sx={readout} color="text.secondary">
										{p.sliceIndex} / {count - 1}
									</Typography>
								</Stack>

								<ImageCanvas
									sliceData={p.baseSlice}
									labelData={showLabel ? p.labelSlice : null}
									labelAlpha={labelAlpha}
									width={width}
									height={height}
									wl={wl}
									ww={ww}
									onWheel={(dy) => moveSlice(i, dy)}
								/>

								<Slider size="small" min={0} max={count - 1}
									value={p.sliceIndex} onChange={(_, v) => setSlice(i, v as number)} />
							</Paper>
						);
					})}
				</Box>
			)}

			<LoadDialog
				open={dialogOpen}
				loading={loading}
				onClose={() => setDialogOpen(false)}
				onSubmit={(req) => { setDialogOpen(false); load(req); }}
			/>
		</Box>
	);
}
import ImageCanvas from "./components/ImageCanvas";
import { useImageData } from "./hooks/useImageData";
import {
	Box, Paper, Button, Slider, Typography, Chip,
	FormControlLabel, Switch, Stack, CircularProgress,
} from "@mui/material";

const mono = { fontFamily: '"IBM Plex Mono", monospace' } as const;

export default function ViewImage() {
	const {
		volume, panels, load, loading,
		wl, setWl, ww, setWw,
		showLabel, setShowLabel,
		labelAlpha, setLabelAlpha,
		sync, setSync,
		setSlice, moveSlice,
	} = useImageData();

	const range = volume ? volume.max - volume.min : 1;
	const step = range / 500;

	return (
		<Box>
			{/* コントロールパネル */}
			<Paper sx={{ p: 2.5, mb: 3 }}>
				<Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ md: "center" }}>
					<Button
						variant="contained"
						onClick={load}
						disabled={loading}
						startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
						sx={{ minWidth: 168 }}
					>
						{loading ? "読み込み中..." : "画像を読み込む"}
					</Button>

					{volume && (
						<>
							<Box sx={{ minWidth: 180, flex: 1 }}>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="overline" color="text.secondary">Window Level</Typography>
									<Typography variant="body2" sx={mono} color="primary.light">
										{Number(wl.toPrecision(4))}
									</Typography>
								</Stack>
								<Slider
									min={volume.min} max={volume.max} step={step}
									value={wl} onChange={(_, v) => setWl(v as number)}
								/>
							</Box>
							<Box sx={{ minWidth: 180, flex: 1 }}>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="overline" color="text.secondary">Window Width</Typography>
									<Typography variant="body2" sx={mono} color="primary.light">
										{Number(ww.toPrecision(4))}
									</Typography>
								</Stack>
								<Slider
									min={step} max={range} step={step}
									value={ww} onChange={(_, v) => setWw(v as number)}
								/>
							</Box>

							<Box sx={{ minWidth: 180, flex: 1 }}>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="overline" color="text.secondary">ラベル不透明度</Typography>
									<Typography variant="body2" sx={mono} color="primary.light">
										{Math.round(labelAlpha * 100)}%
									</Typography>
								</Stack>
								<Slider
									min={0} max={1} step={0.01}
									value={labelAlpha}
									disabled={!showLabel}
									onChange={(_, v) => setLabelAlpha(v as number)}
								/>
							</Box>

							<Stack>
								<FormControlLabel
									control={<Switch checked={showLabel} onChange={(e) => setShowLabel(e.target.checked)} />}
									label="ラベルを表示"
								/>
								<FormControlLabel
									control={<Switch checked={sync} onChange={(e) => setSync(e.target.checked)} />}
									label="スライスを同期"
								/>
							</Stack>
						</>
					)}
				</Stack>
			</Paper>

			{/* パネル並列表示 */}
			{volume && panels.length > 0 && (
				<Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5 }}>
					{panels.map((p, i) => {
						const isGt = p.name.startsWith("gt");
						return (
							<Paper key={p.name} sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
								<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.5 }}>
									<Chip
										label={p.name}
										size="small"
										color={isGt ? "primary" : "default"}
										variant={isGt ? "filled" : "outlined"}
										sx={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 500 }}
									/>
									<Typography variant="body2" sx={mono} color="text.secondary">
										{p.sliceIndex} / {volume.count - 1}
									</Typography>
								</Stack>

								<ImageCanvas
									sliceData={p.baseSlice}
									labelData={showLabel ? p.labelSlice : null}
									labelAlpha={labelAlpha}
									width={volume.width}
									height={volume.height}
									wl={wl}
									ww={ww}
									onWheel={(dy) => moveSlice(i, dy)}
								/>

								<Slider
									size="small"
									min={0} max={volume.count - 1}
									value={p.sliceIndex}
									onChange={(_, v) => setSlice(i, v as number)}
								/>
							</Paper>
						);
					})}
				</Box>
			)}
		</Box>
	);
}
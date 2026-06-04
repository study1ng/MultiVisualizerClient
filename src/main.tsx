import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import ViewImage from "./ViewImage.tsx";
import Dashboard from "./components/Dashboard.tsx";
import {
	Box, ThemeProvider, CssBaseline, Typography, Stack,
	ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getTheme, type ThemeMode } from "./theme.ts";
import "./env.tsx";

function RootComponent() {
	const [showView, setShowView] = useState(true);
	const [mode, setMode] = useState<ThemeMode>(
		() => (localStorage.getItem("ui.mode") as ThemeMode) || "dark",
	);

	const theme = useMemo(() => getTheme(mode), [mode]);

	useEffect(() => { localStorage.setItem("ui.mode", mode); }, [mode]);

	useEffect(() => {
		const h = (e: KeyboardEvent) => { if (e.key === "d") setShowView((p) => !p); };
		window.addEventListener("keydown", h);
		return () => window.removeEventListener("keydown", h);
	}, []);

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Box
				component="header"
				sx={{
					display: "flex", alignItems: "center", justifyContent: "space-between",
					flexWrap: "wrap", gap: 1.5, px: 3, py: 1.5,
					borderBottom: "1px solid", borderColor: "divider",
					position: "sticky", top: 0, zIndex: 10,
					backdropFilter: "blur(8px)",
					backgroundColor: (t) => alpha(t.palette.background.default, 0.72),
				}}
			>
				<Stack direction="row" alignItems="baseline" spacing={1.5}>
					<Box sx={{
						width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main",
						boxShadow: (t) => `0 0 10px ${t.palette.primary.main}`,
					}} />
					<Typography variant="h6" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
						CT&nbsp;Multi-Visualizer
					</Typography>
				</Stack>

				<Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
					<ToggleButtonGroup
						size="small" exclusive value={mode}
						onChange={(_, v) => v && setMode(v)}
					>
						<ToggleButton value="light">Light</ToggleButton>
						<ToggleButton value="dark">Dark</ToggleButton>
					</ToggleButtonGroup>

					<ToggleButtonGroup
						size="small" exclusive value={showView ? "view" : "dash"}
						onChange={(_, v) => v && setShowView(v === "view")}
					>
						<ToggleButton value="view">ビューア</ToggleButton>
						<ToggleButton value="dash">ダッシュボード</ToggleButton>
					</ToggleButtonGroup>
				</Stack>
			</Box>

			<Box sx={{ p: { xs: 2, md: 3 } }}>
				<Box sx={{ display: showView ? "block" : "none" }}>
					<ViewImage />
				</Box>
				<Box sx={{ display: showView ? "none" : "block" }}>
					<Dashboard active={!showView} />
				</Box>
			</Box>
		</ThemeProvider>
	);
}

createRoot(document.getElementById("root")!).render(<RootComponent />);
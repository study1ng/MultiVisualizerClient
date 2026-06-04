import { createTheme, type Theme } from "@mui/material/styles";

export type ThemeMode = "light" | "dark";

interface Tokens {
	bg: string; paper: string; primary: string; primaryLight: string;
	textPrimary: string; textSecondary: string; divider: string;
}

const tokens: Record<ThemeMode, Tokens> = {
	dark: {
		bg: "#07090c", paper: "#101620", primary: "#3ef0a8", primaryLight: "#7af7c6",
		textPrimary: "#e6f1ec", textSecondary: "#8595a0", divider: "rgba(120,255,200,0.12)",
	},
	light: {
		bg: "#f2f8f4", paper: "#ffffff", primary: "#0f9d6b", primaryLight: "#34b585",
		textPrimary: "#0c241b", textSecondary: "#5b7a6c", divider: "rgba(15,157,107,0.18)",
	},
};

function buildBody(mode: ThemeMode, t: Tokens) {
	const vars = {
		"--chart-fill": t.primary,
		"--grid-stroke": t.divider,
		"--axis-tick": t.textSecondary,
		"--tooltip-bg": t.paper,
		"--tooltip-border": t.divider,
		"--tooltip-text": t.textPrimary,
	};
	const dot = mode === "dark" ? "rgba(120,255,200,0.05)" : "rgba(15,157,107,0.06)";
	const glow1 = mode === "dark" ? "rgba(62,240,168,0.12)" : "rgba(15,157,107,0.06)";
	const glow2 = mode === "dark" ? "rgba(80,160,255,0.08)" : "rgba(80,160,255,0.04)";
	return {
		...vars,
		backgroundColor: t.bg,
		backgroundImage: [
			`radial-gradient(${glow1}, transparent 60%)`,
			`radial-gradient(${glow2}, transparent 55%)`,
			`radial-gradient(${dot} 1px, transparent 1px)`,
		].join(","),
		backgroundSize: "900px 700px, 800px 800px, 22px 22px",
		backgroundPosition: "10% -10%, 90% 30%, 0 0",
		backgroundRepeat: "no-repeat, no-repeat, repeat",
		backgroundAttachment: "fixed, fixed, scroll",
	};
}

function buildTheme(mode: ThemeMode): Theme {
	const t = tokens[mode];
	const isDark = mode === "dark";
	const glow = isDark; // 発光はダークのみ

	return createTheme({
		palette: {
			mode,
			primary: { main: t.primary, light: t.primaryLight, contrastText: isDark ? "#06121a" : "#ffffff" },
			background: { default: t.bg, paper: t.paper },
			text: { primary: t.textPrimary, secondary: t.textSecondary },
			divider: t.divider,
		},
		typography: {
			fontFamily: '"Sora", system-ui, sans-serif',
			h5: { fontWeight: 700, letterSpacing: "-0.02em" },
			h6: { fontWeight: 600 },
			button: { textTransform: "none", fontWeight: 600 },
			overline: { letterSpacing: "0.2em", fontWeight: 600 },
		},
		shape: { borderRadius: 14 },
		components: {
			MuiCssBaseline: { styleOverrides: { body: buildBody(mode, t) } },
			MuiPaper: {
				styleOverrides: {
					root: {
						backgroundImage: "none",
						border: `1px solid ${t.divider}`,
						...(glow ? { boxShadow: `0 0 24px ${t.primary}14` } : {}),
					},
				},
			},
			MuiButton: {
				styleOverrides: {
					containedPrimary: {
						color: isDark ? "#06121a" : "#ffffff",
						boxShadow: glow ? `0 0 18px ${t.primary}66` : "none",
						"&:hover": { boxShadow: glow ? `0 0 28px ${t.primary}99` : undefined },
					},
				},
			},
			MuiSlider: {
				styleOverrides: {
					root: { height: 5 },
					rail: { opacity: 0.25 },
					thumb: {
						width: 16, height: 16,
						...(glow ? { boxShadow: `0 0 10px ${t.primary}` } : {}),
						"&:hover, &.Mui-focusVisible": { boxShadow: `0 0 0 8px ${t.primary}22` },
					},
				},
			},
			MuiToggleButton: {
				styleOverrides: {
					root: {
						textTransform: "none",
						borderColor: t.divider,
						"&.Mui-selected": { color: t.primary, backgroundColor: `${t.primary}1f` },
						"&.Mui-selected:hover": { backgroundColor: `${t.primary}33` },
					},
				},
			},
			MuiChip: { styleOverrides: { root: { borderRadius: 8 } } },
		},
	});
}

export function getTheme(mode: ThemeMode): Theme {
	return buildTheme(mode);
}
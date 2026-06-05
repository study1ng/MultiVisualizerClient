import { useEffect, useState } from "react";
import {
	Bar, BarChart, CartesianGrid, ResponsiveContainer,
	Scatter, Tooltip, XAxis, YAxis,
} from "recharts";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { getCachedImages } from "../api/get_3dimg";

// Theme-aware chart colors (the CSS variables are defined by the theme).
const CHART_FILL = "var(--chart-fill)";
const GRID_STROKE = "var(--grid-stroke)";
const AXIS_TICK = { fill: "var(--axis-tick)", fontSize: 12 };
const TOOLTIP_STYLE = {
	backgroundColor: "var(--tooltip-bg)",
	border: "1px solid var(--tooltip-border)",
	borderRadius: 8,
	color: "var(--tooltip-text)",
};

type GraphType = "scatter-graph" | "continuous-graph";
interface NumberEntry { type: "number"; value: number | string }
interface GraphEntry { type: GraphType; value: Record<string, number> }
type PayloadEntry = NumberEntry | GraphEntry | { type: string; value: unknown };
type Payload = Record<string, PayloadEntry>;

// Japanese display labels for known metric keys.
const KEY_LABELS: Record<string, string> = {
	mean: "平均",
	var: "分散",
	std: "標準偏差",
	mid: "中央値",
	entropy: "エントロピー",
	hist: "ヒストグラム/base",
};

function mapKey(key: string): string {
	if (key in KEY_LABELS) return KEY_LABELS[key];
	const [metric, target] = key.split("-");
	if (metric === "dice") return `縦軸: Dice Score, 横軸: label/${target}`;
	if (metric === "hausdorff") return `縦軸: ハウスドルフ距離, 横軸: label/${target}`;
	return key;
}

// Show floats in scientific notation; leave integers and non-numbers as-is.
function formatScientific(val: unknown): string {
	const num = Number(val);
	if (Number.isNaN(num)) return String(val);
	if (Number.isInteger(num)) return String(val);
	return num.toExponential(3);
}

export default function Dashboard({ active }: { active: boolean }) {
	const [payload, setPayload] = useState<Payload | null>(null);
	const [loading, setLoading] = useState(true);

	// Decode payload.json from the cached archive whenever the view becomes active.
	useEffect(() => {
		const unzip = getCachedImages();
		if (!unzip?.["payload.json"]) {
			setPayload(null);
		} else {
			const text = new TextDecoder("utf-8").decode(unzip["payload.json"]);
			setPayload(JSON.parse(text) as Payload);
		}
		setLoading(false);
	}, [active]);

	if (loading) return (
        <Typography sx={{
            color: "text.secondary"
        }}>Loading...</Typography>
    );
	if (!payload) {
		return (
            <Typography sx={{
                color: "text.secondary"
            }}>先にビューアで画像を読み込んでください。
                            </Typography>
        );
	}

	const entries = Object.entries(payload);
	const numbers = entries.filter(([, v]) => v.type === "number");
	const graphs = entries.filter(([, v]) => v.type !== "number");

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 2 }}>
			<Typography variant="h5" sx={{ mb: 1 }}>統計ダッシュボード</Typography>

			{/* Scalar metrics grouped into responsive cards. */}
			{numbers.length > 0 && (
				<Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
					{numbers.map(([key, val]) => (
						<Card key={key} variant="outlined" sx={{ flex: "1 1 auto", minWidth: 200 }}>
							<CardContent>
								<Typography variant="h6" gutterBottom>{mapKey(key)}</Typography>
								<Typography variant="body1">
									{formatScientific((val as NumberEntry).value)}
								</Typography>
							</CardContent>
						</Card>
					))}
				</Box>
			)}

			{/* Distribution / score charts, one card each. */}
			{graphs.map(([key, val]) => (
				<Card key={key} variant="outlined" sx={{ width: "100%" }}>
					<CardContent>
						<Typography variant="h6" gutterBottom>{mapKey(key)}</Typography>
						<GraphEntryView entry={val} />
					</CardContent>
				</Card>
			))}
		</Box>
	);
}

function GraphEntryView({ entry }: { entry: PayloadEntry }) {
	if (entry.type === "scatter-graph" || entry.type === "continuous-graph") {
		return <DistributionChart value={entry.value as Record<string, number>} kind={entry.type} />;
	}
	return (
        <Typography sx={{
            color: "text.secondary"
        }}>未対応のグラフタイプです: {entry.type}
        </Typography>
    );
}

/**
 * Renders a key/value map as a chart. "continuous-graph" collapses long runs
 * of zeros (keeping only the run edges) before drawing, to declutter the axis.
 */
function DistributionChart({ value, kind }: { value: Record<string, number>; kind: GraphType }) {
	const raw = Object.entries(value).map(([name, v]) => ({ name, value: Number(v) }));

	const data =
		kind === "continuous-graph"
			? raw.filter((item, i) => {
					if (item.value !== 0) return true; // keep all non-zero points
					const prev = raw[i - 1];
					const next = raw[i + 1];
					if (!prev || !next) return true; // keep endpoints
					return !(prev.value === 0 && next.value === 0); // drop inner zeros
			  })
			: raw;

	return (
		<Box sx={{ width: "100%", height: 300 }}>
			<ResponsiveContainer>
				<BarChart data={data}>
					<CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
					<XAxis dataKey="name" tickFormatter={formatScientific} tick={AXIS_TICK} stroke={GRID_STROKE} />
					<YAxis tickFormatter={formatScientific} tick={AXIS_TICK} stroke={GRID_STROKE} />
					<Tooltip
						// Let Recharts infer the param type (ValueType, not just number).
						formatter={(value) => formatScientific(value)}
						contentStyle={TOOLTIP_STYLE}
						cursor={{ fill: "rgba(255,255,255,0.04)" }}
					/>
					{kind === "scatter-graph" ? (
						<Scatter dataKey="value" fill={CHART_FILL} />
					) : (
						<Bar dataKey="value" fill={CHART_FILL} radius={[3, 3, 0, 0]} />
					)}
				</BarChart>
			</ResponsiveContainer>
		</Box>
	);
}

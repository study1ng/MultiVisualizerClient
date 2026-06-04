import type { Unzipped } from "fflate";
import { getCachedImages } from "../api/get_3dimg";
import type { JSX } from "react/jsx-runtime";
import {
	Paper,
	Typography,
	Box,
	Stack,
	Card,
	CardContent,
} from "@mui/material";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Scatter,
	Bar,
} from "recharts";
import { useEffect, useState } from "react";

const CHART_FILL = "var(--chart-fill)";
const GRID_STROKE = "var(--grid-stroke)";
const AXIS_TICK = { fill: "var(--axis-tick)", fontSize: 12 };
const TOOLTIP_STYLE = {
	backgroundColor: "var(--tooltip-bg)",
	border: "1px solid var(--tooltip-border)",
	borderRadius: 8,
	color: "var(--tooltip-text)",
};

export default function Dashboard({ active }: { active: boolean }) {
	const [data, setData] = useState<JSX.Element | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unzip = getCachedImages();
		if (!unzip || !unzip["payload.json"]) {
			setData(null);
			setLoading(false);
			return;
		}
		const decoded = new TextDecoder("utf-8").decode(unzip["payload.json"]);
		const json = JSON.parse(decoded);
		setData(_Dashboard(json));
		setLoading(false);
	}, [active]);

	if (loading) return <div>Loading...</div>;
	if (!data)
		return (
			<Typography color="text.secondary">
				先にビューアで画像を読み込んでください。
			</Typography>
		);
	return data;
}

function _Dashboard(json: any): JSX.Element {
	const entries = Object.entries(json);
	const numberEntries = entries.filter(
		([_, val]: any) => val.type === "number",
	);
	const otherEntries = entries.filter(([_, val]: any) => val.type !== "number");

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 2 }}>
			<Typography variant="h5" sx={{ mb: 1 }}>統計ダッシュボード</Typography>
			{/* 2. numberタイプの項目をひとつのFlexコンテナに集約して配置 */}
			{numberEntries.length > 0 && (
				<Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
					{numberEntries.map(([key, val]: any) => (
						<Card
							key={mapKey(key)}
							variant="outlined"
							// flex-growで隙間を埋めつつ、最小幅を担保
							sx={{ flex: "1 1 auto", minWidth: 200 }}
						>
							<CardContent>
								<Typography variant="h6" component="div" gutterBottom>
									{mapKey(key)}
								</Typography>
								{parse_number(val.value)}
							</CardContent>
						</Card>
					))}
				</Box>
			)}

			{/* 3. グラフなどのその他の項目は従来通り縦並びで配置 */}
			{otherEntries.map(([key, val]: any) => {
				let content: JSX.Element | null = null;

				switch (val.type) {
					case "scatter-graph":
						content = parse_scatter_graph(val.value);
						break;
					case "continuous-graph":
						content = parse_continuous_graph(val.value);
						break;
					default:
						content = (
							<Typography color="text.secondary">
								未対応のグラフタイプです: {val.type}
							</Typography>
						);
				}

				return (
					<Card key={mapKey(key)} variant="outlined" sx={{ width: "100%" }}>
						<CardContent>
							<Typography variant="h6" component="div" gutterBottom>
								{mapKey(key)}
							</Typography>
							{content}
						</CardContent>
					</Card>
				);
			})}
		</Box>
	);
}

const mapKey = (key: string): string => {
	if (key === "mean") {
		return "平均";
	}
	if (key === "var") {
		return "分散";
	}
	if (key === "std") {
		return "標準偏差";
	}
	if (key === "mid") {
		return "中央値";
	}
	if (key === "entropy") {
		return "エントロピー";
	}
	if (key === "hist") {
		return "ヒストグラム/base";
	}
	let [kf, f] = key.split("-");
	if (kf === "dice") {
		return `縦軸: Dice Score, 横軸: label/${f}`;
	}
	if (kf === "hausdorff") {
		return `縦軸: ハウスドルフ距離, 横軸: label/${f}`;
	}
	return key;
};

const formatScientific = (val: any): any => {
	const num = Number(val);

	// 数値に変換できない文字列（カテゴリ名など）はそのまま返す
	if (Number.isNaN(num)) return val;

	// ※もし「整数はそのまま表示し、小数(float)のみ」科学記数法にしたい場合は、以下の行のコメントアウトを外してください
	if (Number.isInteger(num)) return val;

	return num.toExponential(3);
};

function parse_number(v: any): JSX.Element {
	return <Typography variant="body1">{formatScientific(v)}</Typography>;
}

function parse_scatter_graph(v: any): JSX.Element {
	const chartData = Object.entries(v).map(([key, val]) => ({
		label: key,
		value: val,
	}));
	return (
		<Box sx={{ width: "100%", height: 300 }}>
			<ResponsiveContainer>
				<BarChart data={chartData}>
					<CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
					<XAxis
						dataKey="label"
						tickFormatter={formatScientific}
						tick={AXIS_TICK}
						stroke={GRID_STROKE}
					/>
					<YAxis tickFormatter={formatScientific} tick={AXIS_TICK} stroke={GRID_STROKE} />
					<Tooltip
						formatter={(value: any) => formatScientific(value)}
						contentStyle={TOOLTIP_STYLE}
						cursor={{ fill: "rgba(255,255,255,0.04)" }}
					/>
					<Scatter dataKey="value" fill={CHART_FILL} />
				</BarChart>
			</ResponsiveContainer>
		</Box>
	);
}

function parse_continuous_graph(v: any): JSX.Element {
	// 1. オブジェクトから配列に変換
	const rawData = Object.entries(v).map(([key, val]) => ({
		name: key,
		value: val,
	}));

	// 2. 連続する0の区間を間引くフィルター
	const chartData = rawData.filter((item, index) => {
		const currentVal = Number(item.value);

		// 0以外の数値はすべて残す
		if (currentVal !== 0) return true;

		const prev = rawData[index - 1];
		const next = rawData[index + 1];

		// 配列の最初と最後のデータは基準として残す
		if (!prev || !next) return true;

		// 「前も0」かつ「次も0」である場合、それは連続する0の中間データなので除外（省略）する
		if (Number(prev.value) === 0 && Number(next.value) === 0) {
			return false;
		}

		// 0の区間の「始まり」と「終わり」のデータだけがここに残り、描画される
		return true;
	});

	return (
		<Box sx={{ width: "100%", height: 300 }}>
			<ResponsiveContainer>
				<BarChart data={chartData}>
					<CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
					<XAxis
						dataKey="name"
						tickFormatter={formatScientific}
						tick={AXIS_TICK}
						stroke={GRID_STROKE}
					/>
					<YAxis tickFormatter={formatScientific} tick={AXIS_TICK} stroke={GRID_STROKE} />
					<Tooltip
						formatter={(value: any) => formatScientific(value)}
						contentStyle={TOOLTIP_STYLE}
						cursor={{ fill: "rgba(255,255,255,0.04)" }}
					/>
					<Bar dataKey="value" fill={CHART_FILL} radius={[3, 3, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</Box>
	);
}
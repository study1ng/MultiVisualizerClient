import { useState } from "react";
import {
	Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
	Stack, TextField, Typography,
} from "@mui/material";

interface Props {
	open: boolean;
	loading: boolean;
	onClose: () => void;
	onSubmit: (req: { base: string; gt: string; fn: string[] }) => void;
}

export default function LoadDialog({ open, loading, onClose, onSubmit }: Props) {
	const [base, setBase] = useState("");
	const [gt, setGt] = useState("");
	const [fnList, setFnList] = useState<string[]>([""]);

	// env.tsx defaults, shown as placeholders.
	const defBase = globalThis.base_filename ?? "";
	const defGt = globalThis.gt_filename ?? "";
	const defFn = globalThis.fn_filenames ?? [];

	const updateFn = (i: number, v: string) =>
		setFnList((prev) => prev.map((x, idx) => (idx === i ? v : x)));
	const addFn = () => setFnList((prev) => [...prev, ""]);
	const removeFn = (i: number) =>
		setFnList((prev) => prev.filter((_, idx) => idx !== i));

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
			<DialogTitle>画像の読み込み</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<Typography variant="body2" color="text.secondary">
						すべて空欄の場合はデフォルトパスを使用します。いずれかを入力すると、入力したものだけを描画します。
					</Typography>

					<TextField
						label="Base (CT)" value={base}
						onChange={(e) => setBase(e.target.value)}
						placeholder={defBase} fullWidth size="small"
					/>
					<TextField
						label="GT (ラベル)" value={gt}
						onChange={(e) => setGt(e.target.value)}
						placeholder={defGt} fullWidth size="small"
					/>

					<Box>
						<Typography variant="overline" color="text.secondary">Fn (ラベル)</Typography>
						<Stack spacing={1.5} sx={{ mt: 0.5 }}>
							{fnList.map((v, i) => (
								<Stack key={i} direction="row" spacing={1} alignItems="center">
									<TextField
										label={`Fn ${i + 1}`} value={v}
										onChange={(e) => updateFn(i, e.target.value)}
										placeholder={defFn[i] ?? defFn[0] ?? ""}
										fullWidth size="small"
									/>
									<Button
										onClick={() => removeFn(i)}
										disabled={fnList.length === 1}
										color="inherit"
									>
										削除
									</Button>
								</Stack>
							))}
						</Stack>
						<Button onClick={addFn} variant="outlined" size="small" sx={{ mt: 1.5 }}>
							Fnを追加
						</Button>
					</Box>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color="inherit">キャンセル</Button>
				<Button
					onClick={() => onSubmit({ base, gt, fn: fnList })}
					variant="contained" disabled={loading}
				>
					読み込む
				</Button>
			</DialogActions>
		</Dialog>
	);
}

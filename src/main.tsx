import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import ViewImage from "./ViewImage.tsx";
import Dashboard from "./components/Dashboard.tsx";
import { Box } from "@mui/material";
import "./env.tsx";

function RootComponent() {
	// trueならViewImage、falseならDashboardを表示
	const [showView, setShowView] = useState(true);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "d") {
				setShowView((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<Box>
			<Box sx={{ display: showView ? "block" : "none" }}>
				<ViewImage />
			</Box>
			<Box sx={{ display: showView ? "none" : "block" }}>
				<Dashboard />
			</Box>
		</Box>
	);
}

createRoot(document.getElementById("root")!).render(<RootComponent />);

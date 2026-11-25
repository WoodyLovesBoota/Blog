import { Inter, JetBrains_Mono, Noto_Sans_KR } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });
const notoKr = Noto_Sans_KR({ weight: ["400", "500", "600"], variable: "--font-noto-kr", display: "swap", preload: false });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains", display: "swap" });

export const fontClassName = `${inter.variable} ${notoKr.variable} ${jetbrains.variable}`;

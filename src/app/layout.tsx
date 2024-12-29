import "@/styles/globals.scss";
import localFont from "next/font/local";
import RootProvider from "@/contexts/RootProvider";
import { PopupProvider } from "@/lib/common/contexts/popup/popup.context";
import { PopupManager } from "@/lib/components/Popup/PopupManager";
import AnimateLayout from "@/layouts/animate/AnimateLayout";

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang={"ko"}>
            <body>
                <RootProvider>
                    <PopupProvider>
                        {children}
                        <PopupManager />
                    </PopupProvider>
                </RootProvider>
            </body>
        </html>
    );
}

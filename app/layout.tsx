import type { Metadata } from "next";
import type { ReactNode } from "react";
import AuthGate from "@/components/AuthGate";
import "./globals.css";

export const metadata: Metadata = { title: "NFL Inventory" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/nav/Header";

export const metadata: Metadata = {
  title: "Simini Efficiency App 3.0",
  description: "Mobile surgery time tracking for veterinary surgeons",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

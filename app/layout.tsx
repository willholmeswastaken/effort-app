import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Workout Tracker | Build Your Physique",
  description: "A premium workout tracking app inspired by Thrst and Revolut.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster
            theme="dark"
            position="bottom-center"
            toastOptions={{
              style: {
                background: "#1C1C1E",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#FAFAFA",
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}

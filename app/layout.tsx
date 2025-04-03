import { ReactQueryProviders } from "@/provider/tanstack";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { LoaderProvider } from "@/provider/LoaderContext";
import Loader from "@/components/loader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Health Care - Gestion des Patients MRC",
  description:
    "Solution innovante pour la gestion des patients atteints de MRC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ReactQueryProviders>
      <LoaderProvider>
        <html lang="en" suppressHydrationWarning>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <Loader />
              <div>{children}</div>
              <Toaster
                position="top-right"
                closeButton
                richColors
                expand={false}
                visibleToasts={3}
              />
            </ThemeProvider>
          </body>
        </html>
      </LoaderProvider>
    </ReactQueryProviders>
  );
}

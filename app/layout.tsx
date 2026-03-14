import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: "RouterChat | Premium AI Chat Interface",
  description:
    "A premium, desktop-class AI chat interface powered by OpenRouter. Access thousands of free and paid AI models including Claude, GPT-4o, Gemini, and Llama through a beautiful, minimal UI.",
  keywords: [
    "AI chat",
    "OpenRouter",
    "ChatGPT alternative",
    "free AI",
    "AI interface",
    "LLM chat",
    "Claude",
    "GPT-4o",
    "Gemini",
    "Llama",
  ],
  authors: [{ name: "RouterChat" }],
  creator: "RouterChat",
  metadataBase: new URL("https://routerchat.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "RouterChat | Premium AI Chat Interface",
    description:
      "Access thousands of free and paid AI models through a beautiful, minimal interface. No signup required.",
    siteName: "RouterChat",
  },
  twitter: {
    card: "summary_large_image",
    title: "RouterChat | Premium AI Chat Interface",
    description:
      "Access thousands of free and paid AI models through a beautiful, minimal interface.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

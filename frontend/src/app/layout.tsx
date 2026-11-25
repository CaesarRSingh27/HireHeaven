import type { Metadata } from "next";
import { Caveat, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/context/AppContext";
import ClerkAuthProvider from "@/components/auth/clerk-auth-provider";

export const metadata: Metadata = {
  title: "HireHeaven | Find your next opportunity",
  description:
    "Discover roles, meet ambitious teams, and use thoughtful AI tools to make your next career move.",
};

const manrope = Manrope({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const caveat = Caveat({ subsets: ["latin"], variable: "--font-handwriting", display: "swap" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${spaceGrotesk.variable} ${caveat.variable}`}>
        <ClerkAuthProvider>
          <AppProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <NavBar />
              {children}
            </ThemeProvider>
          </AppProvider>
        </ClerkAuthProvider>
      </body>
    </html>
  );
}

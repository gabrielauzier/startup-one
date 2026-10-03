import type { Metadata } from "next";
import { Newsreader, Hanken_Grotesk } from "next/font/google";
import { AppChrome } from "@/components/shared/AppChrome";
import { getCurrentAuthState } from "@/lib/auth/current-role";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Îasy",
  description:
    "Negócios da Amazônia com visibilidade e transparência.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { role, needsPassword } = await getCurrentAuthState();

  return (
    <html
      lang="pt-BR"
      className={`${newsreader.variable} ${hankenGrotesk.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col font-body"
        suppressHydrationWarning
      >
        <AppChrome role={role} needsPassword={needsPassword}>
          {children}
        </AppChrome>
      </body>
    </html>
  );
}

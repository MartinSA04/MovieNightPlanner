import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { FeedbackToast } from "@/components/feedback-toast";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body"
});

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading"
});

export const metadata: Metadata = {
  title: "Movie Night Planner",
  description: "Plan the movie, settle the vote, and see which services your group already has."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `
    try {
      const storedTheme = localStorage.getItem("theme");
      const theme =
        storedTheme === "light" || storedTheme === "dark"
          ? storedTheme
          : "dark";
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.dataset.theme = theme;
    } catch (error) {
      document.documentElement.classList.add("dark");
      document.documentElement.dataset.theme = "dark";
    }
  `;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${headingFont.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <FeedbackToast />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { FeedbackToast } from "@/components/feedback-toast";
import "./globals.css";

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
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.dataset.theme = theme;
    } catch (error) {
      document.documentElement.dataset.theme = "light";
    }
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <FeedbackToast />
        {children}
      </body>
    </html>
  );
}

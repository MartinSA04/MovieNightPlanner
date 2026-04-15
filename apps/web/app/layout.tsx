import type { Metadata } from "next";
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
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


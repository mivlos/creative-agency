import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creative Agency — AI Design Council",
  description: "Turn creative goals into strategic visual explorations with your AI Design Council",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

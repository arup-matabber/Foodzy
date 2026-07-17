import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Foodzy — Smart AI Kitchen Assistant",
  description:
    "Turn the ingredients in your kitchen into delicious meals. Foodzy generates AI-powered recipes by cuisine and diet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Instrument+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body className="min-h-full bg-canvas text-ink">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

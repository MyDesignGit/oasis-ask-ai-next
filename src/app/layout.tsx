// app/layout.tsx

import { ThemeProvider } from "next-themes";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";



export const metadata: Metadata = {
  title: "Ask Oasis - AI Healthcare Assistant",
  description: "AI-powered healthcare assistant for Oasis Fertility",
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
  
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClerkProvider >
          <ThemeProvider 
            attribute="class" 
            defaultTheme="system" 
            enableSystem 
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>


  );
}
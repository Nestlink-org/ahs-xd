import React from "react";
import { ThemeProvider } from "next-themes";

export default function Theme_provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider defaultTheme="system" attribute={"class"} enableSystem>
      {children}
    </ThemeProvider>
  );
}

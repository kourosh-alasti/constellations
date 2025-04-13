"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = Parameters<typeof NextThemesProvider>[0];

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);

  // After mounting, we have access to the window object
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Force a rerender when the theme changes to ensure CSS variables update
  React.useEffect(() => {
    const onThemeChange = () => {
      document.documentElement.style.colorScheme =
        document.documentElement.classList.contains("dark") ? "dark" : "light";
    };

    // Apply immediately
    onThemeChange();

    // Listen for future theme changes
    window.addEventListener("themechange", onThemeChange);
    return () => window.removeEventListener("themechange", onThemeChange);
  }, [mounted]);

  return (
    <NextThemesProvider
      {...props}
      enableSystem
      attribute="class"
      defaultTheme="dark"
      enableColorScheme
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

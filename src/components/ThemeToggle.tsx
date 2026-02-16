"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
    console.log("ThemeToggle mounted. Resolved theme:", resolvedTheme);
  }, [resolvedTheme]);

  if (!mounted) {
    return (
      <div className="w-9 h-9 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-muted-foreground animate-pulse" />
      </div>
    );
  }

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    console.log(`Switching theme from ${resolvedTheme} to ${nextTheme}`);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      className="rounded-full w-9 h-9 border border-border bg-card/50 hover:bg-accent transition-colors flex items-center justify-center relative cursor-pointer"
      onClick={toggleTheme}
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

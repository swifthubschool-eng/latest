"use client";

import { Search, Command } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[100px]" />

      {/* Badge */}
      <div className="mb-6 inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 uppercase tracking-wider">
        INDIAN
      </div>

      {/* Headline */}
      <h1 className="mb-4 max-w-4xl text-5xl font-bold tracking-tight text-foreground md:text-7xl">
        Get the edge on the <br />
        <span className="text-muted-foreground">market with precision</span>
      </h1>

      {/* Subtext */}
      <p className="mb-10 max-w-2xl text-lg text-muted-foreground">
        We have worked for Wall Street Banks and know banks have a information edge over you. It's time to level the playing field.
      </p>

      {/* Main Search Bar */}
      <div className="relative w-full max-w-lg">
        <div className="relative flex items-center rounded-full border border-border bg-muted/50 p-2 backdrop-blur-sm transition-all focus-within:border-border/50 focus-within:bg-muted focus-within:ring-1 focus-within:ring-blue-500/50">
          <Search className="ml-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Symbol or company"
            className="flex-1 bg-transparent px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="mr-2 flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>
      </div>
    </section>
  );
}

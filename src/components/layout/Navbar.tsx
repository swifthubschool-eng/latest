"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { MarketsMenu } from "./MarketsMenu";
import { SearchBar } from "./SearchBar";
import { ThemeToggle } from "../ThemeToggle";

export function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    setIsAuthenticated(!!token);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) { }
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600"></div>
          <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
            Nifty
          </Link>
        </div>

        {/* Search Bar - Now in navbar */}
        <div className="hidden lg:flex flex-1 max-w-md mx-4">
          <SearchBar />
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">

          <Link href="/dashboard">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-accent focus:bg-accent">
              Dashboard
            </Button>
          </Link>

          <MarketsMenu />
          <Link href="#" className="hover:text-foreground transition-colors">TrendsAI</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Pricing</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />

          {isAuthenticated ? (
            <Link href="/profile" className="flex items-center gap-3 hover:bg-accent px-3 py-1.5 rounded-full transition-colors group">
              <span className="hidden sm:inline text-sm font-medium text-muted-foreground group-hover:text-foreground">{user?.name || "Member"}</span>
              <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-border">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground hover:bg-accent">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Start free trial
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

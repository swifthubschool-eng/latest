"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Bell, Menu, User, Settings, LogOut, LayoutDashboard, BarChart3, PieChart, Wallet, TrendingUp } from "lucide-react";
import { MarketsMenu } from "./MarketsMenu";
import { SearchBar } from "./SearchBar";
import { ThemeToggle } from "../ThemeToggle";

export function DashboardNavbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; image?: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Logo & Mobile Menu */}
        <div className="flex items-center gap-4">
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
              N
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground hidden sm:block">
              Nifty
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center ml-8 gap-1">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-accent transition-colors"
            >
              Dashboard
            </Link>
            <div className="flex items-center">
              <MarketsMenu />
            </div>
          </nav>
        </div>

        {/* Right: Search, Notifications, Profile */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Search Bar */}
          <div className="hidden lg:block">
            <SearchBar />
          </div>

          <button className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          </button>

          {/* User Profile Section */}
          <div className="flex items-center gap-1 pl-2 border-l border-border">
            <Link
              href="/profile"
              className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-accent transition-all group/profile"
            >
              <div className="h-9 w-9 rounded-full bg-accent text-muted-foreground flex items-center justify-center border border-border group-hover/profile:border-foreground/20 group-hover/profile:text-foreground transition-all overflow-hidden text-clip">
                {user?.image ? (
                  <img src={user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-foreground group-hover/profile:text-primary transition-colors uppercase tracking-tight italic">
                  {user?.name || "Member"}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-green-500"></div>
                  PRO Account
                </div>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all group/logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full h-[calc(100vh-4rem)] bg-background border-b border-border p-4 md:hidden animate-in slide-in-from-top-2 duration-200 shadow-2xl overflow-y-auto">
          <div className="flex flex-col gap-4">
            <nav className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent text-foreground font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-5 w-5 text-blue-500" />
                Dashboard
              </Link>

              <Link
                href="/market"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                All Stocks
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="h-5 w-5 text-green-500" />
                My Profile
              </Link>

              <Link
                href="/indices"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Market Indices
              </Link>

              <div className="h-px bg-border my-2"></div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors w-full text-left"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

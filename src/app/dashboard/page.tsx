"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { StockCarousel } from "@/components/StockCarousel";
import { MarketSummary } from "@/components/dashboard/MarketSummary";
import { SearchBar } from "@/components/layout/SearchBar";
import { ArrowUpRight, ArrowDownRight, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BulkDownload } from "@/components/screener/BulkDownload";



export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login"); // Redirect to login if not authenticated
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error("Error parsing user data", e);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-muted-foreground">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-blue-500/30">
      <DashboardNavbar />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Good {getGreeting()}, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground mt-1">Here's your market overview for today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-border hover:bg-muted text-foreground rounded-lg font-medium transition-colors">
              Market Report
            </button>
          </div>
        </section>

        {/* Mobile Search Bar (Only visible on mobile/tablet) */}
        <div className="lg:hidden mt-2 mb-4">
          <SearchBar />
        </div>

        {/* Market Summary Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Market summary <span className="text-muted-foreground font-normal text-sm">&gt;</span>
            </h2>
          </div>
          <MarketSummary />
        </section>

        {/* Market Trends (Reusing Carousel) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" /> Market Trends
            </h2>
          </div>
          <StockCarousel />
        </section>

        {/* Bulk CSV Download */}
        <section>
          <BulkDownload />
        </section>
      </main>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

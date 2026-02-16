"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Globe,
  Flag,
  Newspaper,
  BarChart2,
  TrendingUp,
  Bitcoin,
  Activity,
  DollarSign,
  Landmark,
  Building2,
  PieChart,
  Briefcase
} from "lucide-react";

// Types for our menu data
type Category = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

type SubCategory = {
  category_id: string;
  title: string;
  items: { label: string; href: string }[];
};

type FeaturedItem = {
  category_id: string;
  title: string;
  items: {
    symbol: string;
    name: string;
    price: string;
    change: string;
    isPositive: boolean;
    icon?: React.ReactNode;
  }[];
  action?: { label: string; href: string };
};

const categories: Category[] = [
  { id: "world", label: "Entire world", icon: <Globe className="h-4 w-4" /> },
  { id: "countries", label: "Countries", icon: <Flag className="h-4 w-4" /> },
  { id: "news", label: "News", icon: <Newspaper className="h-4 w-4" /> },
  { id: "indices", label: "Indices", icon: <BarChart2 className="h-4 w-4" /> },
  { id: "stocks", label: "Stocks", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "crypto", label: "Crypto", icon: <Bitcoin className="h-4 w-4" /> },
  { id: "futures", label: "Futures", icon: <Activity className="h-4 w-4" /> },
  { id: "forex", label: "Forex", icon: <DollarSign className="h-4 w-4" /> },
  { id: "bonds", label: "Government bonds", icon: <Landmark className="h-4 w-4" /> },
  { id: "corp_bonds", label: "Corporate bonds", icon: <Building2 className="h-4 w-4" /> },
  { id: "etfs", label: "ETFs", icon: <PieChart className="h-4 w-4" /> },
  { id: "economy", label: "Economy", icon: <Briefcase className="h-4 w-4" /> },
];

const subCategories: SubCategory[] = [
  {
    category_id: "world",
    title: "Overview",
    items: [
      { label: "Sectors and industries", href: "#" },
    ]
  },
  {
    category_id: "world",
    title: "INDIA STOCKS",
    items: [
      { label: "All stocks", href: "/market" },
      { label: "Large-cap", href: "/market?filter=Large-cap" },
      { label: "Small-cap", href: "/market?filter=Small-cap" },
      { label: "Top gainers", href: "/market?filter=Top gainers" },
      { label: "Top losers", href: "/market?filter=Top losers" },
    ]
  },
  {
    category_id: "world",
    title: "WORLD STOCKS",
    items: [
      { label: "World biggest companies", href: "#" },
      { label: "Largest non-U.S. companies", href: "#" },
      { label: "World largest employers", href: "#" },
    ]
  },
  // Default fallback for other categories not explicitly detailed
  {
    category_id: "stocks",
    title: "Overview",
    items: [
      { label: "Sectors and industries", href: "#" },
    ]
  },
  {
    category_id: "stocks",
    title: "INDIA STOCKS",
    items: [
      { label: "All stocks", href: "/market" },
      { label: "Large-cap", href: "/market?filter=Large-cap" },
      { label: "Small-cap", href: "/market?filter=Small-cap" },
      { label: "Top gainers", href: "/market?filter=Top gainers" },
      { label: "Top losers", href: "/market?filter=Top losers" },
    ]
  },
];

const featuredItems: FeaturedItem[] = [
  {
    category_id: "world",
    title: "Market Movers",
    items: [
      { symbol: "RELIANCE", name: "Reliance Industries", price: "1,458.50 INR", change: "-0.21%", isPositive: false },
      { symbol: "TCS", name: "Tata Consultancy Servi...", price: "2,984.60 INR", change: "+1.23%", isPositive: true },
      { symbol: "HDFCBANK", name: "HDFC Bank", price: "932.40 INR", change: "-0.52%", isPositive: false },
      { symbol: "ICICIBANK", name: "ICICI Bank", price: "1,406.50 INR", change: "+0.73%", isPositive: true },
      { symbol: "HINDUNILVR", name: "Hindustan Unilever", price: "2,453.60 INR", change: "+0.76%", isPositive: true },
      { symbol: "INFY", name: "Infosys", price: "1,497.80 INR", change: "+0.04%", isPositive: true },
    ],
    action: { label: "Screen all stocks", href: "/screener" }
  },
  // Default fallback
  {
    category_id: "stocks",
    title: "Market Movers",
    items: [
      { symbol: "RELIANCE", name: "Reliance Industries", price: "1,458.50 INR", change: "-0.21%", isPositive: false },
      { symbol: "TCS", name: "Tata Consultancy Servi...", price: "2,984.60 INR", change: "+1.23%", isPositive: true },
      { symbol: "HDFCBANK", name: "HDFC Bank", price: "932.40 INR", change: "-0.52%", isPositive: false },
      { symbol: "ICICIBANK", name: "ICICI Bank", price: "1,406.50 INR", change: "+0.73%", isPositive: true },
    ],
    action: { label: "Screen all stocks", href: "/screener" }
  },
];


export function MarketsMenu() {
  const [activeCategory, setActiveCategory] = React.useState<string>("world");
  const [marketMovers, setMarketMovers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const currentSubCategories = subCategories.filter(sc => sc.category_id === activeCategory);

  // Get featured items for the current category, fallback to 'world' if not found for demo purposes
  const currentFeatured = featuredItems.find(fi => fi.category_id === activeCategory) || featuredItems.find(fi => fi.category_id === "world");

  React.useEffect(() => {
    async function fetchMarketMovers() {
      try {
        // Fetch a list of major stocks to determine movers
        // We use a robust list of Nifty 50 heavyweights
        const symbols = [
          "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY",
          "HINDUNILVR", "ITC", "LT", "SBIN", "BHARTIARTL",
          "KOTAKBANK", "AXISBANK", "BAJFINANCE", "ASIANPAINT", "MARUTI"
        ].join(",");

        const res = await fetch(`/api/stocks/quotes?symbols=${symbols}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          // Sort by absolute change percent to find biggest movers (up or down)
          const movers = data.data
            .sort((a: any, b: any) => Math.abs(b.change_percent) - Math.abs(a.change_percent))
            .slice(0, 6) // Top 6 movers
            .map((stock: any) => ({
              symbol: stock.symbol,
              name: stock.longName || stock.symbol, // Use long name if available
              price: `₹${stock.last_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              change: `${stock.change > 0 ? "+" : ""}${stock.change_percent.toFixed(2)}%`,
              isPositive: stock.change >= 0,
              changeValue: stock.change_percent // Store raw value for potential use
            }));

          setMarketMovers(movers);
        }
      } catch (error) {
        console.error("Failed to fetch market movers:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMarketMovers();

    // Refresh every minute
    const interval = setInterval(fetchMarketMovers, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted data-[state=open]:bg-muted focus:bg-muted">
            Markets
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="flex w-[900px] h-[500px] bg-popover border border-border rounded-md shadow-2xl overflow-hidden">

              {/* Left Column: Categories */}
              <div className="w-[240px] border-r border-border flex flex-col bg-muted/40">
                <div className="p-4 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-md mb-2 border border-blue-500/20 cursor-pointer"
                    onMouseEnter={() => setActiveCategory("world")}>
                    <Globe className="h-4 w-4" />
                    <span className="text-sm font-medium">Entire world</span>
                  </div>

                  <div className="space-y-1">
                    {categories.slice(1).map((category) => (
                      <button
                        key={category.id}
                        onMouseEnter={() => setActiveCategory(category.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-all text-left group",
                          activeCategory === category.id
                            ? "bg-accent text-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {React.isValidElement(category.icon) && React.cloneElement(category.icon as React.ReactElement<any>, {
                            className: cn("h-4 w-4 transition-colors", activeCategory === category.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground")
                          })}
                          <span>{category.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Middle Column: Sub-categories */}
              <div className="w-[280px] border-r border-border bg-muted/20 flex flex-col">
                <div className="p-6 overflow-y-auto custom-scrollbar">
                  {currentSubCategories.length > 0 ? (
                    currentSubCategories.map((group, idx) => (
                      <div key={idx} className="mb-8 last:mb-0">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                          {group.title}
                        </h4>
                        <ul className="space-y-1">
                          {group.items.map((item, itemIdx) => (
                            <li key={itemIdx}>
                              <Link href={item.href} className="block px-2 py-1.5 -mx-2 rounded hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors">
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Activity className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-sm">No items available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Featured Items */}
              <div className="flex-1 bg-muted/10 flex flex-col">
                <div className="p-6 overflow-y-auto custom-scrollbar">
                  {currentFeatured && (
                    <>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                        {/* Always show "Market Movers" if we have data, otherwise fallback to static title */}
                        {marketMovers.length > 0 ? "Market Movers (Live)" : currentFeatured.title}
                      </h4>
                      <div className="space-y-3">
                        {/* Use real-time Movers if available, otherwise fallback to static list */}
                        {(marketMovers.length > 0 ? marketMovers : currentFeatured.items).map((item, idx) => (
                          <Link key={idx} href={`/stock/${item.symbol}`}>
                            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 transition-all cursor-pointer group mb-3 last:mb-0">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold group-hover:scale-110 transition-transform">
                                  {item.symbol[0]}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate max-w-[120px]">
                                    {item.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {item.price}
                                  </div>
                                </div>
                              </div>
                              <div className={cn(
                                "text-xs font-medium px-2 py-1 rounded bg-muted",
                                item.isPositive ? "text-green-500 bg-green-500/10" : "text-rose-500 bg-rose-500/10"
                              )}>
                                {item.change}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                      {currentFeatured.action && (
                        <div className="mt-6 pt-6 border-t border-border">
                          <Link href={currentFeatured.action.href}>
                            <button className="w-full group flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-muted hover:bg-accent border border-border hover:border-border text-sm text-muted-foreground hover:text-foreground transition-all">
                              <span className="font-medium">{currentFeatured.action.label}</span>
                              <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </button>
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

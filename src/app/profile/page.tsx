"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Wallet,
  ShieldCheck,
  LogOut,
  Edit2,
  Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
  bio?: string;
  balance: number;
  investedAmount: number;
  currency: string;
  createdAt: string;
  isVerified: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardNavbar />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Brief Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card border-border overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-blue-600 to-purple-600"></div>
              <CardContent className="pt-0 relative">
                <div className="flex flex-col items-center -mt-12">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-2xl bg-card border-4 border-background flex items-center justify-center overflow-hidden">
                      {user.image ? (
                        <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 p-1.5 rounded-lg bg-primary text-primary-foreground border-2 border-background hover:bg-primary/90 transition-colors">
                      <Camera className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
                      {user.name}
                      {user.isVerified && <ShieldCheck className="h-4 w-4 text-primary" />}
                    </h2>
                    <p className="text-muted-foreground text-sm">{user.email}</p>
                  </div>

                  <div className="w-full mt-6 pt-6 border-t border-border space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">About</span>
                      <p className="text-sm text-foreground">
                        {user.bio || "No bio available."}
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full mt-6 border-border hover:bg-muted text-foreground">
                    <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Account Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Member since</span>
                  </div>
                  <span className="text-foreground">{new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Status</span>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase", user.isVerified ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500")}>
                    {user.isVerified ? "Verified" : "Pending"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" /> Logout Session
            </Button>
          </div>

          {/* Right Column: Details & Finance */}
          <div className="lg:col-span-2 space-y-8">



            {/* Account Details Form-like section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                      <UserIcon className="h-3 w-3" /> Full Name
                    </label>
                    <div className="p-3 rounded-lg bg-background border border-border text-sm text-foreground">
                      {user.name}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                      <Mail className="h-3 w-3" /> Email Address
                    </label>
                    <div className="p-3 rounded-lg bg-background border border-border text-sm text-foreground">
                      {user.email}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                      <Phone className="h-3 w-3" /> Phone Number
                    </label>
                    <div className="p-3 rounded-lg bg-background border border-border text-sm text-foreground">
                      {user.phone || "Not provided"}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                      <Wallet className="h-3 w-3" /> Preferred Currency
                    </label>
                    <div className="p-3 rounded-lg bg-background border border-border text-sm text-foreground">
                      {user.currency} (Indian Rupee)
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                    Bio
                  </label>
                  <div className="p-3 rounded-lg bg-background border border-border text-sm text-foreground min-h-[100px]">
                    {user.bio || "No information provided yet."}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification/Preferences placeholder */}
            <Card className="bg-card border-border p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Security & Access</h3>
                <p className="text-sm text-muted-foreground">Manage your password and security settings.</p>
              </div>
              <Button variant="outline" className="border-border hover:bg-muted">
                Security Settings
              </Button>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}

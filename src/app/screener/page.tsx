"use client";

import { VolumeScanner } from "@/components/screener/VolumeScanner";
import { BulkDownload } from "@/components/screener/BulkDownload";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ScreenerPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Stock Screener</h1>
          <p className="text-muted-foreground">Advanced filters and real-time market scans.</p>
        </div>

        <div className="space-y-8">
          <VolumeScanner />
          <BulkDownload />
        </div>
      </div>
    </div>
  );
}

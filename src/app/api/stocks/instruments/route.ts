import { NextResponse } from "next/server";
import { fetchInstruments } from "@/lib/instruments";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const instruments = await fetchInstruments();

    // Simplify the data to send less to the client (if needed)
    // The shared utility already returns simplified data
    return NextResponse.json(instruments);
  } catch (error: any) {
    console.error("Error fetching instruments:", error);
    return NextResponse.json(
      { error: "Failed to fetch instruments", details: error.message },
      { status: 500 }
    );
  }
}

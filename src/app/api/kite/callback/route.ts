import { kite } from "@/lib/kite";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestToken = searchParams.get("request_token");

  if (!requestToken) {
    return NextResponse.json(
      { error: "No request_token provided" },
      { status: 400 }
    );
  }

  try {
    const response = await kite.generateSession(
      requestToken,
      process.env.KITE_API_SECRET!
    );

    return NextResponse.json({
      success: true,
      access_token: response.access_token,
      message: "Copy this access_token to your .env file as KITE_ACCESS_TOKEN",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

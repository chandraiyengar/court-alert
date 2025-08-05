import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@/lib/booking-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get("days");
  const daysToFetch = daysParam ? parseInt(daysParam) : 6;

  // Validate days parameter
  if (isNaN(daysToFetch) || daysToFetch < 1 || daysToFetch > 30) {
    return NextResponse.json(
      { success: false, error: "Days parameter must be between 1 and 30" },
      { status: 400 }
    );
  }

  const result = await BookingService.processBookings({
    daysToFetch,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}

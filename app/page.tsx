import { submitTimePreferences } from "@/lib/actions";
import { createClient } from "@/utils/supabase/server";
import CourtAvailabilityView from "@/components/CourtAvailabilityView";
import Link from "next/link";

// Force dynamic rendering since we're fetching real-time data
export const dynamic = "force-dynamic";

interface CourtAvailability {
  id: number;
  date: string;
  time: string;
  location: string;
  spaces: number;
}

export default async function Home() {
  // Fetch court availability data server-side
  let courtAvailability: CourtAvailability[] = [];
  let error: string | null = null;

  try {
    const supabase = await createClient();
    const { data: court_availability, error: fetchError } = await supabase
      .from("court_availability")
      .select("*");

    if (fetchError) {
      console.error("Error fetching court availability:", fetchError);
      error = "Failed to load court availability";
    } else {
      courtAvailability = court_availability || [];
    }
  } catch (fetchError) {
    console.error("Error fetching court availability:", fetchError);
    error = "Failed to load court availability";
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-2">⚠️ {error}</p>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center mb-2">
          Get Notified When Courts Become Available
        </h1>
        <p className="text-muted-foreground text-center text-sm">
          Select time slots to be notified when courts become available
        </p>
      </div>

      <CourtAvailabilityView
        courtAvailability={courtAvailability}
        onSubmit={submitTimePreferences}
      />
    </div>
  );
}

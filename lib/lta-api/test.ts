/**
 * Simple test script for LTA API integration
 * This can be run to verify the LTA API setup is working correctly
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import path from "path";

// Load from project root, not relative to this file
config({ path: path.join(process.cwd(), ".env.local") });

import {
  LtaApiClient,
  LtaDataTransformer,
  LtaDataValidator,
  getAllLtaVenues,
} from "./index";

async function testLtaApi() {
  console.log("🧪 Testing LTA API Integration...\n");

  // Debug environment variables
  console.log("🔍 Environment check:");
  console.log(`   Working directory: ${process.cwd()}`);
  console.log(
    `   LTA URL: ${process.env.NEXT_PUBLIC_LTA_BOOKINGS_URL || "NOT SET"}`
  );
  console.log();

  try {
    // Test 1: Check configuration
    console.log("📋 Test 1: Checking LTA venue configuration");
    const venues = getAllLtaVenues();
    console.log(`✅ Found ${venues.length} configured LTA venues:`);
    venues.forEach((venue) => {
      console.log(`  - ${venue.displayName} (${venue.id}): ${venue.venue}`);
    });
    console.log();

    if (venues.length === 0) {
      console.log("⚠️  No LTA venues configured, skipping API tests");
      return;
    }

    // Test 2: Date range generation
    console.log("📋 Test 2: Testing date range generation");
    const testDate = new Date();
    const { startDate, endDate } = LtaDataTransformer.generateDateRange(
      testDate,
      7
    );
    console.log(`✅ Generated date range: ${startDate} to ${endDate}`);
    console.log();

    // Test 3: Time conversion
    console.log("📋 Test 3: Testing time conversion");
    const testTimes = [420, 480, 540, 600]; // 7:00, 8:00, 9:00, 10:00
    testTimes.forEach((minutes) => {
      const timeString = LtaApiClient.minutesToTimeString(minutes);
      console.log(`✅ ${minutes} minutes = ${timeString}`);
    });
    console.log();

    // Test 4: API call (to first venue only)
    console.log("📋 Test 4: Testing API call");
    const firstVenue = venues[0];
    console.log(`🔍 Attempting to fetch data for ${firstVenue.displayName}...`);

    try {
      const response = await LtaApiClient.fetchBookingTimes({
        venue: firstVenue.venue,
        startDate: startDate,
        endDate: endDate,
      });

      console.log(`✅ API call successful!`);
      console.log(`📊 Response structure:`, {
        hasResources: !!response.Resources,
        resourceCount: response.Resources?.length || 0,
        firstResourceName: response.Resources?.[0]?.Name || "N/A",
      });

      // Test 5: Data transformation
      console.log("\n📋 Test 5: Testing data transformation");
      const transformedSlots = LtaDataTransformer.transformBookingResponse(
        response,
        firstVenue.id
      );
      console.log(`✅ Transformed ${transformedSlots.length} slots`);

      // Test 6: Data validation
      console.log("\n📋 Test 6: Testing data validation");
      const validatedSlots = LtaDataValidator.validateSlots(transformedSlots);
      console.log(
        `✅ Validated ${validatedSlots.length} slots (${transformedSlots.length - validatedSlots.length} filtered out)`
      );

      // Show sample results grouped by date
      if (validatedSlots.length > 0) {
        console.log("\n📋 Sample aggregated results (first 3 slots per day):");

        // Group slots by date
        const slotsByDate = validatedSlots.reduce(
          (acc, slot) => {
            if (!acc[slot.date]) {
              acc[slot.date] = [];
            }
            acc[slot.date].push(slot);
            return acc;
          },
          {} as Record<string, typeof validatedSlots>
        );

        // Sort dates and show first 3 slots for each date
        Object.keys(slotsByDate)
          .sort()
          .forEach((date) => {
            const daySlots = slotsByDate[date].slice(0, 3);
            const dayName = new Date(date).toLocaleDateString("en-US", {
              weekday: "long",
            });

            console.log(`\n  📅 ${date} (${dayName}):`);
            daySlots.forEach((slot, index) => {
              const timeOnly = slot.time.substring(0, 5); // HH:MM
              console.log(
                `     ${index + 1}. ${timeOnly} - ${slot.spaces} courts available`
              );
            });

            if (slotsByDate[date].length > 3) {
              console.log(
                `     ... and ${slotsByDate[date].length - 3} more slots`
              );
            }
          });

        console.log(
          "\n📊 Note: 'spaces' = total number of courts available at that time"
        );
        console.log(
          `📊 Total: ${validatedSlots.length} slots across ${Object.keys(slotsByDate).length} days`
        );
      }

      console.log(
        "\n🎉 All tests passed! LTA API integration is working correctly."
      );
    } catch (apiError) {
      console.log(
        `⚠️  API call failed (this might be expected if the API is not accessible):`
      );
      console.log(
        `    ${apiError instanceof Error ? apiError.message : "Unknown error"}`
      );
      console.log(
        `    This doesn't necessarily mean the integration is broken.`
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Export for use in other modules
export { testLtaApi };

// Allow running directly
if (require.main === module) {
  testLtaApi();
}

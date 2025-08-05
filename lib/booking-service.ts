import { BetterApiClient } from "./better-api/client";
import { DataTransformer, SlotInfo } from "./better-api/transformer";
import { getAllVenueActivities } from "./better-api/config";
import { DatabaseOperations, NewlyAvailableSlot } from "./database/operations";
import { NotificationService } from "./notifications/service";

export interface BookingServiceOptions {
  daysToFetch?: number;
}

export interface BookingServiceResult {
  success: boolean;
  totalSlots: number;
  newlyAvailable: number;
  notificationsSent: number;
  error?: string;
  processingTime: string;
  sampleSlots?: SlotInfo[];
  datesProcessed?: string[];
  activitiesProcessed?: string[];
}

export class BookingService {
  static async processBookings(
    options: BookingServiceOptions = {}
  ): Promise<BookingServiceResult> {
    const { daysToFetch = 6 } = options;
    const processingTime = new Date().toISOString();

    try {
      console.log(`🎾 Starting booking processing for ${daysToFetch} days...`);

      // Generate date range
      const dates = DataTransformer.generateDateRange(new Date(), daysToFetch);

      // Get all venue activities
      const venueActivities = getAllVenueActivities();

      console.log(
        `📊 Fetching slots for ${venueActivities.length} venue + activity combinations across ${dates.length} dates`
      );

      // Fetch and process all slots
      const allSlots = await this.fetchAllSlots(dates, venueActivities);
      console.log(`📊 Total slots found: ${allSlots.length}`);

      // Get previous state and compare
      const previousSlots = await DatabaseOperations.getPreviousState();
      const newlyAvailable = DatabaseOperations.compareStates(
        previousSlots,
        allSlots
      );

      // Handle notifications
      let notificationsSent = 0;
      if (newlyAvailable.length > 0) {
        console.log(`🆕 Found ${newlyAvailable.length} newly available courts`);
        notificationsSent = await this.handleNotifications(newlyAvailable);
        this.logNewlyAvailableSlots(newlyAvailable);
      } else {
        console.log("😔 No newly available courts found");
      }

      // Update database
      await DatabaseOperations.updateState(allSlots);
      console.log("✅ Database updated successfully");

      return {
        success: true,
        totalSlots: allSlots.length,
        newlyAvailable: newlyAvailable.length,
        notificationsSent,
        processingTime,
        sampleSlots: allSlots.slice(0, 5),
        datesProcessed: dates,
        activitiesProcessed: venueActivities.map((a) => a.activity.displayName),
      };
    } catch (error) {
      console.error("❌ Booking processing failed:", error);
      return {
        success: false,
        totalSlots: 0,
        newlyAvailable: 0,
        notificationsSent: 0,
        processingTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private static async fetchAllSlots(
    dates: string[],
    venueActivities: ReturnType<typeof getAllVenueActivities>
  ) {
    const allSlots = [];

    for (const date of dates) {
      for (const { venue, activity, locationId } of venueActivities) {
        try {
          console.log(
            `🔍 Fetching slots for ${activity.displayName} for ${date}...`
          );

          const response = await BetterApiClient.fetchBookingTimes({
            venue: venue.venue,
            activity: activity.activity,
            date: date,
          });

          if (response.data.length === 0) {
            console.warn(`⚠️  No data for ${activity.displayName} on ${date}`);
            continue;
          }

          console.log(
            `📊 ${activity.displayName} on ${date}: found ${response.data.length} raw slots`
          );

          const transformedSlots = DataTransformer.transformBookingResponse(
            response,
            locationId,
            venue.id
          );

          console.log(
            `✅ ${activity.displayName} on ${date}: extracted ${transformedSlots.length} valid slots`
          );

          if (transformedSlots.length > 0) {
            console.log(
              `📋 Sample slots:`,
              transformedSlots.slice(0, 3).map((slot) => ({
                date: slot.date,
                time: slot.time,
                spaces: slot.spaces,
                location: slot.location,
              }))
            );
          }

          allSlots.push(...transformedSlots);

          // Be respectful to the API
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(
            `❌ Failed to fetch ${activity.displayName} for ${date}:`,
            error
          );
          continue;
        }
      }
    }

    return allSlots;
  }

  private static async handleNotifications(
    newlyAvailable: NewlyAvailableSlot[]
  ): Promise<number> {
    const preferences = await NotificationService.getUserPreferences();

    if (preferences.length === 0) {
      console.log("📋 No user preferences found");
      return 0;
    }

    const matches = NotificationService.findPreferenceMatches(
      newlyAvailable,
      preferences
    );

    if (matches.length === 0) {
      console.log("📋 No user preferences match the newly available courts");
      return 0;
    }

    await NotificationService.sendNotificationEmails(matches);

    console.log(NotificationService.formatNotificationSummary(matches));
    return matches.length;
  }

  private static logNewlyAvailableSlots(newlyAvailable: NewlyAvailableSlot[]) {
    console.log("\n🎉 NEWLY AVAILABLE COURTS:");
    newlyAvailable.forEach((slot) => {
      const date = new Date(slot.date).toLocaleDateString("en-GB", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const time = slot.time.substring(0, 5);
      console.log(
        `  📅 ${date} at ${time} (${slot.current_spaces} spaces) - ${slot.location}`
      );
    });
  }
}

import { BetterApiClient } from "./better-api/client";
import { LtaApiClient } from "./lta-api/client";
import { TowerHamletsApiClient } from "./tower-hamlets-api/client";
import { SlotInfo } from "./better-api/transformer";
import { DatabaseOperations, NewlyAvailableSlot } from "./database/operations";
import { NotificationService } from "./notifications/service";

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
  static async processBookings(): Promise<BookingServiceResult> {
    const processingTime = new Date().toISOString();

    try {
      console.log(`🎾 Starting booking processing...`);

      // Fetch and process all slots from all APIs in parallel
      const allSlots = await this.fetchAllSlots();
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
        datesProcessed: [], // No longer applicable since each API handles its own date logic
        activitiesProcessed: [], // No longer applicable since each API handles its own activities
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

  private static async fetchAllSlots(): Promise<SlotInfo[]> {
    console.log("🎾 Fetching slots from all API clients in parallel...");

    try {
      // Call all three API clients in parallel
      const [betterSlots, ltaSlots, towerHamletsSlots] = await Promise.all([
        BetterApiClient.fetchAllSlots().catch((error) => {
          console.error("❌ Failed to fetch Better API slots:", error);
          return [];
        }),
        LtaApiClient.fetchAllSlots().catch((error) => {
          console.error("❌ Failed to fetch LTA API slots:", error);
          return [];
        }),
        TowerHamletsApiClient.getAllBookingTimes().catch((error) => {
          console.error("❌ Failed to fetch Tower Hamlets API slots:", error);
          return [];
        }),
      ]);

      // Combine all results
      const allSlots = [...betterSlots, ...ltaSlots, ...towerHamletsSlots];

      console.log(`✅ Fetched ${betterSlots.length} Better API slots`);
      console.log(`✅ Fetched ${ltaSlots.length} LTA API slots`);
      console.log(
        `✅ Fetched ${towerHamletsSlots.length} Tower Hamlets API slots`
      );
      console.log(`🎯 Total slots combined: ${allSlots.length}`);

      return allSlots;
    } catch (error) {
      console.error("❌ Error in parallel API calls:", error);
      throw error;
    }
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

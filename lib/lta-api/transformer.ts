import { SlotInfo } from "../better-api/transformer";
import { LtaApiResponse, LtaApiClient } from "./client";
import { isWithinLtaOperatingHours } from "./config";

export class LtaDataTransformer {
  static transformBookingResponse(
    response: LtaApiResponse,
    venueId: string
  ): SlotInfo[] {
    if (!response.Resources || !Array.isArray(response.Resources)) {
      console.warn("⚠️  No resources found in LTA API response");
      return [];
    }

    // Track all timeslots with both available and total courts
    const timeslotMap = new Map<string, { available: number; total: number }>();

    for (const resource of response.Resources) {
      if (!resource.Days || !Array.isArray(resource.Days)) {
        continue;
      }

      for (const day of resource.Days) {
        if (!day.Sessions || !Array.isArray(day.Sessions)) {
          continue;
        }

        for (const session of day.Sessions) {
          // Extract just the date part (YYYY-MM-DD) from LTA's ISO date format
          const dateOnly = day.Date.split("T")[0];

          // Calculate how many 1-hour slots this session covers
          const durationMinutes = session.EndTime - session.StartTime;
          const hourlySlots = Math.floor(durationMinutes / 60);

          // Create entries for each 1-hour slot within this session
          for (let i = 0; i < hourlySlots; i++) {
            const slotStartTime = session.StartTime + i * 60;
            const timeString = LtaApiClient.minutesToTimeString(slotStartTime);
            const key = `${dateOnly}|${timeString}`;

            // Initialize or get existing data for this timeslot
            const existing = timeslotMap.get(key) || { available: 0, total: 0 };

            // Always count this court towards the total
            existing.total += 1;

            // Only count towards available if capacity is 1 (available)
            if (session.Capacity === 1) {
              existing.available += 1;
            }

            timeslotMap.set(key, existing);
          }
        }
      }
    }

    // Convert timeslot data to SlotInfo array
    const slots: SlotInfo[] = [];
    for (const [key, data] of timeslotMap.entries()) {
      const [date, time] = key.split("|");

      const slot: SlotInfo = {
        date: date,
        time: time,
        location: venueId, // Just the venue ID, not specific court
        spaces: data.available, // Number of available courts (maintains existing API contract)
      };

      if (this.isValidSlot(slot, venueId)) {
        slots.push(slot);
      }
    }

    console.log(
      `✅ Transformed ${slots.length} total LTA slots for ${venueId} (${response.Resources.length} courts)`
    );
    if (slots.length > 0) {
      console.log(
        `📅 Date range: ${slots[0].date} to ${slots[slots.length - 1].date}`
      );
      // Log summary of availability
      const availableSlots = slots.filter((slot) => slot.spaces > 0).length;
      const fullyBookedSlots = slots.filter((slot) => slot.spaces === 0).length;
      console.log(
        `📊 Availability summary: ${availableSlots} available, ${fullyBookedSlots} fully booked`
      );
    }
    return slots;
  }

  private static isValidSlot(slot: SlotInfo, venueId: string): boolean {
    // Basic validation
    if (
      !slot.date ||
      !slot.time ||
      !slot.location ||
      typeof slot.spaces !== "number"
    ) {
      return false;
    }

    // Check operating hours
    const timeWithoutSeconds = slot.time.substring(0, 5); // Convert HH:MM:SS to HH:MM
    const isWithinHours = isWithinLtaOperatingHours(
      venueId,
      timeWithoutSeconds
    );

    if (!isWithinHours) {
      console.warn(
        `⚠️  LTA slot outside operating hours: ${slot.time} for ${venueId}`
      );
      return false;
    }

    return true;
  }

  static generateDateRange(
    startDate: Date,
    days: number
  ): { startDate: string; endDate: string } {
    const start = this.formatDate(startDate);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days - 1);
    const end = this.formatDate(endDate);

    return { startDate: start, endDate: end };
  }

  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

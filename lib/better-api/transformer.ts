import { BookingTimesResponse, TimeSlot } from "../booking-types";
import { isWithinOperatingHours } from "./config";

export interface SlotInfo {
  date: string;
  spaces: number;
  time: string;
  location: string;
}

export class DataTransformer {
  static transformBookingResponse(
    response: BookingTimesResponse,
    locationId: string,
    venueId: string
  ): SlotInfo[] {
    // Extract activityId from locationId (format: venueId/activityId)
    const activityId = locationId.split("/")[1];

    return response.data
      .filter((slot) => this.isValidSlot(slot, locationId))
      .map((slot) => this.transformSlot(slot, locationId))
      .filter((slot) => this.isWithinOperatingHours(slot, venueId, activityId));
  }

  private static isValidSlot(slot: TimeSlot, locationId: string): boolean {
    const isValidDate = slot.date && slot.date !== "";
    const isValidSpaces = typeof slot.spaces === "number" && slot.spaces >= 0;
    const hasValidTimestamp = slot.timestamp && slot.timestamp > 0;
    const hasValidFormattedTime = slot.starts_at?.format_24_hour;

    if (!isValidDate || !isValidSpaces) {
      console.warn(
        `⚠️  Skipping slot with invalid date/spaces: date=${slot.date}, spaces=${slot.spaces} for ${locationId}`
      );
      return false;
    }

    if (!hasValidTimestamp && !hasValidFormattedTime) {
      console.warn(
        `⚠️  Skipping slot with no valid time data: timestamp=${slot.timestamp}, formatted=${slot.starts_at?.format_24_hour} for ${locationId}`
      );
      return false;
    }

    return true;
  }

  private static transformSlot(slot: TimeSlot, locationId: string): SlotInfo {
    const timeString = this.extractTimeString(slot);

    return {
      date: slot.date,
      spaces: slot.spaces,
      time: timeString,
      location: locationId,
    };
  }

  private static extractTimeString(slot: TimeSlot): string {
    return `${slot.starts_at?.format_24_hour}:00`;
  }

  private static isWithinOperatingHours(
    slot: SlotInfo,
    venueId: string,
    activityId: string
  ): boolean {
    const timeWithoutSeconds = slot.time.substring(0, 5); // Convert HH:MM:SS to HH:MM
    const isWithinHours = isWithinOperatingHours(
      venueId,
      activityId,
      timeWithoutSeconds
    );

    if (!isWithinHours) {
      console.warn(
        `⚠️  Slot outside operating hours: ${slot.time} for ${venueId}/${activityId}`
      );
    }

    return isWithinHours;
  }

  static generateDateRange(startDate: Date, days: number): string[] {
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      dates.push(this.formatDate(currentDate));
    }
    return dates;
  }

  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

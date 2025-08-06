import { TimeSlot, BookingTimesResponse } from "../booking-types";
import { getAllVenueActivities } from "./config";
import { DataTransformer } from "./transformer";

export interface FetchBookingTimesParams {
  venue: string;
  activity: string;
  date: string;
}

interface ApiResponse {
  data: TimeSlot[] | Record<string, TimeSlot> | TimeSlot;
}

export class BetterApiClient {
  private static readonly BOOKING_BASE_URL =
    process.env.NEXT_PUBLIC_BETTER_BOOKINGS_URL + "/location";

  private static readonly DEFAULT_HEADERS = {
    accept: "application/json",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-GB,en;q=0.9",
    "cache-control": "no-cache",
    origin:
      process.env.NEXT_PUBLIC_BETTER_BOOKINGS_URL ??
      (() => {
        throw new Error("Missing NEXT_PUBLIC_BETTER_BOOKINGS_URL");
      })(),
    pragma: "no-cache",
    priority: "u=1, i",
    "sec-ch-ua":
      '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  };

  static async fetchBookingTimes(
    params: FetchBookingTimesParams
  ): Promise<BookingTimesResponse> {
    const { venue, activity, date } = params;
    const url = `${process.env.BETTER_ADMIN_API_URL}/activities/venue/${venue}/activity/${activity}/times?date=${date}`;

    const headers = {
      ...this.DEFAULT_HEADERS,
      referer: `${this.BOOKING_BASE_URL}/${venue}/${activity}/${date}/by-time`,
    };

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log(`📋 API Response for ${activity} on ${date}:`, {
        hasData: !!data.data,
        dataType: typeof data.data,
        isDataArray: Array.isArray(data.data),
        dataKeys:
          data.data && typeof data.data === "object"
            ? Object.keys(data.data)
            : null,
      });

      const timeSlots = this.parseResponseData(data, activity, date);
      const validSlots = this.validateSlots(timeSlots, activity, date);

      return { data: validSlots };
    } catch (error) {
      console.error(
        `❌ Error fetching booking times for ${activity} on ${date}:`,
        error
      );
      throw error;
    }
  }

  private static parseResponseData(
    data: ApiResponse,
    activity: string,
    date: string
  ): TimeSlot[] {
    let timeSlots: TimeSlot[] = [];

    if (Array.isArray(data.data)) {
      // Future dates: { data: [...] }
      timeSlots = data.data;
      console.log(`✅ Found ${timeSlots.length} slots in data.data array`);
    } else if (data.data && typeof data.data === "object") {
      // Today with past times: { data: { "4": {...}, "5": {...} } }
      timeSlots = Object.values(data.data);
      console.log(`✅ Found ${timeSlots.length} slots in data.data object`);
    } else if (Array.isArray(data)) {
      // Maybe the data is directly an array
      timeSlots = data as TimeSlot[];
      console.log(`✅ Found ${timeSlots.length} slots in root array`);
    } else {
      console.warn(
        `⚠️  Unexpected response format for ${activity} on ${date}:`,
        {
          responseKeys:
            data && typeof data === "object" ? Object.keys(data) : [],
          dataType: typeof data.data,
        }
      );
    }

    return timeSlots;
  }

  private static validateSlots(
    timeSlots: TimeSlot[],
    activity: string,
    date: string
  ): TimeSlot[] {
    if (!timeSlots || timeSlots.length === 0) {
      console.warn(`⚠️  No time slots found for ${activity} on ${date}`);
      return [];
    }

    const validSlots = timeSlots.filter(
      (slot) =>
        slot &&
        typeof slot === "object" &&
        (slot.timestamp || slot.starts_at?.format_24_hour) &&
        slot.date &&
        typeof slot.spaces === "number"
    );

    if (validSlots.length !== timeSlots.length) {
      console.warn(
        `⚠️  Filtered out ${timeSlots.length - validSlots.length} invalid slots for ${activity} on ${date}`
      );
    }

    return validSlots;
  }

  private static getDates(): string[] {
    const dates: string[] = [];
    const today = new Date();
    const ukToday = new Date(
      today.toLocaleString("en-US", { timeZone: "Europe/London" })
    );

    for (let i = 0; i < 6; i++) {
      const date = new Date(ukToday);
      date.setDate(ukToday.getDate() + i);
      const dateString = date.toISOString().split("T")[0];
      dates.push(dateString);
    }

    return dates;
  }

  public static async fetchAllSlots() {
    const venueActivities = getAllVenueActivities();
    const dates = BetterApiClient.getDates();
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

  static async getAllBookingTimes(): Promise<
    Array<{
      venue: string;
      activity: string;
      date: string;
      data: BookingTimesResponse;
      error?: string;
    }>
  > {
    const dates = this.getDates();
    const venueActivities = getAllVenueActivities();

    const results: Array<{
      venue: string;
      activity: string;
      date: string;
      data: BookingTimesResponse;
      error?: string;
    }> = [];

    for (const { venue, activity } of venueActivities) {
      for (const date of dates) {
        try {
          const data = await this.fetchBookingTimes({
            venue: venue.venue,
            activity: activity.activity,
            date: date,
          });

          results.push({
            venue: venue.venue,
            activity: activity.activity,
            date: date,
            data: data,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          results.push({
            venue: venue.venue,
            activity: activity.activity,
            date: date,
            data: { data: [] },
            error: errorMessage,
          });
        }
      }
    }

    return results;
  }

  static generateBookingUrl(
    venue: string,
    activity: string,
    date: string,
    startTime: string,
    endTime: string
  ): string {
    return `${this.BOOKING_BASE_URL}/${venue}/${activity}/${date}/by-time/slot/${startTime}-${endTime}`;
  }
}

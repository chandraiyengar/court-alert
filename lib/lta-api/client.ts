export interface FetchBookingTimesParams {
  venue: string;
  startDate: string;
  endDate: string;
}

export interface LtaSession {
  Name: string;
  Category: number;
  StartTime: number; // minutes from midnight
  EndTime: number; // minutes from midnight
  Capacity: number; // 1 = available, 0 = booked
  CourtCost?: number;
  LightingCost?: number;
}

export interface LtaDay {
  Date: string;
  Sessions: LtaSession[];
}

export interface LtaResource {
  Name: string; // Court name (e.g., "Court 1", "Court 2")
  Days: LtaDay[];
}

export interface LtaApiResponse {
  Resources: LtaResource[];
}

export class LtaApiClient {
  private static getBaseUrl(): string {
    const url = process.env.NEXT_PUBLIC_LTA_BOOKINGS_URL;
    if (!url) {
      throw new Error(
        "Missing NEXT_PUBLIC_LTA_BOOKINGS_URL environment variable"
      );
    }
    return url;
  }

  private static readonly DEFAULT_HEADERS = {
    accept: "application/json",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-GB,en;q=0.9",
    "cache-control": "no-cache",
    pragma: "no-cache",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  };

  static async fetchBookingTimes(
    params: FetchBookingTimesParams
  ): Promise<LtaApiResponse> {
    const { venue, startDate, endDate } = params;
    const timestamp = Date.now();
    const url = `${this.getBaseUrl()}/${venue}/GetVenueSessions?resourceID=&startDate=${startDate}&endDate=${endDate}&roleId=&_=${timestamp}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.DEFAULT_HEADERS,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log(
        `📋 LTA API Response for ${venue} (${startDate} to ${endDate}):`,
        {
          hasResources: !!data.Resources,
          resourceCount: data.Resources?.length || 0,
        }
      );

      return data as LtaApiResponse;
    } catch (error) {
      console.error(
        `❌ Error fetching LTA booking times for ${venue} (${startDate} to ${endDate}):`,
        error
      );
      throw error;
    }
  }

  static minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:00`;
  }

  static isAvailableSession(session: LtaSession): boolean {
    // Court is available when Capacity == 1
    return session.Capacity === 1;
  }
}

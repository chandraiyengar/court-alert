# Booking System Architecture

This project has been refactored into a clean, modular architecture that makes it easy to add new venues with different operating hours and configurations.

## Architecture Overview

```
lib/
├── better-api/           # Better API integration
│   ├── config.ts        # Venue and activity configurations
│   ├── client.ts        # API client for Better endpoints
│   ├── transformer.ts   # Data transformation logic
│   └── validator.ts     # Data validation logic
├── database/            # Database operations
│   └── operations.ts    # Supabase CRUD operations
├── notifications/       # Email notifications
│   └── service.ts       # Email service and user preferences
├── booking-service.ts   # Main orchestrator service
└── booking-types.ts     # TypeScript interfaces
```

## Key Components

### 1. Configuration System (`better-api/config.ts`)

The heart of the system is the venue configuration:

```typescript
const VENUE_CONFIGS: VenueConfig[] = [
  {
    id: "islington-tennis-centre",
    name: "Islington Tennis Centre",
    venue: "islington-tennis-centre",
    activities: [
      {
        id: "highbury-tennis",
        name: "Highbury Tennis",
        activity: "highbury-tennis",
        displayName: "Highbury Tennis (Outdoor)",
      },
      // ... more activities
    ],
    operatingHours: {
      startTime: "06:00",
      endTime: "23:00",
    },
    bookingUrl: ,
    timezone: "Europe/London",
  },
  // Add more venues here...
];
```

### 2. API Client (`better-api/client.ts`)

Handles all communication with the Better API:

- Fetches booking times for specific venues/activities/dates
- Handles different response formats (arrays vs objects)
- Validates responses before processing

### 3. Data Transformer (`better-api/transformer.ts`)

Converts Better API responses into our internal format:

- Handles both timestamp and formatted time fields
- Filters slots based on operating hours
- Validates data integrity

### 4. Database Operations (`database/operations.ts`)

Manages all Supabase operations:

- Stores/retrieves court availability
- Compares states to find newly available courts
- Uses upsert for efficient updates

### 5. Notification Service (`notifications/service.ts`)

Handles email notifications:

- Matches newly available slots with user preferences
- Sends formatted email notifications
- Manages user preference queries

### 6. Booking Service (`booking-service.ts`)

Main orchestrator that coordinates all components:

- Processes bookings for all configured venues
- Handles error recovery and logging
- Provides clean API for the route

## Adding New Venues

To add a new venue, simply add it to the `VENUE_CONFIGS` array:

```typescript
{
  id: "new-venue-id",
  name: "New Venue Name",
  venue: "new-venue-slug", // From Better API
  activities: [
    {
      id: "activity-1",
      name: "Activity 1",
      activity: "activity-1-slug", // From Better API
      displayName: "Activity 1 (Description)",
    },
  ],
  operatingHours: {
    startTime: "07:00", // Custom start time
    endTime: "22:00",   // Custom end time
  },
  bookingUrl: ,
  timezone: "Europe/London",
}
```

## API Usage

### Basic Usage

```
GET /api/fetch-booking-times
```

### Test Mode (safe for development)

```
GET /api/fetch-booking-times?test=true
```

### Custom Days

```
GET /api/fetch-booking-times?days=3
```

## Benefits of This Architecture

1. **Modular**: Each component has a single responsibility
2. **Configurable**: Easy to add new venues with different operating hours
3. **Testable**: Each module can be tested independently
4. **Maintainable**: Clear separation of concerns
5. **Scalable**: Can easily handle many venues and activities
6. **Robust**: Better error handling and validation

## Migration from Old Route

The old 889-line route has been replaced with a 29-line route that uses this modular system. All functionality has been preserved while making it much easier to maintain and extend.

## Operating Hours

The system automatically filters slots based on each venue's operating hours. For example:

- Venue A: 06:00-23:00
- Venue B: 07:00-22:00
- Venue C: 08:00-21:00

Each venue's slots will be filtered to only include times within their operating hours.

## Error Handling

The system includes comprehensive error handling:

- Individual venue/activity failures don't stop the entire process
- Detailed logging for debugging
- Graceful fallbacks for API issues
- Data validation at multiple levels

## Future Enhancements

With this architecture, you can easily add:

- New venues with different operating hours
- Different booking systems (not just Better)
- More complex notification rules
- Additional data validation rules
- Different time zones per venue
- Holiday schedule handling

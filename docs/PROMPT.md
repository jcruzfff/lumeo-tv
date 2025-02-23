# Lumeo Event Management System - Prompt Reference

## CRITICAL: Source of Truth Directive

This document serves as the ABSOLUTE SOURCE OF TRUTH for the Lumeo Event Management System. When making any changes or additions to the system:

1. ALWAYS consult this document first
2. NEVER deviate from the type structures and naming conventions defined here
3. ANY new patterns or changes MUST be documented here first
4. VERIFY all implementations against this reference
5. If you find inconsistencies between the code and this document:
   - Stop implementation
   - Update this document first
   - Then update the code to match
6. When in doubt, this document overrides any conflicting patterns in the codebase

## Overview

This document serves as a comprehensive reference for the Lumeo Event Management System, detailing all data structures, naming conventions, and system components. Use this as a guide when developing or modifying the application.

## Core Concepts

### Event Types

- `POKER`: Table-based game with blind levels and waiting list
- `BASKETBALL`: Score-based game with periods
- `CUSTOM`: Simple timer-based event

### Type Structure and Consistency

All type definitions are centralized in `app/types/events.ts`. This is the source of truth for:

- Event core types (`Event`, `EventType`, `EventStatus`)
- Settings types (`PokerSettings`, `BasketballSettings`, `CustomSettings`)
- Room management types (`Table`, `Seat`, `Player`)
- Display types (`DisplaySettings`, `MediaItem`)
- Type guards for runtime validation

Key requirements:

1. Never define these types locally in components
2. Always import types from `@/app/types/events`
3. Use type guards when handling settings to ensure type safety
4. Keep property names consistent across the codebase (e.g., `playerName` not `name` for seat occupants)
5. Maintain backward compatibility when modifying types
6. Update all related components when adding new type properties
7. Keep function names consistent between contexts and components:
   - Use `addToWaitlist` not `addToWaitingList`
   - Use `removeFromWaitlist` not `removeFromWaitingList`
   - Use `reorderWaitlist` not `reorderWaitingList`
   - Always check context implementation for correct function names

Type Relationships and Validation:

1. Room Management:

   - `RoomManagementSettings` is extended by `PokerSettings`
   - `Seat` and `Player` have a one-to-one relationship through `playerId`
   - `Table` contains an array of `Seat`
   - All `playerName` and `playerId` fields must be explicitly null (not undefined)

2. Type Guards:

   ```typescript
   // Always use type guards for runtime validation
   function isPokerSettings(settings: any): settings is PokerSettings;
   function isBasketballSettings(settings: any): settings is BasketballSettings;
   function isCustomSettings(settings: any): settings is CustomSettings;
   function isPlayer(obj: any): obj is Player;
   function isSeat(obj: any): obj is Seat;
   ```

3. Required Fields:

   - Player must always have: id, eventId, name, position, addedAt
   - Seat must always have: id, tableId, position, playerId (null if empty), playerName (null if empty), createdAt
   - All date fields should use ISO string format
   - All IDs should be strings

4. Type Safety:
   - Use type guards before accessing type-specific properties
   - Validate data shapes when receiving from API
   - Ensure null checks for optional fields
   - Use proper typing for state management

### Event Lifecycle

- `SCHEDULED`: Initial state, configuration phase
- `ACTIVE`: Event is running
- `ENDED`: Event has concluded

## Data Structures

### Event Core

```typescript
// Base Event Structure
interface Event {
  id: string; // Unique identifier
  name: string; // Display name
  type: EventType; // POKER | BASKETBALL | CUSTOM
  status: EventStatus; // SCHEDULED | ACTIVE | ENDED
  settings: EventSettings; // Type-specific settings
  createdAt: string; // ISO date string
  startedAt: string; // ISO date string
  endedAt?: string; // ISO date string
  displayUrl: string; // Public display URL
  adminUrl: string; // Admin control URL
  mediaItems: MediaItem[]; // Associated media
}

// Event Settings by Type
interface PokerSettings {
  timeRemaining: number; // Seconds
  currentLevel: number; // Current blind level index
  levels: Level[]; // Blind level configurations
  isRunning: boolean; // Timer state
  showWaitlistOnDisplay: boolean; // Display configuration
  isRoomManagementEnabled: boolean; // Feature flag
}

interface BasketballSettings {
  gameTime: number; // Seconds
  period: number; // Current period (1-based)
  totalPeriods: number; // Total number of periods
  homeScore: number; // Current home team score
  awayScore: number; // Current away team score
  isRunning: boolean; // Timer state
}

interface CustomSettings {
  timeRemaining: number; // Seconds
  isRunning: boolean; // Timer state
}
```

### Poker Room Management

```typescript
interface Table {
  id: string; // Unique identifier
  number: number; // Display number
  seats: Seat[]; // Array of seats
  createdAt: string; // ISO date string
}

interface Seat {
  id: string; // Unique identifier
  position: number; // Seat position (1-based)
  playerId?: string; // Occupied player ID
  playerName?: string; // Occupied player name
}

interface Player {
  id: string; // Unique identifier
  name: string; // Display name
  position: number; // Waitlist position
}

interface Level {
  id: string; // Unique identifier
  smallBlind: number; // Small blind amount
  bigBlind: number; // Big blind amount
  duration: number; // Level duration in seconds
}
```

### Media Management

```typescript
interface MediaItem {
  id: string; // Unique identifier
  type: "image" | "video"; // Media type
  path: string; // Resource location
  duration?: number; // Video duration in seconds
}

interface DisplaySettings {
  aspectRatio: "16:9" | "4:3" | "21:9";
  timerPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  mediaInterval: number; // Seconds between media switches
  showTimer: boolean; // Timer visibility
  theme: "dark" | "light";
  customColors: {
    timerText: string; // Hex color
    timerBackground: string; // Hex color
  };
}
```

## State Management

### Local Storage Keys

```typescript
const STORAGE_KEYS = {
  ACTIVE_EVENT_ID: "activeEventId",
  TIMER_STATE: "timerState",
  MEDIA_STATE: "mediaState",
  DISPLAY_SETTINGS: "displaySettings",
  POKER_ROOM_STATE: "pokerRoomState",
} as const;
```

### Context Providers

- `TimerContext`: Manages timer state for all event types
- `MediaContext`: Handles media cycling and display
- `PokerRoomContext`: Manages poker room state (tables, seats, waitlist)

## API Endpoints

### Event Management

```typescript
POST   /api/events                    // Create event
GET    /api/events/:eventId           // Fetch event
PATCH  /api/events/:eventId           // Update event
DELETE /api/events/:eventId           // Delete event
```

### Poker Room Management

```typescript
POST   /api/events/:eventId/waitinglist         // Add player
DELETE /api/events/:eventId/waitinglist/:id     // Remove player
PATCH  /api/events/:eventId/waitinglist/reorder // Reorder waitlist
```

## Validation Rules

### Event Names

- Non-empty string
- Maximum 100 characters

### Player Names

- Non-empty string
- Maximum 50 characters
- No special characters

### Blind Levels

- Minimum 1 level
- Small blind < Big blind
- Duration > 0 seconds

### Tables

- Maximum 10 tables per event
- 9 seats per table
- Unique table numbers

## Time Unit Standards

- All frontend timers use seconds
- All API durations use seconds
- All date-times use ISO string format
- All display durations should show MM:SS format

## Display Standards

- All currency values should show $ prefix
- All positions should be 1-based
- All IDs should be strings
- All state updates should be atomic

## Error Handling

- All API errors should return proper HTTP status codes
- All frontend errors should show user-friendly messages
- All state updates should handle error cases
- All async operations should have proper error boundaries

## Performance Guidelines

- Batch updates when possible
- Use optimistic updates for better UX
- Cache frequently accessed data
- Implement proper cleanup on unmount

## Security Considerations

- All API endpoints require authentication
- All sensitive operations require validation
- All user input must be sanitized
- All state updates must be authorized

## Development Workflow

1. Always reference this prompt for consistency
2. Follow type definitions strictly
3. Maintain backward compatibility
4. Document all changes
5. Update tests accordingly

## Common Pitfalls

1. Mixing time units (seconds vs minutes)
2. Inconsistent ID types (string vs number)
3. Missing error handling
4. Incomplete state updates
5. Race conditions in async operations

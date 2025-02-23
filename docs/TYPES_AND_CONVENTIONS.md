# Lumeo Event Management System - Types and Conventions

## Core Types

### Event Types

```typescript
interface Event {
  id: string;
  name: string;
  type: "POKER" | "BASKETBALL" | "CUSTOM";
  status: "ACTIVE" | "ENDED" | "SCHEDULED";
  settings: PokerSettings | BasketballSettings | CustomSettings;
  mediaItems: MediaItem[];
  displayUrl: string;
  adminUrl: string;
  createdAt: string;
  startedAt: string;
}

// Poker-specific event
interface PokerEvent extends Event {
  type: "POKER";
  settings: PokerSettings;
  tables: Table[];
  waitingList: Player[];
}

// Basketball-specific event
interface BasketballEvent extends Event {
  type: "BASKETBALL";
  settings: BasketballSettings;
}
```

### Settings Types

```typescript
interface PokerSettings {
  timeRemaining: number; // in seconds
  currentLevel: number; // 0-based index
  levels: Level[];
  isRunning: boolean;
  showWaitlistOnDisplay: boolean;
  isRoomManagementEnabled: boolean;
}

interface BasketballSettings {
  gameTime: number; // in seconds
  period: number; // 1-based
  totalPeriods: number;
  homeScore: number;
  awayScore: number;
  isRunning: boolean;
}

interface CustomSettings {
  timeRemaining: number; // in seconds
  isRunning: boolean;
}

interface Level {
  smallBlind: number;
  bigBlind: number;
  duration: number; // in seconds
}
```

### Media Types

```typescript
interface MediaItem {
  id: string;
  type: "image" | "video";
  path: string;
  duration?: number; // for videos
}

interface MediaState {
  mediaItems: MediaItem[];
  currentMediaIndex: number;
}
```

### Poker Room Types

```typescript
interface Player {
  id: string;
  name: string;
}

interface Seat {
  id: string;
  position: number;
  playerId?: string;
  playerName?: string;
}

interface Table {
  id: string;
  number: number;
  seats: Seat[];
}

interface PokerRoomState {
  tables: Table[];
  waitingList: Player[];
  showRoomInfo: boolean;
  isRoomManagementEnabled: boolean;
  showWaitlistOnDisplay: boolean;
}
```

### Display Settings

```typescript
interface DisplaySettings {
  aspectRatio: "16:9" | "4:3" | "21:9";
  timerPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  mediaInterval: number; // in seconds
  showTimer: boolean;
  theme: "dark" | "light";
  customColors: {
    timerText: string; // hex color
    timerBackground: string; // hex color
  };
}
```

## Component Props

### TableManager Props

```typescript
interface TableManagerProps {
  tables: {
    id: number;
    seats: (Player | null)[];
  }[];
  onAssignSeatAction: (tableId: number, seatIndex: number) => void;
  onEmptySeatAction: (tableId: number, seatIndex: number) => void;
  onRemoveTableAction: (tableId: number) => void;
}
```

### WaitingList Props

```typescript
interface WaitingListProps {
  players: Player[];
  onAddPlayerAction: (name: string) => void;
  onRemovePlayerAction: (index: number) => void;
  onReorderPlayersAction: (newOrder: Player[]) => void;
}
```

## Local Storage Keys

```typescript
const LOCAL_STORAGE_KEYS = {
  ACTIVE_EVENT_ID: "activeEventId",
  TIMER_STATE: "timerState",
  MEDIA_STATE: "mediaState",
  DISPLAY_SETTINGS: "displaySettings",
  POKER_ROOM_STATE: "pokerRoomState",
  TIMER_PERSISTENT_STATE: "timerPersistentState",
} as const;
```

## API Endpoints

### Event Management

```typescript
// Event CRUD
POST   /api/events                    // Create new event
GET    /api/events                    // List all events
GET    /api/events/:eventId           // Get single event
PATCH  /api/events/:eventId           // Update event
DELETE /api/events/:eventId           // Delete event

// Timer Management
POST   /api/events/:eventId/timer     // Timer actions (start/stop/update)

// Score Management (Basketball)
POST   /api/events/:eventId/score     // Update score

// Poker Room Management
POST   /api/events/:eventId/tables              // Add table
DELETE /api/events/:eventId/tables/:tableId     // Remove table
PATCH  /api/events/:eventId/tables/:tableId     // Update table

POST   /api/events/:eventId/waitinglist         // Add player
DELETE /api/events/:eventId/waitinglist/:id     // Remove player
PATCH  /api/events/:eventId/waitinglist/reorder // Reorder waitlist
```

## Broadcast Channel Events

```typescript
interface BroadcastEvent {
  type: "TIMER_UPDATE" | "END_EVENT" | "ROOM_UPDATE";
  eventId: string;
  timestamp: string;
  data?: any;
}

const BROADCAST_CHANNEL_NAME = "lumeo-events";
```

## Function Naming Conventions

### Event Management

- `toggleTimer`
- `addPlayer`
- `removePlayer`
- `addTable`
- `removeTable`
- `updateScore`
- `endEvent`
- `assignSeat`
- `emptySeat`
- `reorderWaitlist`

### Display Management

- `enableFullscreen`
- `handleFullscreenChange`
- `cycleMedia`
- `formatTime`
- `pollRoomState`
- `pollScore`

## State Management

### Event Creation Flow

1. Create Event (`/events/new/[type]`)
2. Configure Settings
3. Add Media (optional)
4. Set Display Settings
5. Launch Event

### Event Management Flow

1. Load Event
2. Initialize Components
3. Set Up Polling
4. Handle Updates
5. Sync with Display

### Display Flow

1. Load Event
2. Initialize Display
3. Set Up Polling
4. Handle Updates
5. Cycle Media/Timer

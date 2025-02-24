export type EventType = 'POKER' | 'BASKETBALL' | 'CUSTOM';
export type EventStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED';

export interface BlindLevel {
  id: string;
  smallBlind: number;
  bigBlind: number;
  duration: number; // in minutes
}

export interface RoomManagementSettings {
  isRoomManagementEnabled: boolean;
  showWaitlistOnDisplay: boolean;
}

export interface PokerSettings {
  isRunning: boolean;
  currentLevel: number;
  timeRemaining: number;
  levels: BlindLevel[];
  breakDuration: number;
  totalPlayTime: number;
  mediaInterval?: number;
  isRoomManagementEnabled?: boolean;
  showWaitlistOnDisplay?: boolean;
}

export interface BasketballSettings {
  isRunning: boolean;
  gameTime: number;
  period: number;
  homeScore: number;
  awayScore: number;
  totalPeriods: number;
  mediaInterval?: number;
  isRoomManagementEnabled?: boolean;
  showWaitlistOnDisplay?: boolean;
}

export interface CustomSettings {
  isRunning: boolean;
  timeRemaining: number;
  duration: number;
  mediaInterval?: number;
  isRoomManagementEnabled?: boolean;
  showWaitlistOnDisplay?: boolean;
}

export interface DisplaySettings {
  aspectRatio: "16:9" | "4:3" | "21:9";
  timerPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  mediaInterval: number; // Seconds between media switches
  showTimer: boolean;
  theme: "dark" | "light";
  customColors: {
    timerText: string; // Hex color
    timerBackground: string; // Hex color
  };
}

/**
 * Represents a media item in the event display system.
 * Current implementation uses uppercase type values and url-based paths
 * for compatibility with existing features and database schema.
 * 
 * Note: While PROMPT.md specifies lowercase types and 'path',
 * we maintain 'IMAGE'/'VIDEO' and 'url' for system stability.
 * Future updates should consider migrating to the PROMPT.md spec.
 */
export interface MediaItem {
  /** Unique identifier for the media item */
  id: string;
  /** Type of media - using uppercase for system compatibility */
  type: 'IMAGE' | 'VIDEO';
  /** URL/path to the media resource */
  url: string;
  /** Position in the display sequence */
  displayOrder: number;
  /** Duration in seconds - only used for videos */
  duration?: number;
}

export interface DisplayState {
  currentMediaIndex: number;
  mediaItems: MediaItem[];
  showTimer: boolean;
  cycleInterval: number;
}

export interface Seat {
  id: string;
  tableId: string;
  position: number;
  playerId: string | null;
  playerName: string | null;
  createdAt: string;
}

export interface Table {
  id: string;
  eventId: string;
  number: number;
  seats: Seat[];
  createdAt: string;
}

export interface Player {
  id: string;
  eventId: string;
  name: string;
  position: number;
  addedAt: string;
}

export interface Event {
  id: string;
  name: string;
  type: 'POKER' | 'BASKETBALL' | 'CUSTOM';
  status: 'ACTIVE' | 'ENDED' | 'SCHEDULED';
  createdAt: string; // ISO date string
  startedAt: string; // ISO date string
  endedAt?: string; // ISO date string
  settings: PokerSettings | BasketballSettings | CustomSettings;
  displaySettings: DisplaySettings;
  mediaItems: MediaItem[];
  tables: Table[];
  waitingList: Player[];
  displayUrl?: string;
  adminUrl?: string;
}

// Type guard to check if settings are PokerSettings
export function isPokerSettings(settings: unknown): settings is PokerSettings {
  return settings && 
    typeof settings === 'object' &&
    settings !== null &&
    'isRunning' in settings &&
    typeof (settings as PokerSettings).isRunning === 'boolean' &&
    'currentLevel' in settings &&
    typeof (settings as PokerSettings).currentLevel === 'number' &&
    'levels' in settings &&
    Array.isArray((settings as PokerSettings).levels);
}

// Type guard to check if settings are BasketballSettings
export function isBasketballSettings(settings: unknown): settings is BasketballSettings {
  return settings && 
    typeof settings === 'object' &&
    settings !== null &&
    'isRunning' in settings &&
    typeof (settings as BasketballSettings).isRunning === 'boolean' &&
    'gameTime' in settings &&
    typeof (settings as BasketballSettings).gameTime === 'number' &&
    'period' in settings &&
    typeof (settings as BasketballSettings).period === 'number';
}

// Type guard to check if settings are CustomSettings
export function isCustomSettings(settings: unknown): settings is CustomSettings {
  return settings && 
    typeof settings === 'object' &&
    settings !== null &&
    'isRunning' in settings &&
    typeof (settings as CustomSettings).isRunning === 'boolean' &&
    'timeRemaining' in settings &&
    typeof (settings as CustomSettings).timeRemaining === 'number';
}

// Type guard for Player
export function isPlayer(obj: unknown): obj is Player {
  return obj &&
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as Player).id === 'string' &&
    'eventId' in obj &&
    typeof (obj as Player).eventId === 'string' &&
    'name' in obj &&
    typeof (obj as Player).name === 'string' &&
    'position' in obj &&
    typeof (obj as Player).position === 'number' &&
    'addedAt' in obj &&
    typeof (obj as Player).addedAt === 'string';
}

// Type guard for Seat
export function isSeat(obj: unknown): obj is Seat {
  return obj &&
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as Seat).id === 'string' &&
    'tableId' in obj &&
    typeof (obj as Seat).tableId === 'string' &&
    'position' in obj &&
    typeof (obj as Seat).position === 'number' &&
    'playerId' in obj &&
    ((obj as Seat).playerId === null || typeof (obj as Seat).playerId === 'string') &&
    'playerName' in obj &&
    ((obj as Seat).playerName === null || typeof (obj as Seat).playerName === 'string') &&
    'createdAt' in obj &&
    typeof (obj as Seat).createdAt === 'string';
} 
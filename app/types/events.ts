export type EventType = 'POKER' | 'BASKETBALL' | 'CUSTOM';
export type EventStatus = 'ACTIVE' | 'ENDED' | 'SCHEDULED';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  displayOrder: number;
  duration?: number;
}

export interface Table {
  id: string;
  number: number;
  seats: {
    id: string;
    position: number;
    playerId?: string;
    playerName?: string;
  }[];
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  position: number;
  addedAt: string;
}

export interface Event {
  id: string;
  name: string;
  type: EventType;
  status: EventStatus;
  settings: {
    timeRemaining?: number;
    currentLevel?: number;
    levels?: { smallBlind: number; bigBlind: number }[];
    gameTime?: number;
    period?: number;
    totalPeriods?: number;
    homeScore?: number;
    awayScore?: number;
    isRunning?: boolean;
  };
  mediaItems: MediaItem[];
  tables: Table[];
  waitingList: Player[];
  createdAt: string;
  startedAt: string;
  endedAt?: string;
  creatorId?: string;
  displayUrl: string;
  adminUrl: string;
} 
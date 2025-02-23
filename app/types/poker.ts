import { MediaItem } from './media';

// Core Types
export interface PokerEvent {
  id: string;
  name: string;
  type: 'POKER';
  status: 'ACTIVE' | 'ENDED' | 'SCHEDULED';
  settings: PokerSettings;
  mediaItems: MediaItem[];
  displayUrl: string;
  adminUrl: string;
  createdAt: string;
  startedAt: string;
  tables: Table[];
  waitingList: Player[];
}

// Settings
export interface PokerSettings {
  timeRemaining: number;
  currentLevel: number;
  levels: Level[];
  isRunning: boolean;
  showWaitlistOnDisplay: boolean;
  isRoomManagementEnabled: boolean;
}

export interface Level {
  id: string;
  smallBlind: number;
  bigBlind: number;
  duration: number;
}

// Room Management
export interface Player {
  id: string;
  name: string;
}

export interface Seat {
  id: string;
  position: number;
  playerId?: string;
  playerName?: string;
}

export interface Table {
  id: string;
  number: number;
  seats: Seat[];
}

// Component Props
export interface TableManagerProps {
  tables: Table[];
  onAssignSeatAction: (tableId: string, seatIndex: number) => void;
  onEmptySeatAction: (tableId: string, seatIndex: number) => void;
  onRemoveTableAction: (tableId: string) => void;
}

export interface WaitingListProps {
  players: Player[];
  onAddPlayerAction: (name: string) => void;
  onRemovePlayerAction: (index: number) => void;
  onReorderPlayersAction: (newOrder: Player[]) => void;
}

export interface PokerTableProps {
  seats: Seat[];
  onAssignSeatAction: (seatIndex: number) => void;
  onEmptySeatAction: (seatIndex: number) => void;
}

// Room State
export interface PokerRoomState {
  tables: Table[];
  waitingList: Player[];
  showRoomInfo: boolean;
  isRoomManagementEnabled: boolean;
  showWaitlistOnDisplay: boolean;
} 
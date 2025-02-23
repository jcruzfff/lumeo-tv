'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Event, Player, Table } from '@/app/types/events';
import { useEventManagement } from '@/app/hooks/useEventManagement';
import { useSession } from 'next-auth/react';

export default function EventManagement() {
  const { eventId } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [initialEvent, setInitialEvent] = useState<Event | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  console.log('[EventManagement] Initializing with:', {
    eventId,
    sessionStatus: status,
    isAuthenticated: !!session
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      console.log('[EventManagement] User not authenticated, redirecting to signin');
      router.push('/auth/signin');
      return;
    }

    const fetchEvent = async () => {
      console.log('[EventManagement] Fetching event data for:', eventId);
      try {
        const response = await fetch(`/api/events/${eventId}`);
        console.log('[EventManagement] Event fetch response:', {
          status: response.status,
          ok: response.ok
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.log('[EventManagement] Unauthorized access, redirecting to signin');
            router.push('/auth/signin');
            return;
          }
          throw new Error('Failed to fetch event');
        }

        const data = await response.json();
        console.log('[EventManagement] Event data received:', {
          id: data.id,
          type: data.type,
          status: data.status
        });

        if (data.status === 'ENDED') {
          setInitialError('This event has ended');
          return;
        }

        setInitialEvent(data);
      } catch (error) {
        console.error('[EventManagement] Error fetching event:', error);
        setInitialError(error instanceof Error ? error.message : 'Failed to load event');
      } finally {
        setIsInitialLoading(false);
      }
    };

    if (status === 'authenticated') {
      console.log('[EventManagement] User authenticated, fetching event');
      fetchEvent();
    }
  }, [eventId, router, status]);

  const {
    event,
    isLoading,
    error,
    toggleTimer,
    addPlayer,
    removePlayer,
    reorderWaitingList,
    addTable,
    removeTable,
    updateTableSeats,
    updateScore,
    endEvent,
    refreshEvent
  } = useEventManagement({
    eventId: eventId as string,
    initialEvent: initialEvent
  });

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isInitialLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#1D1D1F] pt-8 pl-8">
        <div className="flex-1 border-l border-t bg-[#161618] border-[#2C2C2E] rounded-tl-[32px] p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-text-primary mb-8">Loading event...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (initialError || error || !event || !initialEvent) {
    return (
      <div className="min-h-screen bg-[#1D1D1F] pt-8 pl-8">
        <div className="flex-1 border-l border-t bg-[#161618] border-[#2C2C2E] rounded-tl-[32px] p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-text-primary mb-4">Error</h1>
            <p className="text-text-secondary">{initialError || error || 'Event not found'}</p>
            <Link
              href="/events/active"
              className="inline-block mt-4 text-brand-primary hover:text-brand-primary/90 transition-colors"
            >
              ← Back to Active Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1D1D1F] pt-8 pl-8">
      <div className="flex-1 border-l border-t bg-[#161618] border-[#2C2C2E] rounded-tl-[32px] p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                href="/events/active"
                className="text-text-secondary hover:text-text-primary transition-colors mb-2 inline-block"
              >
                ← Back to Active Events
              </Link>
              <h1 className="text-2xl font-bold text-text-primary">{event.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const windowFeatures = {
                    menubar: 'no',
                    toolbar: 'no',
                    location: 'no',
                    status: 'no',
                    resizable: 'yes'
                  };
                  const featuresString = Object.entries(windowFeatures)
                    .map(([key, value]) => `${key}=${value}`)
                    .join(',');

                  const displayUrl = `/display/${event.id}`;
                  const displayWindow = window.open(displayUrl, `lumeo_display_${event.id}`, featuresString);
                  if (displayWindow) {
                    displayWindow.focus();
                  } else {
                    alert('Please allow popups to open the display window');
                  }
                }}
                className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
              >
                Open Display
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to end this event?')) {
                    endEvent();
                  }
                }}
                className="px-4 py-2 bg-status-error text-white rounded-lg hover:bg-status-error/90 transition-colors"
              >
                End Event
              </button>
            </div>
          </div>

          {event.type === 'POKER' && (
            <div className="grid grid-cols-[400px_1fr] gap-8">
              {/* Left Column - Game Details & Waitlist */}
              <div className="space-y-6">
                {/* Game Details */}
                <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] p-6 rounded-xl">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-text-primary">Game Details</h2>
                    <p className="text-text-secondary mt-2">Current game status and controls</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="text-[64px] font-bold text-white leading-none">
                        {formatTime(event.settings.timeRemaining ?? 0)}
                      </div>
                      <div className="text-text-secondary mt-2">
                        Level {(event.settings.currentLevel ?? 0) + 1} of {event.settings.levels?.length ?? 0}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-text-secondary mb-1">Small Blind</div>
                        <div className="text-xl font-mono text-text-primary">
                          ${event.settings.levels?.[event.settings.currentLevel ?? 0]?.smallBlind ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-text-secondary mb-1">Big Blind</div>
                        <div className="text-xl font-mono text-text-primary">
                          ${event.settings.levels?.[event.settings.currentLevel ?? 0]?.bigBlind ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <button
                        onClick={toggleTimer}
                        className="px-6 py-3 rounded-lg font-medium transition-colors bg-brand-primary text-white hover:bg-brand-primary/90"
                      >
                        Timer Running
                      </button>
                    </div>
                  </div>
                </div>

                {/* Waiting List */}
                <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] p-6 rounded-xl">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-text-primary">Waiting List</h2>
                    <p className="text-text-secondary mt-2">Players waiting to join a table</p>
                  </div>

                  <div className="space-y-4">
                    {event.waitingList?.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between bg-[#161618] p-4 rounded-lg"
                      >
                        <div>
                          <div className="text-text-primary font-medium">{player.name}</div>
                          <div className="text-sm text-text-secondary">Position: {index + 1}</div>
                        </div>
                        <button
                          onClick={() => removePlayer(player.id)}
                          className="text-status-error hover:text-status-error/70 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        const name = window.prompt('Enter player name:');
                        if (name) {
                          addPlayer(name);
                        }
                      }}
                      className="w-full py-3 bg-dark-surface hover:bg-dark-surface-lighter text-text-primary font-medium rounded-lg transition-colors"
                    >
                      Add Player
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Tables */}
              <div>
                <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] p-6 rounded-xl">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-text-primary">Tables</h2>
                    <p className="text-text-secondary mt-2">Active poker tables and seat assignments</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {event.tables?.map((table) => (
                      <div
                        key={table.id}
                        className="bg-[#161618] p-6 rounded-xl border border-[#2C2C2E]"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-text-primary">{table.number}</h3>
                          <button
                            onClick={() => removeTable(table.id)}
                            className="text-status-error hover:text-status-error/70 transition-colors"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {table.seats.map((seat) => (
                            <div
                              key={seat.id}
                              className="bg-[#1F1F21] p-4 rounded-lg"
                            >
                              <div className="text-sm text-text-secondary mb-1">
                                Seat {seat.position}
                              </div>
                              <div className="text-text-primary">
                                {seat.playerName || 'Empty'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      const name = window.prompt('Enter table name:');
                      if (name) {
                        addTable();
                      }
                    }}
                    className="w-full mt-6 py-3 bg-dark-surface hover:bg-dark-surface-lighter text-text-primary font-medium rounded-lg transition-colors"
                  >
                    Add Table
                  </button>
                </div>
              </div>
            </div>
          )}

          {event.type === 'BASKETBALL' && (
            <div className="grid grid-cols-[400px_1fr] gap-8">
              {/* Left Column - Game Details */}
              <div className="space-y-6">
                {/* Game Details */}
                <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] p-6 rounded-xl">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-text-primary">Game Details</h2>
                    <p className="text-text-secondary mt-2">Current game status and controls</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="text-[64px] font-bold text-white leading-none">
                        {formatTime(event.settings.gameTime ?? 0)}
                      </div>
                      <div className="text-text-secondary mt-2">
                        Period {event.settings.period ?? 1} of {event.settings.totalPeriods ?? 4}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-text-secondary mb-1">Home Score</div>
                        <div className="text-3xl font-bold text-text-primary">
                          {event.settings.homeScore ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-text-secondary mb-1">Away Score</div>
                        <div className="text-3xl font-bold text-text-primary">
                          {event.settings.awayScore ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <button
                        onClick={toggleTimer}
                        className="px-6 py-3 rounded-lg font-medium transition-colors bg-brand-primary text-white hover:bg-brand-primary/90"
                      >
                        Timer Running
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Score Controls */}
              <div>
                <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] p-6 rounded-xl">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-text-primary">Score Controls</h2>
                    <p className="text-text-secondary mt-2">Update game scores</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {/* Home Team */}
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-4">Home Team</h3>
                      <div className="space-y-4">
                        <button
                          onClick={() => updateScore('home', 1)}
                          className="w-full py-3 bg-dark-surface hover:bg-dark-surface-lighter text-text-primary font-medium rounded-lg transition-colors"
                        >
                          +1 Point
                        </button>
                        <button
                          onClick={() => updateScore('home', 2)}
                          className="w-full py-3 bg-dark-surface hover:bg-dark-surface-lighter text-text-primary font-medium rounded-lg transition-colors"
                        >
                          +2 Points
                        </button>
                        <button
                          onClick={() => updateScore('home', 3)}
                          className="w-full py-3 bg-dark-surface hover:bg-dark-surface-lighter text-text-primary font-medium rounded-lg transition-colors"
                        >
                          +3 Points
                        </button>
                        <button
                          onClick={() => updateScore('home', -1)}
                          className="w-full py-3 bg-dark-surface hover:bg-dark-surface-lighter text-status-error font-medium rounded-lg transition-colors"
                        >
                          -1 Point
                        </button>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-4">Away Team</h3>
                      <div className="space-y-4">
                        <button
                          onClick={() => updateScore('away', 1)}
                          className="w-full py-3 bg-dark-surface hover:bg-dark-surface-lighter text-text-primary font-medium rounded-lg transition-colors"
                        >
                          +1 Point
                        </button>
                        <button
                          onClick={() => updateScore('away', 2)}
                          className="w-full py-3 bg-dark-surface hover:bg-dark-surface-lighter text-text-primary font-medium rounded-lg transition-colors"
                        >
                          +2 Points
                        </button>
                        <button
                          onClick={() => updateScore('away', 3)}
                          className="w-full py-3 bg-dark-surface hover:bg-dark-surface-lighter text-text-primary font-medium rounded-lg transition-colors"
                        >
                          +3 Points
                        </button>
                        <button
                          onClick={() => updateScore('away', -1)}
                          className="w-full py-3 bg-dark-surface hover:bg-dark-surface-lighter text-status-error font-medium rounded-lg transition-colors"
                        >
                          -1 Point
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
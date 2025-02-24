'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  name: string;
  type: 'POKER' | 'BASKETBALL' | 'CUSTOM';
  status: 'ACTIVE' | 'ENDED' | 'SCHEDULED';
  settings: {
    timeRemaining?: number;
    currentLevel?: number;
    levels?: { smallBlind: number; bigBlind: number }[];
    gameTime?: number;
    period?: number;
    totalPeriods?: number;
    homeScore?: number;
    awayScore?: number;
  };
  mediaItems: {
    id: string;
    type: 'image' | 'video';
    path: string;
    duration?: number;
  }[];
  tables: {
    id: string;
    name: string;
    seats: {
      id: string;
      position: number;
      playerId?: string;
      playerName?: string;
    }[];
  }[];
  waitingList: {
    id: string;
    name: string;
    position: number;
  }[];
  createdAt: string;
  startedAt: string;
}

export default function ActiveEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        // Filter for both active and scheduled events
        const activeEvents = data.filter((event: Event) => 
          event.status === 'ACTIVE' || event.status === 'SCHEDULED'
        );
        setEvents(activeEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError(error instanceof Error ? error.message : 'Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1D1D1F] pt-8 pl-8">
        <div className="flex-1 border-l border-t bg-[#161618] border-[#2C2C2E] rounded-tl-[32px] p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-text-primary mb-8">Loading events...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1D1D1F] pt-8 pl-8">
        <div className="flex-1 border-l border-t bg-[#161618] border-[#2C2C2E] rounded-tl-[32px] p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-text-primary mb-4">Error</h1>
            <p className="text-text-secondary">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1D1D1F] pt-8 pl-8">
      <div className="flex-1 border-l border-t bg-[#161618] border-[#2C2C2E] rounded-tl-[32px] p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary">Active Events</h1>
            <Link
              href="/events/new"
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
            >
              Create New Event
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 bg-dark-surface/80 backdrop-blur-sm border border-[#2C2C2E] rounded-[24px]">
              <p className="text-text-secondary text-lg mb-4">No active events</p>
              <Link
                href="/events/new"
                className="text-brand-primary hover:text-brand-primary/90 transition-colors"
              >
                Create your first event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="block"
                >
                  <div 
                    onClick={() => router.push(`/events/active/${event.id}`)}
                    className="bg-dark-surface/80 backdrop-blur-sm border border-[#2C2C2E] rounded-[24px] p-6 hover:border-brand-primary/50 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-semibold text-text-primary">{event.name}</h2>
                      <span className="px-2 py-1 text-xs font-medium bg-brand-primary/10 text-brand-primary rounded-full">
                        {event.type}
                      </span>
                    </div>

                    {event.type === 'POKER' && event.settings && (
                      <>
                        <div className="mb-4">
                          <div className="text-sm text-text-secondary mb-1">Current Level</div>
                          <div className="text-2xl font-mono text-text-primary">
                            {formatTime(event.settings.timeRemaining || 0)}
                          </div>
                          <div className="text-sm text-text-secondary mt-1">
                            Level {(event.settings.currentLevel || 0) + 1} of {event.settings.levels?.length || 0}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-text-secondary mb-1">Players</div>
                            <div className="text-lg text-text-primary">
                              {event.waitingList?.length || 0} waiting
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-text-secondary mb-1">Tables</div>
                            <div className="text-lg text-text-primary">
                              {event.tables?.length || 0} active
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {event.type === 'BASKETBALL' && event.settings && (
                      <>
                        <div className="mb-4">
                          <div className="text-sm text-text-secondary mb-1">Game Time</div>
                          <div className="text-2xl font-mono text-text-primary">
                            {formatTime(event.settings.gameTime || 0)}
                          </div>
                          <div className="text-sm text-text-secondary mt-1">
                            Period {event.settings.period || 1} of {event.settings.totalPeriods || 4}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-text-secondary mb-1">Home</div>
                            <div className="text-lg text-text-primary">
                              {event.settings.homeScore || 0}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-text-secondary mb-1">Away</div>
                            <div className="text-lg text-text-primary">
                              {event.settings.awayScore || 0}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="mt-6 pt-4 border-t border-dark-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-tertiary">
                          Started {new Date(event.startedAt).toLocaleTimeString()}
                        </span>
                        <span className="text-brand-primary">Manage →</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
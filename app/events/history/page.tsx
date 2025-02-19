'use client';

import { useState, useEffect } from 'react';
import PastEventCard from '@/app/components/PastEventCard';

interface PastEvent {
  id: string;
  name: string;
  type: string;
  status: string;
  winningTeam?: string;
  gameDetails?: {
    periodLength: number;
    format: string;
    intervals: number;
    mediaCount: number;
  };
}

export default function EventHistory() {
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        const response = await fetch('/api/events?status=ENDED');
        if (!response.ok) throw new Error('Failed to fetch past events');
        
        const events = await response.json();
        setPastEvents(events);
      } catch (error) {
        console.error('Error fetching past events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPastEvents();
  }, []);

  const handleDeleteEvent = (eventId: string) => {
    setPastEvents(events => events.filter(event => event.id !== eventId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#161618] border-l border-t border-[#2C2C2E] rounded-tl-[32px] p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-text-primary mb-8">Event History</h1>
          <div className="text-center text-text-secondary py-12">
            Loading past events...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161618] border-l border-t border-[#2C2C2E] rounded-tl-[32px] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-8">Event History</h1>
        
        {pastEvents.length === 0 ? (
          <div className="text-center text-text-secondary py-12">
            No past events found.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {pastEvents.map((event) => (
              <PastEventCard
                key={event.id}
                id={event.id}
                name={event.name || 'Untitled Event'}
                type={event.type || 'Unknown'}
                status={event.status || 'ENDED'}
                winningTeam={event.winningTeam || 'N/A'}
                gameDetails={event.gameDetails}
                onDelete={handleDeleteEvent}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
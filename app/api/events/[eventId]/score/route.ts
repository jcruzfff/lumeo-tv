import { prisma } from '@/lib/prisma'
import { BasketballTimerState } from '@/app/types'
import { Prisma } from '@prisma/client'

function isBasketballTimerState(settings: unknown): settings is BasketballTimerState {
  const s = settings as BasketballTimerState;
  return s && 
    typeof s.homeScore === 'number' &&
    typeof s.awayScore === 'number' &&
    typeof s.period === 'number' &&
    typeof s.totalPeriods === 'number';
}

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { homeScore, awayScore } = await request.json();
    
    // Validate the event exists and get current settings
    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
    });

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
      });
    }

    // Validate and update settings
    if (!isBasketballTimerState(event.settings)) {
      return new Response(JSON.stringify({ error: 'Invalid event settings' }), {
        status: 400,
      });
    }

    // Update only the scores while preserving other settings
    const updatedSettings: Prisma.JsonObject = {
      ...event.settings as BasketballTimerState,
      homeScore,
      awayScore,
      // Ensure period is within bounds
      period: Math.min(event.settings.period, event.settings.totalPeriods || 4),
      // Default to 4 periods if not specified
      totalPeriods: event.settings.totalPeriods || 4
    };

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: params.eventId },
      data: {
        settings: updatedSettings
      },
    });

    return new Response(JSON.stringify(updatedEvent));
  } catch (error) {
    console.error('Error updating score:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update score' }),
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.eventId }
    });

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404
      });
    }

    if (!isBasketballTimerState(event.settings)) {
      return new Response(JSON.stringify({ error: 'Invalid event settings' }), {
        status: 400
      });
    }

    return new Response(JSON.stringify({
      homeScore: event.settings.homeScore,
      awayScore: event.settings.awayScore
    }));
  } catch (error) {
    console.error('Error fetching score:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch score' }),
      { status: 500 }
    );
  }
} 
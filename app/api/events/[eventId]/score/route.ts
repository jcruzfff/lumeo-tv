import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'
import { BasketballTimerState } from '@/app/types'

function isBasketballTimerState(settings: unknown): settings is BasketballTimerState {
  const s = settings as BasketballTimerState;
  return s && 
    typeof s.homeScore === 'number' &&
    typeof s.awayScore === 'number' &&
    typeof s.period === 'number' &&
    typeof s.totalPeriods === 'number';
}

interface RouteParams {
  params: {
    eventId: string;
  };
}

interface EventSettings {
  timeRemaining?: number;
  currentLevel?: number;
  levels?: { smallBlind: number; bigBlind: number }[];
  gameTime?: number;
  period?: number;
  totalPeriods?: number;
  homeScore?: number;
  awayScore?: number;
  isRunning?: boolean;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;
    const { homeScore, awayScore } = await request.json();

    const event = await prisma.event.findUnique({
      where: {
        id: eventId
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const currentSettings = event.settings as EventSettings;
    const updatedEvent = await prisma.event.update({
      where: {
        id: eventId
      },
      data: {
        settings: {
          ...currentSettings,
          homeScore,
          awayScore
        }
      }
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating score:', error);
    return NextResponse.json(
      { error: 'Failed to update score' },
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
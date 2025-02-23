import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth.config'
import crypto from 'crypto'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export const dynamic = 'force-dynamic'

interface MediaItemInput {
  type: 'video' | 'image'
  path: string
  duration?: number
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()
  console.log(`[${requestId}] Starting event creation process`)

  try {
    // Get session
    const session = await getServerSession(authOptions)
    console.log(`[${requestId}] Session state:`, {
      isAuthenticated: !!session,
      userEmail: session?.user?.email,
      userName: session?.user?.name,
      isAdmin: session?.user?.isAdmin
    })

    if (!session?.user?.email) {
      console.error(`[${requestId}] Event creation failed: No authenticated user`)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    console.log(`[${requestId}] Event creation request:`, {
      name: body.name,
      type: body.type,
      status: body.status,
      mediaItemsCount: body.mediaItems?.length || 0,
      hasRoomManagement: !!body.roomManagement
    })

    // Validate required fields
    const requiredFields = ['name', 'type', 'status', 'settings']
    const missingFields = requiredFields.filter(field => !body[field])
    if (missingFields.length > 0) {
      console.error(`[${requestId}] Event creation failed: Missing fields:`, missingFields)
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(', ')}` }, { status: 400 })
    }

    // Validate event type
    const validTypes = ['POKER', 'BASKETBALL', 'CUSTOM']
    if (!validTypes.includes(body.type)) {
      console.error(`[${requestId}] Invalid event type:`, body.type)
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    // Find or create user
    let eventUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!eventUser) {
      console.log(`[${requestId}] Creating new user for event:`, session.user.email);
      eventUser = await prisma.user.create({
        data: {
          email: session.user.email!,
          name: session.user.name || session.user.email!.split('@')[0],
          isAdmin: session.user.email === ADMIN_EMAIL
        }
      });
      console.log(`[${requestId}] New user created:`, {
        id: eventUser.id,
        email: eventUser.email,
        name: eventUser.name,
        isAdmin: eventUser.isAdmin
      });
    } else {
      console.log(`[${requestId}] Using existing user:`, {
        id: eventUser.id,
        email: eventUser.email,
        name: eventUser.name,
        isAdmin: eventUser.isAdmin
      });
    }

    // Generate unique URLs
    const eventId = crypto.randomUUID()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const displayUrl = `${baseUrl}/display/${eventId}`
    const adminUrl = `${baseUrl}/events/active/${eventId}`

    console.log(`[${requestId}] Generated event URLs:`, { displayUrl, adminUrl })

    // Create event with URLs
    const event = await prisma.event.create({
      data: {
        id: eventId,
        name: body.name,
        type: body.type,
        status: body.status,
        settings: body.settings,
        startedAt: body.startedAt || new Date(),
        mediaItems: {
          create: body.mediaItems?.map((item: MediaItemInput, index: number) => ({
            type: item.type === 'video' ? 'VIDEO' : 'IMAGE',
            url: item.path,
            displayOrder: index + 1,
            duration: item.duration
          })) || []
        },
        displayUrl,
        adminUrl,
        creatorId: eventUser.id
      },
      include: {
        mediaItems: true
      }
    })

    console.log(`[${requestId}] Event created successfully:`, {
      id: event.id,
      name: event.name,
      type: event.type,
      creatorId: event.creatorId,
      mediaItemsCount: event.mediaItems.length
    })

    return NextResponse.json(event)

  } catch (error) {
    console.error(`[${requestId}] Event creation failed:`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create event' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        mediaItems: true,
        tables: true,
        waitingList: {
          orderBy: {
            position: 'asc'
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
} 
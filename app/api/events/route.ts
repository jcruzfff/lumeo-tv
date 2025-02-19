import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/app/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth.config'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  console.log('POST request received to create new event')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('Session state:', session)

    const body = await req.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { name, type, settings } = body

    if (!name || !type || !settings) {
      console.log('Missing required fields:', { name, type, settings })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate event type
    if (!['POKER', 'BASKETBALL', 'CUSTOM'].includes(type)) {
      console.log('Invalid event type:', type)
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      )
    }

    // Find an admin user to associate with the event
    const adminUser = await prisma.user.findFirst({
      where: {
        isAdmin: true
      }
    });

    console.log('Found admin user:', adminUser)

    try {
      // Create event with admin user if available
      const event = await prisma.event.create({
        data: {
          name,
          type: type as 'POKER' | 'BASKETBALL' | 'CUSTOM',
          settings,
          status: 'ACTIVE' as const,
          startedAt: new Date(),
          creator: adminUser ? {
            connect: {
              id: adminUser.id
            }
          } : {
            create: {
              email: 'zoltarsdad@gmail.com',
              name: 'Default Admin',
              password: 'default',
              isAdmin: true
            }
          }
        },
        include: {
          mediaItems: true,
          tables: true,
          waitingList: true,
        },
      })

      console.log('Event created successfully:', event)
      return NextResponse.json(event)
    } catch (error) {
      console.error('Error creating event in Prisma:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { error: 'Database error creating event', details: errorMessage },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/events:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Error creating event', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  console.log('GET request received to fetch all events')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('Session state:', session ? 'Authenticated' : 'Unauthenticated')

    if (!session) {
      console.log('Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const events = await prisma.event.findMany({
      include: {
        mediaItems: true,
        tables: true,
        waitingList: true,
        creator: true
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log('Successfully fetched', events.length, 'events')
    return NextResponse.json(events)
  } catch (error) {
    console.error('Error in GET /api/events:', error)
    return NextResponse.json(
      { error: 'Error fetching events' },
      { status: 500 }
    )
  }
} 
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch notifications for a user (or all if userId is null)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { id: token } })
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    // Get notifications for this user + global notifications (userId is null)
    const notifications = await db.notification.findMany({
      where: {
        OR: [
          { userId: token },
          { userId: null }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const unreadCount = notifications.filter(n => !n.read).length

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create notification (admin only)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { id: token } })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { title, message, sendToAll, userId: targetUserId } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    if (sendToAll) {
      // Create a global notification (userId = null means for everyone)
      await db.notification.create({
        data: { title, message, userId: null }
      })
    } else if (targetUserId) {
      // Create notification for specific user
      await db.notification.create({
        data: { title, message, userId: targetUserId }
      })
    } else {
      // Default: send to all
      await db.notification.create({
        data: { title, message, userId: null }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notifications POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Mark notification(s) as read
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { id: token } })
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await req.json()
    const { markAllRead, notificationId } = body

    if (markAllRead) {
      // Mark all notifications as read for this user
      await db.notification.updateMany({
        where: {
          OR: [{ userId: token }, { userId: null }],
          read: false
        },
        data: { read: true }
      })
      return NextResponse.json({ success: true })
    }

    if (notificationId) {
      await db.notification.update({
        where: { id: notificationId },
        data: { read: true }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Notifications PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a notification
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { id: token } })
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })

    await db.notification.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notifications DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

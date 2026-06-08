import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const notes = await db.note.findMany({
      where: { userId: token },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }]
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Notes GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, content, color, pinned } = body

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const note = await db.note.create({
      data: { title, content: content || '', color: color || '#ffffff', pinned: pinned || false, userId: token }
    })

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Notes POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, title, content, color, pinned } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const note = await db.note.update({
      where: { id, userId: token },
      data: { title, content, color, pinned }
    })

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Notes PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    await db.note.delete({ where: { id, userId: token } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notes DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

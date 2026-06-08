import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const plans = await db.plan.findMany({
      where: { userId: token },
      orderBy: [{ completed: 'asc' }, { date: 'asc' }]
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Plans GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, description, date, time, priority } = body

    if (!title || !date) return NextResponse.json({ error: 'Title and date are required' }, { status: 400 })

    const plan = await db.plan.create({
      data: { title, description, date, time, priority: priority || 'medium', userId: token }
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Plans POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, title, description, date, time, priority, completed } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const plan = await db.plan.update({
      where: { id, userId: token },
      data: { title, description, date, time, priority, completed }
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Plans PUT error:', error)
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

    await db.plan.delete({ where: { id, userId: token } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Plans DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const alarms = await db.alarm.findMany({
      where: { userId: token },
      orderBy: { time: 'asc' }
    })

    return NextResponse.json({ alarms })
  } catch (error) {
    console.error('Alarms GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, time, date, repeat } = body

    if (!title || !time) return NextResponse.json({ error: 'Title and time are required' }, { status: 400 })

    const alarm = await db.alarm.create({
      data: { title, time, date, repeat: repeat || 'once', userId: token }
    })

    return NextResponse.json({ alarm })
  } catch (error) {
    console.error('Alarms POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, title, time, date, repeat, active } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const alarm = await db.alarm.update({
      where: { id, userId: token },
      data: { title, time, date, repeat, active }
    })

    return NextResponse.json({ alarm })
  } catch (error) {
    console.error('Alarms PUT error:', error)
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

    await db.alarm.delete({ where: { id, userId: token } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Alarms DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

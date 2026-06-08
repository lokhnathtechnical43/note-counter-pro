import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { userId: token }
    if (status) where.status = status

    const payables = await db.payable.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    const total = payables.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({ payables, total })
  } catch (error) {
    console.error('Payables GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, amount, toPerson, dueDate, note } = body

    if (!title || !amount || !toPerson) {
      return NextResponse.json({ error: 'Title, amount and toPerson are required' }, { status: 400 })
    }

    const payable = await db.payable.create({
      data: { title, amount: parseFloat(amount), toPerson, dueDate, note, userId: token }
    })

    return NextResponse.json({ payable })
  } catch (error) {
    console.error('Payables POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, title, amount, toPerson, dueDate, status, note } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const payable = await db.payable.update({
      where: { id, userId: token },
      data: { title, amount: amount ? parseFloat(amount) : undefined, toPerson, dueDate, status, note }
    })

    return NextResponse.json({ payable })
  } catch (error) {
    console.error('Payables PUT error:', error)
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

    await db.payable.delete({ where: { id, userId: token } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payables DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const receivables = await db.receivable.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    const total = receivables.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0)

    return NextResponse.json({ receivables, total })
  } catch (error) {
    console.error('Receivables GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, amount, fromPerson, dueDate, note } = body

    if (!title || !amount || !fromPerson) {
      return NextResponse.json({ error: 'Title, amount and fromPerson are required' }, { status: 400 })
    }

    const receivable = await db.receivable.create({
      data: { title, amount: parseFloat(amount), fromPerson, dueDate, note, userId: token }
    })

    return NextResponse.json({ receivable })
  } catch (error) {
    console.error('Receivables POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, title, amount, fromPerson, dueDate, status, note } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const receivable = await db.receivable.update({
      where: { id, userId: token },
      data: { title, amount: amount ? parseFloat(amount) : undefined, fromPerson, dueDate, status, note }
    })

    return NextResponse.json({ receivable })
  } catch (error) {
    console.error('Receivables PUT error:', error)
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

    await db.receivable.delete({ where: { id, userId: token } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Receivables DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

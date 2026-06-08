import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const month = searchParams.get('month')

    const where: Record<string, unknown> = { userId: token }
    if (category) where.category = category
    if (month) where.date = { startsWith: month }

    const expenses = await db.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    })

    const total = expenses.reduce((sum, e) => sum + e.amount, 0)

    return NextResponse.json({ expenses, total })
  } catch (error) {
    console.error('Expenses GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, amount, category, date, note } = body

    if (!title || !amount || !category || !date) {
      return NextResponse.json({ error: 'Title, amount, category and date are required' }, { status: 400 })
    }

    const expense = await db.expense.create({
      data: { title, amount: parseFloat(amount), category, date, note, userId: token }
    })

    return NextResponse.json({ expense })
  } catch (error) {
    console.error('Expenses POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, title, amount, category, date, note } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const expense = await db.expense.update({
      where: { id, userId: token },
      data: { title, amount: amount ? parseFloat(amount) : undefined, category, date, note }
    })

    return NextResponse.json({ expense })
  } catch (error) {
    console.error('Expenses PUT error:', error)
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

    await db.expense.delete({ where: { id, userId: token } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Expenses DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

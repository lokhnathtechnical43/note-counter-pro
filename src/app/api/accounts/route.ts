import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accounts = await db.account.findMany({
      where: { userId: token },
      orderBy: { createdAt: 'desc' }
    })

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

    return NextResponse.json({ accounts, totalBalance })
  } catch (error) {
    console.error('Accounts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, type, balance, note } = body

    if (!name || !type || balance === undefined) {
      return NextResponse.json({ error: 'Name, type and balance are required' }, { status: 400 })
    }

    const account = await db.account.create({
      data: { name, type, balance: parseFloat(balance), note, userId: token }
    })

    return NextResponse.json({ account })
  } catch (error) {
    console.error('Accounts POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, name, type, balance, note } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const account = await db.account.update({
      where: { id, userId: token },
      data: { name, type, balance: balance !== undefined ? parseFloat(balance) : undefined, note }
    })

    return NextResponse.json({ account })
  } catch (error) {
    console.error('Accounts PUT error:', error)
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

    await db.account.delete({ where: { id, userId: token } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Accounts DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

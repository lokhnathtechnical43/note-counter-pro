import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const loans = await db.loan.findMany({
      where: { userId: token },
      orderBy: { createdAt: 'desc' }
    })

    const totalRemaining = loans.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0)

    return NextResponse.json({ loans, totalRemaining })
  } catch (error) {
    console.error('Loans GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, totalAmount, emiAmount, interestRate, tenure, startDate, endDate, note } = body

    if (!title || !totalAmount || !startDate) {
      return NextResponse.json({ error: 'Title, totalAmount and startDate are required' }, { status: 400 })
    }

    const loan = await db.loan.create({
      data: {
        title, totalAmount: parseFloat(totalAmount),
        emiAmount: emiAmount ? parseFloat(emiAmount) : null,
        interestRate: interestRate ? parseFloat(interestRate) : null,
        tenure: tenure ? parseInt(tenure) : null,
        startDate, endDate, note, userId: token
      }
    })

    return NextResponse.json({ loan })
  } catch (error) {
    console.error('Loans POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, title, totalAmount, paidAmount, emiAmount, interestRate, tenure, startDate, endDate, status, note } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const loan = await db.loan.update({
      where: { id, userId: token },
      data: {
        title, totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
        paidAmount: paidAmount !== undefined ? parseFloat(paidAmount) : undefined,
        emiAmount: emiAmount !== undefined ? parseFloat(emiAmount) : undefined,
        interestRate: interestRate !== undefined ? parseFloat(interestRate) : undefined,
        tenure: tenure !== undefined ? parseInt(tenure) : undefined,
        startDate, endDate, status, note
      }
    })

    return NextResponse.json({ loan })
  } catch (error) {
    console.error('Loans PUT error:', error)
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

    await db.loan.delete({ where: { id, userId: token } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Loans DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

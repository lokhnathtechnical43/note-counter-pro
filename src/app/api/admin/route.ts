import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if admin
    const user = await db.user.findUnique({ where: { id: token } })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      const [users, expenses, receivables, payables, loans, notes, documents] = await Promise.all([
        db.user.count(),
        db.expense.count(),
        db.receivable.count(),
        db.payable.count(),
        db.loan.count(),
        db.note.count(),
        db.document.count(),
      ])

      const totalExpenses = await db.expense.aggregate({ _sum: { amount: true } })

      return NextResponse.json({
        stats: {
          users, expenses, receivables, payables, loans, notes, documents,
          totalExpenses: totalExpenses._sum.amount || 0
        }
      })
    }

    if (action === 'users') {
      const users = await db.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ users })
    }

    if (action === 'userDetail') {
      const userId = searchParams.get('userId')
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

      const [expenses, receivables, payables, loans, notes] = await Promise.all([
        db.expense.findMany({ where: { userId } }),
        db.receivable.findMany({ where: { userId } }),
        db.payable.findMany({ where: { userId } }),
        db.loan.findMany({ where: { userId } }),
        db.note.findMany({ where: { userId } }),
      ])

      return NextResponse.json({ expenses, receivables, payables, loans, notes })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { id: token } })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { action, userId, role } = body

    if (action === 'updateRole') {
      if (!userId || !role) return NextResponse.json({ error: 'userId and role required' }, { status: 400 })
      const updated = await db.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, email: true, name: true, role: true }
      })
      return NextResponse.json({ user: updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Admin PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { id: token } })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    if (userId === token) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

    // Delete all user data
    await Promise.all([
      db.expense.deleteMany({ where: { userId } }),
      db.receivable.deleteMany({ where: { userId } }),
      db.payable.deleteMany({ where: { userId } }),
      db.loan.deleteMany({ where: { userId } }),
      db.account.deleteMany({ where: { userId } }),
      db.note.deleteMany({ where: { userId } }),
      db.plan.deleteMany({ where: { userId } }),
      db.document.deleteMany({ where: { userId } }),
      db.alarm.deleteMany({ where: { userId } }),
    ])

    await db.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

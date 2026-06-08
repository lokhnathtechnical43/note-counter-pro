import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const where: Record<string, unknown> = { userId: token }
    if (category) where.category = category

    const documents = await db.document.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Documents GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, type, size, data, category } = body

    if (!name || !type || !data) {
      return NextResponse.json({ error: 'Name, type and data are required' }, { status: 400 })
    }

    const document = await db.document.create({
      data: { name, type, size: size || 0, data, category: category || 'general', userId: token }
    })

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Documents POST error:', error)
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

    await db.document.delete({ where: { id, userId: token } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Documents DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

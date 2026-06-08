import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// POST - Login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, email, password, name } = body

    if (action === 'register') {
      if (!email || !password || !name) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }

      const existing = await db.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password, 12)
      const user = await db.user.create({
        data: { email, name, password: hashedPassword }
      })

      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json({ user: userWithoutPassword, token: user.id })
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
      }

      const user = await db.user.findUnique({ where: { email } })
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      const valid = await bcrypt.compare(password, user.password)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json({ user: userWithoutPassword, token: user.id })
    }

    if (action === 'forgot') {
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }

      const user = await db.user.findUnique({ where: { email } })
      if (!user) {
        return NextResponse.json({ error: 'Email not found' }, { status: 404 })
      }

      // In a real app, send reset email. Here we just confirm.
      return NextResponse.json({ message: 'Password reset instructions sent' })
    }

    if (action === 'verify') {
      const authHeader = req.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const user = await db.user.findUnique({ where: { id: token } })
      if (!user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }

      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json({ user: userWithoutPassword })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update profile / Reset password
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, name, oldPassword, newPassword } = body

    const user = await db.user.findUnique({ where: { id: token } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (action === 'updateProfile') {
      const updated = await db.user.update({
        where: { id: token },
        data: { name: name || user.name }
      })
      const { password: _, ...userWithoutPassword } = updated
      return NextResponse.json({ user: userWithoutPassword })
    }

    if (action === 'resetPassword') {
      if (!oldPassword || !newPassword) {
        return NextResponse.json({ error: 'Old and new password required' }, { status: 400 })
      }
      const valid = await bcrypt.compare(oldPassword, user.password)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid old password' }, { status: 401 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
      }
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      await db.user.update({
        where: { id: token },
        data: { password: hashedPassword }
      })
      return NextResponse.json({ message: 'Password updated successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

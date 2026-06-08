import { NextRequest, NextResponse } from 'next/server'

// POST - PDF tools endpoint
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const action = formData.get('action') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (action === 'pdf-to-jpeg' || action === 'pdf-info') {
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString('base64')
      return NextResponse.json({
        pdfBase64: base64,
        fileName: file.name,
        size: file.size
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('PDF tools error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

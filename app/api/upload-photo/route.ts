import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/spaces'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const id = formData.get('id') as string
    const type = formData.get('type') as string // 'staf' or 'pelajar'

    if (!file || !id || !type) {
      return NextResponse.json(
        { error: 'Maklumat tidak lengkap' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Build filename — staf/{id}.jpg or pelajar/{id}.jpg
    const fileName = `${type}/${id}.jpg`

    const url = await uploadFile(buffer, fileName, file.type)

    return NextResponse.json({ success: true, url })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: 'Gagal memuat naik gambar' },
      { status: 500 }
    )
  }
}
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import fs from 'fs'
import path from 'path'
import LaporanPDF from '@/app/components/LaporanPDF'

export async function generateLaporanBuffer(data: any) {
  // Use Spaces URL instead of local file
  const logoSrc = process.env.NODE_ENV === 'production'
    ? `${process.env.DO_SPACES_CDN_URL}/lencana.jpg`
    : (() => {
        const fs = require('fs')
        const path = require('path')
        const logoPath = path.join(process.cwd(), 'public', 'lencana.jpg')
        const logoBase64 = fs.readFileSync(logoPath).toString('base64')
        return `data:image/jpeg;base64,${logoBase64}`
      })()

  const buffer = await renderToBuffer(
    createElement(LaporanPDF, { ...data, logoSrc } ) as any
  )

  return buffer
}
 
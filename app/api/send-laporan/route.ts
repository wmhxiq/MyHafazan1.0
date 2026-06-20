import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import LaporanPDF from '@/app/components/LaporanPDF'
import { generateLaporanBuffer } from '@/lib/getPdfBuffer'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      emelWaris,
      namaMurid,
      noKP,
      kelas,
      namaGuru,
      bulan,
      tahun,
      juzukSemasa,
      sasaranJuzuk,
      hafazanTerkini,
      totalPagesInJuzuk,
      totalMBMuka,
      totalMLMuka,
      statusHafazan,
      ulasanGuru,
      rekodList,
    } = body

    // 1. Generate PDF buffer
const pdfBuffer = await generateLaporanBuffer({
  namaMurid,
  noKP,
  kelas,
  namaGuru,
  bulan,
  tahun,
  juzukSemasa,
  sasaranJuzuk,
  hafazanTerkini,
  totalPagesInJuzuk,
  totalMBMuka,
  totalMLMuka,
  statusHafazan,
  ulasanGuru,
  rekodList,
})
    

    // 2. Send email with PDF attachment
    const { data, error } = await resend.emails.send({
      from: 'MyHafazan <noreply@myhafazan.tech>', // current domain
      to: [emelWaris],
      subject: `Laporan Hafazan Bulanan - ${namaMurid} (${bulan} ${tahun})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e3a5f; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">MyHafazan</h1>
            <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 12px;">SMK Agama Bangi</p>
          </div>

          <div style="padding: 24px; background-color: #f9fafb;">
            <p style="color: #374151; font-size: 14px;">Assalamualaikum Wbt,</p>
            <p style="color: #374151; font-size: 14px;">
              Berikut adalah laporan kemajuan hafazan bulanan bagi:
            </p>

            <div style="background-color: white; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #e5e7eb;">
              <table style="width: 100%; font-size: 13px; color: #374151;">
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; width: 140px;">Nama Murid</td>
                  <td style="padding: 4px 0;">: ${namaMurid}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Kelas</td>
                  <td style="padding: 4px 0;">: ${kelas}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Guru Halaqah</td>
                  <td style="padding: 4px 0;">: ${namaGuru}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Bulan Laporan</td>
                  <td style="padding: 4px 0;">: ${bulan} ${tahun}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Status Hafazan</td>
                  <td style="padding: 4px 0;">: ${statusHafazan}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #eff6ff; border-left: 4px solid #1e3a5f; padding: 12px 16px; margin: 16px 0; border-radius: 0 4px 4px 0;">
              <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1e3a5f;">
                Ulasan Guru Halaqah:
              </p>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #374151;">
                ${ulasanGuru || 'Tiada ulasan untuk bulan ini'}
              </p>
            </div>

            <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">
              Sila rujuk lampiran PDF untuk laporan lengkap termasuk rekod harian hafazan.
            </p>

            <p style="color: #374151; font-size: 14px; margin-top: 16px;">
              Wassalamualaikum,<br/>
              <strong>${namaGuru}</strong><br/>
              <span style="color: #6b7280; font-size: 12px;">Guru Halaqah, SMK Agama Bangi</span>
            </p>
          </div>

          <div style="background-color: #1e3a5f; padding: 12px; text-align: center;">
            <p style="color: #93c5fd; margin: 0; font-size: 11px;">
              © ${tahun} MyHafazan — SMK Agama Bangi
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Laporan_${namaMurid}_${bulan}_${tahun}.pdf`,
          content: pdfBuffer,
        },
      ],
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Gagal menghantar email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: 'Ralat sistem' },
      { status: 500 }
    )
  }
}
// lib/exportExcel.ts
import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  transform?: (value: any) => any;
  isText?: boolean; // Add this flag for text-formatted columns
}

export interface ExportConfig {
  fileName: string;
  sheetName: string;
  columns: ExportColumn[];
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  config: ExportConfig
) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return false;
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Transform data based on column configuration
  const exportData = data.map((item, index) => {
    const row: Record<string, any> = {};
    
    config.columns.forEach((col) => {
      // Handle 'bil' (row number) specially
      if (col.key === 'bil') {
        row[col.header] = index + 1;
      } else {
        // Get value using key path (supports nested keys like 'user.name')
        const value = getNestedValue(item, col.key);
        let finalValue = col.transform ? col.transform(value) : (value ?? '');
        
        // Format as text if specified (important for phone numbers, IDs, etc.)
        if (col.isText && finalValue !== '') {
          // Use cell object to set format as text
          row[col.header] = { t: 's', v: String(finalValue) };
        } else {
          row[col.header] = finalValue;
        }
      }
    });
    
    return row;
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  ws['!cols'] = config.columns.map(col => ({
    wch: col.width || 15,
    ...(col.isText && { z: '@' }) // '@' format means text in Excel
  }));

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, config.sheetName);

  // Generate filename with date
  const today = new Date().toISOString().split('T')[0];
  const fileName = `${config.fileName}_${today}.xlsx`;

  // Download file
  XLSX.writeFile(wb, fileName);
  return true;
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current ? current[key] : undefined;
  }, obj);
}

// Pre-defined column configurations for different pages
export const ExportConfigs = {
  // Staf export configuration
  staf: {
    fileName: 'Senarai_Staf',
    sheetName: 'Staf',
    columns: [
      { header: 'Bil', key: 'bil', width: 5 },
      { header: 'Nama', key: 'NamaGuru', width: 30 },
      { header: 'No. KP', key: 'IDGuru', width: 15, isText: true  },
      { header: 'Peranan', key: 'Peranan', width: 15 },
      { header: 'Bil. Ahli Halaqah', key: 'bil_halaqah', width: 15 },
      { header: 'No. Telefon', key: 'NoTel', width: 15, isText: true  },
      { header: 'Alamat', key: 'AlamatGuru', width: 40 },
    ],
  } as ExportConfig,

  // Example: Pelajar export configuration
  pelajar: {
    fileName: 'Senarai_Pelajar',
    sheetName: 'Pelajar',
    columns: [
      { header: 'Bil', key: 'bil', width: 5 },
      { header: 'Nama Pelajar', key: 'NamaPelajar', width: 30 },
      { header: 'No. KP', key: 'IDPelajar', width: 15, isText: true  },
      { header: 'Kelas', key: 'Kelas', width: 10 },
      { header: 'Guru Halaqah', key: 'NamaGuru', width: 30 },
      { header: 'Nama Waris', key: 'NamaWaris', width: 25 },
      { header: 'No. Tel Waris', key: 'NoTelWaris', width: 15, isText: true },
      { header: 'Emel Waris', key: 'EmelWaris', width: 25 },
      { header: 'Alamat', key: 'Alamat', width: 40 },
    ],
  } as ExportConfig,

  // Example: Halaqah export configuration
  halaqah: {
    fileName: 'Senarai_Halaqah',
    sheetName: 'Halaqah',
    columns: [
      { header: 'Bil', key: 'bil', width: 5 },
      { header: 'Nama Halaqah', key: 'NamaHalaqah', width: 25 },
      { header: 'Nama Guru', key: 'NamaGuru', width: 30 },
      { header: 'Bil. Pelajar', key: 'bil_pelajar', width: 12 },
      { header: 'Masa', key: 'Masa', width: 15 },
      { header: 'Hari', key: 'Hari', width: 15 },
      { header: 'Lokasi', key: 'Lokasi', width: 30 },
    ],
  } as ExportConfig,

  // Example: Laporan/Report export configuration
  laporan: {
    fileName: 'Laporan',
    sheetName: 'Laporan',
    columns: [
      { header: 'Bil', key: 'bil', width: 5 },
      { header: 'Tarikh', key: 'Tarikh', width: 15 },
      { header: 'Nama Pelajar', key: 'NamaPelajar', width: 30 },
      { header: 'Juzuk', key: 'Juzuk', width: 10 },
      { header: 'Halaman', key: 'Halaman', width: 10 },
      { header: 'Pencapaian', key: 'Pencapaian', width: 20 },
      { header: 'Catatan', key: 'Catatan', width: 30 },
    ],
  } as ExportConfig,
};
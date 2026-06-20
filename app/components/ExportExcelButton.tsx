// app/components/ExportExcelButton.tsx
"use client";

import { useState } from "react";
import { exportToExcel, type ExportConfig } from "@/lib/exportExcel";
import { IconExcel } from "./icons";

interface ExportExcelButtonProps {
  data: any[];
  config: ExportConfig;
  disabled?: boolean;
  className?: string;
  onExport?: () => void;
  onError?: (error: string) => void;
}

export default function ExportExcelButton({
  data,
  config,
  disabled = false,
  className = "excel-export-btn",
  onExport,
  onError,
}: ExportExcelButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (data.length === 0) {
      const message = "Tiada data untuk dieksport";
      onError ? onError(message) : alert(message);
      return;
    }

    setExporting(true);

    // Small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const success = exportToExcel(data, config);
      if (success && onExport) {
        onExport();
      }
    } catch (error) {
      const message = "Gagal mengeksport data";
      onError ? onError(message) : alert(message);
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      className={className}
      disabled={disabled || exporting}
      title={`Eksport ke Excel - ${config.sheetName}`}
    >
      {exporting ? (
        <>
          <div className="spinner-small" />
          <span>Menjana...</span>
        </>
      ) : (
        <>
          <IconExcel />
          <span>Eksport Excel</span>
        </>
      )}
    </button>
  );
}

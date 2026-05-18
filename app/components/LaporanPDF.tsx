import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts for proper Malay character support
Font.register({
  family: "Helvetica",
  fonts: [],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 35,
    backgroundColor: "#ffffff",
  },

  // ─── HEADER ───────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: "column",
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  logo: {
    width: 50,
    height: 50,
  },
  schoolInfo: {
    flexDirection: "column",
    justifyContent: "center",
  },
  schoolName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  schoolAddress: {
    fontSize: 8,
    color: "#444444",
    lineHeight: 1.4,
  },

  // ─── MONTH ────────────────────────────────
  monthText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    marginBottom: 10,
  },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginBottom: 8,
  },

  // ─── STUDENT INFO ─────────────────────────
  infoGrid: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLeft: {
    flex: 1,
    flexDirection: "column",
    gap: 3,
  },
  infoRight: {
    flex: 1,
    flexDirection: "column",
    gap: 3,
  },
  infoRow: {
    flexDirection: "row",
  },
  infoLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    width: 110,
  },
  infoValue: {
    fontSize: 9,
    flex: 1,
  },

  // ─── PROGRESS STATS ───────────────────────
  statsRow: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
    paddingVertical: 8,
  },
  statBox: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    paddingHorizontal: 4,
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: "#cccccc",
  },
  statLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#444444",
    marginBottom: 3,
  },
  statValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
  },

  // ─── STATUS & ULASAN ──────────────────────
  statusUlasanSection: {
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  statusLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    width: 110,
  },
  statusBadge: {
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  statusMencapai: {
    backgroundColor: "#fef9c3",
    color: "#854d0e",
  },
  statusMelebihi: {
    backgroundColor: "#dcfce7",
    color: "#14532d",
  },
  statusBelum: {
    backgroundColor: "#fee2e2",
    color: "#7f1d1d",
  },
  statusBelumDinilai: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
  },
  ulasanLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginBottom: 3,
  },
  ulasanBox: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 3,
    padding: 8,
    minHeight: 40,
    backgroundColor: "#f9fafb",
  },
  ulasanText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#374151",
  },

  // ─── TABLE ────────────────────────────────
  tableTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginTop: 10,
    marginBottom: 6,
  },
  table: {
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    padding: 6,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  tableCell: {
    fontSize: 8,
    padding: 6,
    textAlign: "center",
    color: "#374151",
  },

  // Column widths
  colTarikh: { width: "12%" },
  colJenis: { width: "14%" },
  colMula: { width: "10%" },
  colTamat: { width: "10%" },
  colSurah: { width: "28%" },
  colJuzuk: { width: "10%" },
  colUlasan: { width: "16%" },

  // ─── FOOTER ───────────────────────────────
  footer: {
    position: "absolute",
    bottom: 20,
    left: 35,
    right: 35,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  signatureBox: {
    flex: 1,
    alignItems: "center",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    width: "80%",
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#444444",
    textAlign: "center",
  },
  pageNumber: {
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
  },
});

// Types
type RekodRow = {
  RekodID: number;
  Tarikh: string;
  HBmula: number;
  HBakhir: number;
  MBmula: number;
  MBakhir: number;
  MLmula: number;
  MLakhir: number;
  Pencapaian: string;
  NamaSurahHB?: string;
  JuzukHB?: number;
  NamaSurahMB?: string;
  JuzukMB?: number;
  NamaSurahML?: string;
  JuzukML?: number;
};

type LaporanPDFProps = {
  namaMurid: string;
  noKP: string;
  kelas: string;
  namaGuru: string;
  bulan: string;
  tahun: number;
  juzukSemasa: number;
  sasaranJuzuk: number;
  hafazanTerkini: number;
  totalPagesInJuzuk: number;
  totalMBMuka: number;
  totalMLMuka: number;
  statusHafazan: string;
  ulasanGuru: string;
  rekodList: RekodRow[];
};

const MONTH_OPTIONS = [
  "Januari",
  "Februari",
  "Mac",
  "April",
  "Mei",
  "Jun",
  "Julai",
  "Ogos",
  "September",
  "Oktober",
  "November",
  "Disember",
];

function formatTarikh(tarikh: string) {
  return new Date(tarikh).toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getStatusStyle(status: string) {
  switch (status) {
    case "Mencapai Sukatan":
      return styles.statusMencapai;
    case "Melebihi Sukatan":
      return styles.statusMelebihi;
    case "Belum Mencapai Sukatan":
      return styles.statusBelum;
    default:
      return styles.statusBelumDinilai;
  }
}

export default function LaporanPDF({
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
}: LaporanPDFProps) {
  // Build flat rows for table
  const tableRows: {
    tarikh: string;
    jenis: string;
    mula: number;
    tamat: number;
    surah: string;
    juzuk: number;
    ulasan: string;
  }[] = [];

  rekodList.forEach((r) => {
    if (r.HBmula > 0) {
      tableRows.push({
        tarikh: formatTarikh(r.Tarikh),
        jenis: "Hafazan",
        mula: r.HBmula,
        tamat: r.HBakhir,
        surah: r.NamaSurahHB || "-",
        juzuk: r.JuzukHB || 0,
        ulasan: r.Pencapaian,
      });
    }
    if (r.MBmula > 0) {
      tableRows.push({
        tarikh: formatTarikh(r.Tarikh),
        jenis: "Murajaah Baru",
        mula: r.MBmula,
        tamat: r.MBakhir,
        surah: r.NamaSurahMB || "-",
        juzuk: r.JuzukMB || 0,
        ulasan: r.Pencapaian,
      });
    }
    if (r.MLmula > 0) {
      tableRows.push({
        tarikh: formatTarikh(r.Tarikh),
        jenis: "Murajaah Lama",
        mula: r.MLmula,
        tamat: r.MLakhir,
        surah: r.NamaSurahML || "-",
        juzuk: r.JuzukML || 0,
        ulasan: r.Pencapaian,
      });
    }
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>
              LAPORAN KEMAJUAN{"\n"}BULANAN MURID
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Image
              style={styles.logo}
              src={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/lencana.jpg`}
            />
            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName}>SMK AGAMA BANGI</Text>
              <Text style={styles.schoolAddress}>
                JALAN CENDEKIAWAN,{"\n"}
                43600 BANGI SELANGOR{"\n"}
                ILMU PENYULUH HIDUP
              </Text>
            </View>
          </View>
        </View>

        {/* ── MONTH ── */}
        <Text style={styles.monthText}>
          {bulan.toUpperCase()} {tahun}
        </Text>
        <View style={styles.divider} />

        {/* ── STUDENT INFO ── */}
        <View style={styles.infoGrid}>
          <View style={styles.infoLeft}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Murid :</Text>
              <Text style={styles.infoValue}>{namaMurid}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>No. Kad Pengenalan :</Text>
              <Text style={styles.infoValue}>{noKP}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kelas :</Text>
              <Text style={styles.infoValue}>{kelas}</Text>
            </View>
          </View>
          <View style={styles.infoRight}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Guru Halaqah :</Text>
              <Text style={styles.infoValue}>{namaGuru}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Juzuk Semasa :</Text>
              <Text style={styles.infoValue}>{juzukSemasa}</Text>
            </View>
          </View>
        </View>

        {/* ── PROGRESS STATS ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statLabel}>Juzuk Dihafaz :</Text>
            <Text style={styles.statValue}>
              {juzukSemasa} / {sasaranJuzuk}
            </Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statLabel}>Hafazan Terkini :</Text>
            <Text style={styles.statValue}>
              {hafazanTerkini} / {totalPagesInJuzuk}
            </Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statLabel}>Murajaah Baru Terkini :</Text>
            <Text style={styles.statValue}>
              {totalMBMuka} / {totalPagesInJuzuk}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Murajaah Lama Terkini :</Text>
            <Text style={styles.statValue}>
              {totalMLMuka} / {totalPagesInJuzuk}
            </Text>
          </View>
        </View>

        {/* ── STATUS & ULASAN ── */}
        <View style={styles.statusUlasanSection}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status Hafazan :</Text>
            <Text style={[styles.statusBadge, getStatusStyle(statusHafazan)]}>
              {statusHafazan}
            </Text>
          </View>
          <Text style={styles.ulasanLabel}>Ulasan Bulanan Guru :</Text>
          <View style={styles.ulasanBox}>
            <Text style={styles.ulasanText}>
              {ulasanGuru || "Tiada ulasan untuk bulan ini"}
            </Text>
          </View>
        </View>

        {/* ── REKOD HARIAN TABLE ── */}
        <Text style={styles.tableTitle}>Rekod Harian :</Text>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colTarikh]}>
              Tarikh
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colJenis]}>
              Jenis Bacaan
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colMula]}>
              M/Surat Mula
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colTamat]}>
              M/Surat Tamat
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colSurah]}>Surah</Text>
            <Text style={[styles.tableHeaderCell, styles.colJuzuk]}>Juzuk</Text>
            <Text style={[styles.tableHeaderCell, styles.colUlasan]}>
              Ulasan Guru
            </Text>
          </View>

          {/* Table Rows */}
          {tableRows.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                Tiada rekod untuk bulan ini
              </Text>
            </View>
          ) : (
            tableRows.map((row, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 !== 0 ? styles.tableRowAlt : {},
                ]}
              >
                <Text style={[styles.tableCell, styles.colTarikh]}>
                  {row.tarikh}
                </Text>
                <Text style={[styles.tableCell, styles.colJenis]}>
                  {row.jenis}
                </Text>
                <Text style={[styles.tableCell, styles.colMula]}>
                  {row.mula}
                </Text>
                <Text style={[styles.tableCell, styles.colTamat]}>
                  {row.tamat}
                </Text>
                <Text style={[styles.tableCell, styles.colSurah]}>
                  {row.surah}
                </Text>
                <Text style={[styles.tableCell, styles.colJuzuk]}>
                  {row.juzuk}
                </Text>
                <Text style={[styles.tableCell, styles.colUlasan]}>
                  {row.ulasan}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* ── SIGNATURE ── */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Tandatangan Guru Halaqah</Text>
            <Text style={styles.signatureLabel}>( {namaGuru} )</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              Tandatangan Ibu Bapa / Penjaga
            </Text>
            <Text style={styles.signatureLabel}>( {namaMurid} )</Text>
          </View>
        </View>

        {/* ── PAGE NUMBER ── */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Halaman ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

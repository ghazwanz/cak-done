<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Arus Kas - IAI Standard</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 18px; }
        .header h2 { margin: 5px 0 0; font-size: 14px; font-weight: normal; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 8px; text-align: left; }
        .section-title { font-weight: bold; background-color: #f3f4f6; }
        .indent { padding-left: 20px; }
        .amount { text-align: right; }
        .total { font-weight: bold; border-top: 1px solid #000; border-bottom: 2px solid #000; }
        .footer { margin-top: 40px; text-align: right; }
        .signature { margin-top: 60px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $team->name }}</h1>
        <h2>Laporan Arus Kas</h2>
        <p>Untuk Periode yang Berakhir Pada {{ $endDate->format('d/m/Y') }}</p>
    </div>

    <table>
        <tbody>
            <tr>
                <td colspan="2" class="section-title">Arus Kas dari Aktivitas Operasi</td>
            </tr>
            <tr>
                <td class="indent">Penerimaan Kas dari Pelanggan</td>
                <td class="amount">Rp {{ number_format($operatingIncome, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td class="indent">Pembayaran Kas kepada Pemasok & Karyawan</td>
                <td class="amount">(Rp {{ number_format($operatingExpense, 0, ',', '.') }})</td>
            </tr>
            <tr>
                <td class="section-title">Kas Bersih dari Aktivitas Operasi</td>
                <td class="amount total">Rp {{ number_format($netOperatingCash, 0, ',', '.') }}</td>
            </tr>

            <!-- Add other sections (Investing, Financing) if applicable, defaulting to 0 for UMKM -->
            <tr>
                <td colspan="2" class="section-title">Arus Kas dari Aktivitas Investasi</td>
            </tr>
            <tr>
                <td class="section-title">Kas Bersih dari Aktivitas Investasi</td>
                <td class="amount total">Rp 0</td>
            </tr>

            <tr>
                <td colspan="2" class="section-title">Arus Kas dari Aktivitas Pendanaan</td>
            </tr>
            <tr>
                <td class="section-title">Kas Bersih dari Aktivitas Pendanaan</td>
                <td class="amount total">Rp 0</td>
            </tr>

            <tr>
                <td class="section-title">Kenaikan (Penurunan) Bersih Kas</td>
                <td class="amount total">Rp {{ number_format($netOperatingCash, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td class="section-title">Saldo Kas Awal Periode</td>
                <td class="amount">Rp {{ number_format($startingBalance, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td class="section-title">Saldo Kas Akhir Periode</td>
                <td class="amount total">Rp {{ number_format($startingBalance + $netOperatingCash, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <p>{{ now()->format('d/m/Y') }}</p>
        <br><br><br>
        <p class="signature">_______________________</p>
        <p>Pemilik / Manajemen</p>
    </div>
</body>
</html>
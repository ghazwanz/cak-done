# Laporan Activity Diagram — Aplikasi CAK-DONE

> Dokumen ini menjelaskan alur kerja aplikasi **CAK-DONE** secara menyeluruh dan mudah dipahami oleh semua pihak, termasuk yang bukan berlatar belakang teknologi. Setiap activity diagram menggambarkan **apa yang terjadi, siapa yang melakukannya, dan dalam urutan apa** — dari sudut pandang pengguna maupun sistem.

---

## Daftar Activity Diagram

| No | Nama Aktivitas | Pelaku Utama | Tingkat Kerumitan |
|----|----------------|--------------|-------------------|
| 1 | Masuk / Daftar Akun | Pengguna | Sedang |
| 2 | AI Pencatatan & Tanya Bisnis (CATAT) | Pengguna, AI, Sistem | **Tinggi** |
| 2a | Sub-alur: Proses Input Pencatatan | Sistem, AI | Tinggi |
| 3 | Simpan Transaksi & Perbarui Stok | Pengguna, Sistem | Tinggi |
| 4 | Kelola Stok Barang Secara Manual | Pengguna, Sistem | Sedang |
| 5 | Lihat Dashboard & Pantau Bisnis | Pengguna, Sistem | Sedang |
| 6 | Pengurangan Stok Otomatis (FEFO) | Sistem (otomatis) | Tinggi |
| 7 | Prediksi Keuangan & Tagihan Rutin | Sistem (otomatis) | Sedang |

---

## AD-01: Masuk / Daftar Akun

**Siapa yang terlibat:** Pengguna baru atau pengguna lama
**Kapan terjadi:** Setiap kali seseorang ingin menggunakan aplikasi

### Cerita Alur:

Ketika seseorang membuka aplikasi untuk pertama kali, mereka akan dihadapkan pada halaman **Login** atau **Daftar Akun**. Sistem kemudian memandu pengguna sesuai kondisinya.

```
[MULAI]
    |
    v
[Pengguna membuka aplikasi]
    |
    v
[Halaman Login / Daftar ditampilkan]
    |
    +-- Sudah punya akun? --> [YA]
    |                              |
    |                              v
    |                   [Isi Email & Kata Sandi]
    |                              |
    |                              v
    |                   [Sistem memeriksa kesesuaian akun]
    |                              |
    |                    +-- Sesuai? -- TIDAK --> [Tampil pesan kesalahan]
    |                    |                               |
    |                    |                        [Kembali ke form login]
    |                    |
    |                    +-- YA --> [Sesi login dibuat]
    |                                       |
    |                                       v
    |                              [Diarahkan ke Dashboard]
    |
    +-- Belum punya akun? --> [TIDAK]
                                    |
                                    v
                        [Isi Nama, Email, & Kata Sandi]
                                    |
                                    v
                        [Sistem memastikan email belum terdaftar]
                                    |
                                    v
                        [Akun baru dibuat + Ruang kerja tim otomatis terbuat]
                                    |
                                    v
                        [Login otomatis -> Masuk ke Dashboard]
                                    |
                                    v
                        [Pengguna dapat kelola profil, ganti kata sandi,
                         atau undang anggota tim]
                                    |
                                    v
                              [SELESAI]
```

### Poin Penting:
- Saat akun baru dibuat, **ruang kerja tim** otomatis terbuat sebagai wadah data bisnis.
- Pengguna bisa **mengundang rekan** untuk bergabung ke tim yang sama.
- Fitur **lupa kata sandi** tersedia dan dikirim via email.
- Jika kata sandi salah, pesan kesalahan muncul dan pengguna bisa coba lagi.

---

## AD-02: AI Pencatatan & Tanya Bisnis (Halaman CATAT)

**Siapa yang terlibat:** Pengguna, Tampilan Aplikasi, Sistem, Kecerdasan Buatan (AI)
**Kapan terjadi:** Setiap kali pengguna membuka halaman **CATAT**

### Cerita Alur:

Halaman CATAT adalah jantung aplikasi. Di sini pengguna bisa melakukan dua hal sekaligus: **mencatat transaksi** (pemasukan/pengeluaran) atau **bertanya soal bisnis** — semua lewat satu kotak input yang sama, dalam bahasa sehari-hari.

```
[MULAI]
    |
    v
[Pengguna membuka halaman CATAT]
    |
    v
[Sistem memuat riwayat percakapan, 5 transaksi terakhir,
 dan daftar barang yang hampir habis]
    |
    v
[Halaman CATAT tampil dengan konteks bisnis yang sudah siap]
    |
    v
[Pengguna mengetik, merekam suara, atau memfoto struk belanja]
    |
    v
[Tampilan menunjukkan animasi "Sedang memproses..."]
    |
    v
[Sistem menerima input dan mulai menganalisis]
    |
    +-- Input kosong? --> [YA] --> [Muncul pesan: "Input tidak boleh kosong"]
    |                                        |
    |                                   [SELESAI]
    |
    +-- Input ada --> [TIDAK]
                          |
                          v
            [Sistem mengecek dari mana input berasal]
                          |
            +-- Dari Smart Entry (tombol catat cepat)?
            |       |
            |       v
            |   [Langsung diteruskan ke proses pencatatan]
            |   [Lanjut ke AD-02a → AD-03]
            |
            +-- Dari halaman CATAT biasa?
                    |
                    v
        [AI membaca dan mengenali maksud kalimat]
                    |
        +-----------+------------+
        |                        |
        v                        v
[Kalimat berisi          [Kalimat berisi
 PERTANYAAN bisnis]       PENCATATAN transaksi]
("Berapa profit           ("Jual bakso 5 porsi",
 bulan ini?")             "Beli tepung 2 kg")
        |                        |
        v                        v
[ALUR TANYA]            [ALUR CATAT → AD-02a]
```

### Lanjutan ALUR TANYA:

```
[Sistem mendeteksi rentang waktu dari kalimat]
("bulan lalu", "minggu ini", "Januari", "tahun ini", dll.)
    |
    v
[Sistem menghitung ringkasan keuangan dari database:
  - Total pemasukan & pengeluaran periode tersebut
  - Profit / keuntungan bersih
  - Kondisi kesehatan stok barang
  - Prediksi hari raya atau tanggal penting ke depan]
    |
    v
[AI merangkai angka-angka tersebut menjadi kalimat yang mudah dibaca]
("Bulan ini kamu sudah untung Rp 1,2 juta. Stok bakso mulai menipis...")
    |
    v
[Cek apakah AI menolak pertanyaan karena di luar topik bisnis?]
    |
    +-- YA --> [Tampil pesan penolakan yang sopan]
    |
    +-- TIDAK --> [Apakah perlu tampilkan kartu ringkasan data?]
                    (kata kunci: "ringkasan", "laporan", "total", "berapa")
                          |
                          v
                  [Jawaban AI ditampilkan di layar]
                          |
                          v
                  [Percakapan otomatis tersimpan di riwayat]
                          |
                          v
                      [SELESAI]
```

### Poin Penting:
- AI **tidak menghitung sendiri** — semua angka berasal dari database, AI hanya bertugas **mengemas dalam kalimat** yang mudah dipahami.
- Pengguna bisa bertanya dalam bahasa Indonesia sehari-hari, contoh: *"Gimana penjualan minggu ini?"* atau *"Barang apa yang sering terjual?"*
- Jika pertanyaan tidak berkaitan dengan bisnis, AI akan menolak dengan sopan.
- Riwayat percakapan tersimpan sehingga sesi berikutnya AI masih ingat konteks sebelumnya.

---

## AD-02a: Sub-alur Proses Input Pencatatan

**Siapa yang terlibat:** Sistem, AI
**Kapan terjadi:** Dipanggil otomatis dari AD-02 ketika input terdeteksi sebagai pencatatan

### Cerita Alur:

Setelah AI memutuskan bahwa input pengguna adalah sebuah **pencatatan** (bukan pertanyaan), sistem menjalankan serangkaian langkah cerdas sebelum menampilkan konfirmasi ke pengguna.

```
[MULAI: Input diterima (teks / suara / foto struk)]
    |
    v
[File suara atau foto disimpan sementara di server]
    |
    v
[AI membaca dan mengurai informasi dari input:
  - Nama barang (contoh: "bakso", "tepung terigu")
  - Jumlah uang atau kuantitas
  - Jenis transaksi: pemasukan atau pengeluaran
  - Kategori: makanan, operasional, dll.
  - Apakah ini transaksi bisnis atau pribadi?
  - Apakah ada informasi stok?]
    |
    v
[Cek: Apakah input sama sekali tidak berhubungan dengan bisnis?]
    |
    +-- YA --> [Sistem menolak dan memberi tahu pengguna]
    |                   |
    |              [SELESAI]
    |
    +-- TIDAK --> Lanjut
                    |
                    v
        [Cek apakah pengeluaran ini berisiko menghabiskan kas?]
        (Apakah saldo setelah pengeluaran ini akan minus dalam 7 hari ke depan?)
                    |
                    +-- Berisiko --> [Tanda peringatan disiapkan untuk ditampilkan]
                    |
                    v
        [Sistem mencari nama barang di daftar stok yang dimiliki tim]
        (Cocok meski ejaan sedikit berbeda, contoh: "baso" = "bakso")
                    |
                    +-- Ditemukan --> [Nama & kategori disesuaikan dengan data stok]
                    |                [Data stok terkini dimuat: sisa qty, harga, dll.]
                    |
                    +-- Tidak ditemukan --> [Lanjut tanpa data stok]
                    |
                    v
        [Cek: Apakah ini transaksi PENJUALAN dan harga belum diisi?]
                    |
                    +-- YA --> [Harga otomatis dihitung: Modal × 1.2]
                    |          (Artinya: harga jual = harga beli + 20% keuntungan)
                    |
                    v
        [Sistem menyiapkan saran kontekstual untuk pengguna:]
          - Tren penjualan 7 hari terakhir barang ini
          - Perkiraan berapa hari stok akan habis
          - Pola hari ramai dalam seminggu
          - Peringatan hari raya/libur yang akan datang
          - Info harga terbaru di stok
                    |
                    v
        [Cek: Apakah harga beli barang ini naik dibanding biasanya?]
                    |
                    +-- YA --> [Peringatan kenaikan harga disiapkan]
                    |
                    v
        [Cek: Apakah ini pengeluaran rutin yang sudah dikenal sistem?]
        (contoh: listrik, sewa, gaji, internet)
                    |
                    v
        [Sistem mengirim semua informasi ke tampilan layar pengguna:
          - Detail transaksi yang sudah terurai
          - Peringatan likuiditas (jika ada)
          - Info stok terkini
          - Saran & insight bisnis
          - Peringatan harga naik (jika ada)]
                    |
                    v
        [Tampilan menampilkan KARTU KONFIRMASI kepada pengguna]
        (Pengguna bisa membaca, mengedit, lalu menyetujui)
                    |
                    v
        [Pengguna klik "Simpan" → Lanjut ke AD-03]
```

### Poin Penting:
- Sistem **secara otomatis menghitung harga jual** jika belum diisi (Modal + 20%).
- AI mengenali ejaan yang tidak sempurna, sehingga "baso", "bakso", "Bakso" semua merujuk ke barang yang sama.
- Saran yang muncul **bukan tebakan** — semua berdasarkan data transaksi historis yang sudah ada.
- Pengguna selalu punya kesempatan **memeriksa dan mengedit** sebelum menyimpan.

---

## AD-03: Simpan Transaksi & Perbarui Stok

**Siapa yang terlibat:** Pengguna (konfirmasi), Sistem
**Kapan terjadi:** Setelah pengguna menekan tombol "Simpan" pada kartu konfirmasi

### Cerita Alur:

Setelah pengguna menyetujui detail transaksi yang ditampilkan AI, sistem menyimpan data ke dalam database. Tidak hanya menyimpan — sistem juga **otomatis memperbarui stok barang** sesuai jenis transaksi.

```
[MULAI: Pengguna klik "Simpan"]
    |
    v
[Sistem memeriksa kelengkapan data yang dikirim]
    |
    v
[Sistem membuka "sesi penyimpanan" — jika ada yang gagal,
 semua data dibatalkan agar tidak setengah-setengah tersimpan]
    |
    v
[Transaksi baru dicatat ke dalam database]
    |
    v
[Cek: Jenis transaksi apa?]
    |
    +== PENGELUARAN (Beli Barang / Tambah Stok) ==
    |       [Cari barang di stok, jika belum ada maka buat baru]
    |       [Hitung harga modal per satuan]
    |       [Tambahkan batch stok baru dengan tanggal kadaluarsa]
    |       [Harga jual otomatis diperbarui = Harga Modal × 1.2]
    |
    +== PEMASUKAN (Jual Barang) ==
    |       [Cek: Stok cukup?]
    |       |
    |       +-- TIDAK CUKUP --> [Pesan: "Stok tidak cukup"] → Batal
    |       |
    |       +-- CUKUP --> [Stok dikurangi otomatis (FEFO — lihat AD-06)]
    |                     [Cek: Stok mulai menipis?]
    |                     +-- YA --> [Notifikasi ke pemilik: "Stok hampir habis"]
    |
    +== TRANSAKSI LAINNYA (Non-bisnis) ==
            [Dicatat tanpa perubahan stok]
    |
    v
[Cek: Apakah ini pengeluaran rutin (bulanan/mingguan)?]
    |
    +-- YA --> [Data tagihan rutin diperbarui, jadwal berikutnya dihitung]
    |
    +-- TIDAK --> [Cek apakah nama barang cocok pola tagihan rutin]
                  (listrik, sewa, gaji, internet, wifi, pajak, langganan)
                  +-- Cocok --> [Jadwal tagihan rutin diperbarui]
                  +-- Tidak Cocok --> [Diabaikan]
    |
    v
[Semua data tersimpan dengan aman]
    |
    v
[Halaman kembali dengan pesan: "Transaksi berhasil disimpan!"]
    |
    v
[SELESAI]
```

### Poin Penting:
- **Satu tombol simpan** memicu: simpan transaksi, perbarui stok, hitung harga jual, kirim notifikasi, dan perbarui jadwal tagihan rutin.
- Jika ada satu langkah yang gagal, **seluruh proses dibatalkan** — tidak ada data tersimpan setengah-setengah.
- Notifikasi stok menipis dikirim **otomatis** tanpa pengguna perlu mengecek manual.

---

## AD-04: Kelola Stok Barang Secara Manual

**Siapa yang terlibat:** Pengguna, Sistem
**Kapan terjadi:** Pengguna membuka menu **Inventaris / Stok**

### Cerita Alur:

```
[MULAI: Pengguna buka halaman Inventaris]
    |
    v
[Sistem memuat semua data stok:
  - Daftar semua barang terdaftar
  - Daftar batch/lot stok (urut dari yang paling dekat kadaluarsa)
  - Daftar barang yang stoknya hampir habis]
    |
    v
[Halaman ditampilkan dalam 3 panel/tab:
  1. Semua Barang (master data)
  2. Daftar Batch Stok (Watchdog Kadaluarsa)
  3. Barang Stok Menipis]
    |
    v
[Pengguna memilih tindakan:]
    |
    +== ALUR A: Tambah Barang Baru ==
    |   [Isi formulir: Nama, Kategori, Satuan, Harga Jual, Batas Stok Minimal]
    |   [Opsional: Jumlah awal, Harga Modal, Tanggal Kadaluarsa]
    |   [Sistem simpan + buat batch pertama jika ada stok awal]
    |   [Pesan: "Barang baru berhasil ditambahkan"]
    |
    +== ALUR B: Edit Informasi Barang ==
    |   [Pengguna klik Edit → ubah data yang perlu diubah]
    |   [Sistem menyimpan perubahan]
    |   [Pesan: "Data barang berhasil diperbarui"]
    |
    +== ALUR C: Ubah Jumlah Stok di Batch ==
    |   [Pengguna ubah angka jumlah langsung di baris stok]
    |   [Sistem simpan perubahan jumlah]
    |   [Pesan: "Stok berhasil diperbarui"]
    |
    +== ALUR D: Hapus Batch atau Barang ==
    |   [Hapus satu batch] atau [Hapus seluruh barang beserta semua batchnya]
    |   [Pesan konfirmasi penghapusan]
    |
    +== ALUR E: Bersihkan Semua Barang Kadaluarsa ==
        [Klik "Hapus Semua Kadaluarsa"]
        [Sistem hapus semua batch yang sudah lewat tanggal kadaluarsa]
        [Pesan: "Semua barang kadaluarsa berhasil dihapus"]
    |
    v
[SELESAI]
```

### Poin Penting:
- Panel **Watchdog** menampilkan barang yang mendekati kadaluarsa agar pemilik bisa segera bertindak.
- Panel **Stok Menipis** menampilkan barang yang jumlahnya sudah di bawah batas aman.
- Fitur **Bersihkan Kadaluarsa** menghemat waktu karena tidak perlu menghapus satu per satu.

---

## AD-05: Lihat Dashboard & Pantau Bisnis

**Siapa yang terlibat:** Pengguna, Sistem
**Kapan terjadi:** Pengguna membuka halaman **Dashboard** (halaman utama setelah login)

### Cerita Alur:

```
[MULAI: Pengguna buka Dashboard]
    |
    v
[Sistem mengumpulkan semua data secara bersamaan:]
    +-- Saldo kas saat ini (saldo awal + pemasukan - pengeluaran)
    +-- Data grafik pemasukan vs pengeluaran (default: 7 hari terakhir)
    +-- Kondisi stok: barang mendekati kadaluarsa, sudah kadaluarsa, hampir habis
    +-- Ringkasan keuangan bulan ini: pemasukan, pengeluaran, profit
    +-- Prediksi hari-hari ramai (hari raya / libur dalam 30 hari ke depan)
    +-- Pola penjualan mingguan: hari apa dalam seminggu paling ramai?
    +-- Insight harian dari AI (rangkuman bisnis dalam kalimat)
    +-- 5 transaksi terakhir
    |
    v
[Semua informasi ditampilkan di Dashboard sekaligus]
    |
    v
[Pengguna ingin lihat periode berbeda?]
    |
    +-- YA --> [Klik filter: 7 Hari / 30 Hari / 90 Hari]
    |           [Grafik otomatis berubah, tanpa reload halaman]
    |
    +-- TIDAK --> Lanjut
    |
    v
[Ada peringatan stok (Alert Watchdog)?]
    |
    +-- ADA --> [Klik alert → Diarahkan ke halaman Inventaris]
    +-- TIDAK ADA --> Selesai memantau
    |
    v
[SELESAI]
```

### Poin Penting:
- Semua data dimuat **bersamaan** sehingga dashboard tampil lebih cepat.
- Grafik **langsung berubah** saat filter periode diganti — tanpa reload halaman.
- **Alert Watchdog** muncul otomatis jika ada barang mendekati kadaluarsa atau hampir habis.
- AI memberikan **insight harian** dalam kalimat yang mudah dibaca, bukan angka mentah.

---

## AD-06: Pengurangan Stok Otomatis dengan Metode FEFO

**Siapa yang terlibat:** Sistem (berjalan otomatis di belakang layar)
**Kapan terjadi:** Setiap kali ada transaksi **penjualan** yang dicatat

### Apa itu FEFO?
**FEFO = First Expired, First Out** — Barang yang paling dekat tanggal kadaluarsanya **dijual terlebih dahulu**. Cocok untuk bisnis makanan & minuman karena mengurangi risiko barang terbuang sia-sia.

### Cerita Alur:

```
[MULAI: Sistem menerima data penjualan]
    |
    v
[Sistem mencari barang yang dijual di daftar stok]
    |
    +-- Tidak terdaftar di stok? --> [Dilewati, tidak ada stok dikurangi] → [SELESAI]
    |
    +-- Ditemukan --> Lanjut
                    |
                    v
        [Hitung total stok tersedia dari semua batch]
                    |
                    v
        [Apakah total stok cukup?]
                    |
                    +-- TIDAK CUKUP --> [Pesan kesalahan: "Stok tidak cukup"]
                    |                   [Seluruh transaksi dibatalkan] → [SELESAI]
                    |
                    +-- CUKUP --> Lanjut
                                    |
                                    v
                    [Urutkan batch berdasarkan tanggal kadaluarsa
                     — yang PALING DEKAT didahulukan]
                                    |
                                    v
                    [LOOP pengurangan bertahap per batch:]
                    |
                    +-- Jumlah yang dikurangi sudah terpenuhi? --> [Berhenti]
                    |
                    +-- Stok batch ini cukup? --> [Kurangi batch ini, selesai]
                    |
                    +-- Stok batch ini tidak cukup?
                            [Habiskan batch ini, lanjut ke batch berikutnya]
                    |
                    v
        [Cek: Apakah total stok tersisa di bawah batas aman?]
                    |
                    +-- YA --> [Kirim notifikasi: "Stok [nama barang] hampir habis"]
                    +-- TIDAK --> [Tidak ada notifikasi]
                    |
                    v
        [Kembali ke proses simpan transaksi utama (AD-03)]
                    |
                    v
                [SELESAI]
```

### Poin Penting:
- Proses ini berjalan **di belakang layar** — pengguna tidak perlu mengatur manual.
- Pendekatan FEFO membantu **meminimalkan kerugian** akibat barang kadaluarsa.
- Jika satu batch tidak cukup, sistem **otomatis lanjut ke batch berikutnya**.
- Notifikasi stok menipis dikirim **seketika** begitu batas aman terlewati.

---

## AD-07: Prediksi Keuangan & Kelola Tagihan Rutin

**Siapa yang terlibat:** Sistem (berjalan otomatis di belakang layar)
**Kapan terjadi:** Setiap kali ada transaksi **pengeluaran bisnis** baru

### Cerita Alur:

Sistem menjalankan dua kemampuan secara bersamaan:
1. **Peringatan dini likuiditas** — memberitahu jika pengeluaran berisiko membuat kas minus dalam 7 hari ke depan.
2. **Sinkronisasi tagihan rutin** — memperbarui jadwal tagihan rutin otomatis.

```
[MULAI: Ada pengeluaran bisnis baru]
    |
    v
[Dua proses berjalan bersamaan:]
    |
    +========== ALUR A: Cek Risiko Likuiditas ==========+
    |                                                    |
    v                                                    v
[Hitung saldo kas saat ini]              [ALUR B: Sinkronisasi Tagihan Rutin]
    |
[Kumpulkan tagihan rutin yang            [Cek: Apakah AI tandai sebagai rutin?]
 jatuh tempo dalam 7 hari ke depan]          |
    |                                        +-- YA --> [Perbarui data tagihan rutin]
[Hitung total tagihan yang akan datang]      |          [Hitung jadwal jatuh tempo berikutnya]
    |                                        |
[Jika pengeluaran ini ditambahkan,           +-- TIDAK --> [Cek nama barang:]
 apakah saldo jadi minus?]                               (listrik, sewa, gaji, internet,
    |                                                     wifi, pajak, langganan)
    +-- YA --> [Peringatan:                              |
    |           "Pengeluaran ini berisiko               +-- Cocok & pengeluaran bisnis?
    |            mengganggu keuangan                    |       YA --> [Perbarui jadwal]
    |            7 hari ke depan"]                      |       TIDAK --> [Diabaikan]
    |                                                    |
    +-- TIDAK --> [Aman, tidak ada peringatan]           +-- Tidak cocok --> [Diabaikan]
    |
[Pengguna tetap bisa lanjut meskipun ada peringatan]
    |
    v
[SELESAI]
```

### Poin Penting:
- **Peringatan likuiditas** muncul **sebelum** pengguna menekan simpan — masih bisa dipertimbangkan.
- Sistem memperhitungkan **semua tagihan mendatang** dalam 7 hari — bukan hanya saldo saat ini.
- Pengeluaran rutin seperti listrik dan sewa **otomatis dikenali** dan jadwal berikutnya diperbarui.
- Pengguna tidak perlu mengatur tagihan rutin manual setiap bulan.

---

## Ringkasan: Bagaimana Semua Alur Terhubung

```
[Pengguna Masuk Akun (AD-01)]
    |
    v
[Dashboard ditampilkan (AD-05)]
    |
    +-- Buka CATAT (AD-02)
    |       |
    |       +-- PERTANYAAN --> [AI menjawab dari data database]
    |       |
    |       +-- PENCATATAN --> [Analisis Input (AD-02a)]
    |                              [Kartu Konfirmasi tampil]
    |                              [Pengguna Simpan → AD-03]
    |                                   |
    |                                   +-- Penjualan? --> [Stok otomatis dikurangi (AD-06)]
    |                                   +-- Pembelian? --> [Stok otomatis bertambah]
    |                                   +-- Pengeluaran? --> [Cek risiko likuiditas (AD-07)]
    |                                   +-- Rutin? --> [Jadwal tagihan diperbarui (AD-07)]
    |
    +-- Buka Inventaris (AD-04)
            [Kelola stok manual: tambah, edit, hapus, bersihkan]
```

---

## Catatan Penting untuk Pembaca

1. **Satu input, banyak fungsi** — Pengguna cukup mengetik atau berbicara sekali, sistem mengurus sisanya (stok, harga, notifikasi, tagihan rutin).

2. **AI sebagai penerjemah, bukan kalkulator** — Semua perhitungan angka dilakukan database (cepat dan akurat). AI mengubah angka menjadi kalimat yang mudah dipahami.

3. **FEFO untuk bisnis makanan** — Barang yang paling dekat kadaluarsa dijual lebih dulu secara otomatis, mengurangi risiko kerugian barang basi.

4. **Peringatan proaktif** — Sistem tidak menunggu masalah terjadi. Notifikasi stok menipis, peringatan kas hampir habis, dan prediksi hari raya muncul **sebelum** jadi masalah.

5. **Data selalu aman** — Jika ada satu langkah gagal saat menyimpan, seluruh proses dibatalkan. Tidak ada data tersimpan setengah-setengah.

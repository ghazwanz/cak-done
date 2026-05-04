<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            // Mengikat ke UMKM (Team) dan siapa yang input (User/Pegawai)
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Data Inti dari AI
            $table->string('item_name'); // cth: "Bakso Urat" atau "Bayar Listrik"
            $table->bigInteger('amount'); // Nominal uang (BigInt agar aman dari inflasi/nilai besar)
            $table->enum('type', ['income', 'expense']); // Pemasukan atau Pengeluaran
            $table->string('category'); // cth: "bahan_baku", "operasional", "penjualan"

            // Konteks Keuangan (US-303: Pemisahan uang pribadi & usaha)
            $table->boolean('is_business')->default(true);

            // Catatan asli dari suara user (untuk audit jika AI salah)
            $table->text('raw_input')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();

            $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();
            $table->string('item_name')->nullable(); // cth: "Sosis Kanzler" (redundant but useful for cache)
            $table->integer('qty'); // Jumlah sisa stok
            $table->string('unit')->default('pcs'); // pcs, kg, liter
            $table->decimal('cogs', 15, 2)->nullable(); // Harga Pokok Penjualan (HPP)

            // Tanggal kadaluarsa untuk trigger alert "Besok Basi!"
            $table->date('expiry_date')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_batches');
    }
};

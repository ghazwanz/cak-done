<?php

namespace Database\Factories;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    public function definition(): array
    {
        $type = $this->faker->randomElement(['income', 'expense']);

        $incomeItems = ['Penjualan Basreng', 'Keripik Singkong (L)', 'Paket Sambal Botol', 'Reseller Bakso Frozen', 'Pesanan Dimsum'];
        $expenseItems = ['Beli Minyak Goreng', 'Beli Cabai Rawit', 'Bayar Listrik Toko', 'Beli Standing Pouch', 'Gaji Karyawan', 'Beli Gas LPG'];

        return [
            'team_id' => Team::factory(),
            'user_id' => User::factory(),
            'item_name' => $type === 'income' ? $this->faker->randomElement($incomeItems) : $this->faker->randomElement($expenseItems),
            'amount' => $this->faker->numberBetween(10000, 1000000),
            'type' => $type,
            'category' => $type === 'income' ? 'penjualan' : $this->faker->randomElement(['Bahan Baku', 'Operasional', 'Kemasan', 'Lainnya']),
            'is_business' => $this->faker->boolean(95),
            'raw_input' => $this->faker->sentence(),
            'created_at' => now(),
        ];
    }
}

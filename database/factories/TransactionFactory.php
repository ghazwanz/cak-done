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

        return [
            'team_id' => Team::factory(),
            'user_id' => User::factory(),
            'item_name' => $type === 'income' ? 'Penjualan Paket '.$this->faker->word : 'Belanja '.$this->faker->word,
            'amount' => $this->faker->numberBetween(15000, 500000),
            'type' => $type,
            'category' => $type === 'income' ? 'penjualan' : $this->faker->randomElement(['bahan_baku', 'operasional']),
            'is_business' => $this->faker->boolean(90), // 90% transaksi adalah bisnis
            'created_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ];
    }
}

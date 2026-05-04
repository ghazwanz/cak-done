<?php

namespace Database\Factories;

use App\Models\InventoryItem;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

class InventoryBatchFactory extends Factory
{
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'inventory_item_id' => InventoryItem::factory(),
            'item_name' => $this->faker->randomElement(['Sosis Sapi', 'Ayam Frozen', 'Beras', 'Minyak Goreng']),
            'qty' => $this->faker->numberBetween(1, 50),
            'unit' => $this->faker->randomElement(['pcs', 'kg']),
            'cogs' => $this->faker->numberBetween(5000, 100000), // Harga Pokok
            // Set expired date antara 2 hari ke belakang sampai 14 hari ke depan
            'expiry_date' => $this->faker->dateTimeBetween('-2 days', '+14 days')->format('Y-m-d'),
        ];
    }
}

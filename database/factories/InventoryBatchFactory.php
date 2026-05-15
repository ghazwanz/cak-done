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
            'item_name' => function (array $attributes) {
                return InventoryItem::find($attributes['inventory_item_id'])->name;
            },
            'qty' => $this->faker->numberBetween(1, 100),
            'unit' => function (array $attributes) {
                return InventoryItem::find($attributes['inventory_item_id'])->unit;
            },
            'cogs' => $this->faker->numberBetween(1000, 500000),
            'expiry_date' => $this->faker->dateTimeBetween('-1 month', '+1 year')->format('Y-m-d'),
        ];
    }
}

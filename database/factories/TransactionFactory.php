<?php

namespace Database\Factories;

use App\Models\InventoryItem;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    public function definition(): array
    {
        $type = $this->faker->randomElement(['income', 'expense']);

        // Pick an existing item or create a factory object (don't call create() yet)
        $inventoryItem = InventoryItem::inRandomOrder()->first() ?? InventoryItem::factory();

        $incomeItems = ['Penjualan ', 'Paket ', 'Reseller '];
        $expenseItems = ['Beli ', 'Restock ', 'Biaya '];

        return [
            'team_id' => $inventoryItem instanceof InventoryItem ? $inventoryItem->team_id : Team::factory(),
            'user_id' => User::factory(),
            'item_name' => function (array $attributes) use ($type, $inventoryItem, $incomeItems, $expenseItems) {
                $name = $inventoryItem instanceof InventoryItem ? $inventoryItem->name : $inventoryItem->create()->name;
                $prefix = $type === 'income' ? $this->faker->randomElement($incomeItems) : $this->faker->randomElement($expenseItems);
                return $prefix . $name;
            },
            'amount' => $this->faker->numberBetween(10000, 1000000),
            'type' => $type,
            'category' => $type === 'income' ? 'penjualan' : $this->faker->randomElement(['Bahan Baku', 'Operasional', 'Kemasan', 'Lainnya']),
            'is_business' => $this->faker->boolean(95),
            'raw_input' => $this->faker->sentence(),
            'created_at' => now(),
        ];
    }
}

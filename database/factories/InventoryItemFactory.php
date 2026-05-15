<?php

namespace Database\Factories;

use App\Models\InventoryItem;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryItem>
 */
class InventoryItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $products = [
            'Makanan Kemasan' => ['Keripik Singkong', 'Basreng Pedas', 'Makaroni Daun Jeruk', 'Sambal Bawang Botol', 'Peyek Kacang', 'Kacang Umpet'],
            'Bumbu' => ['Bumbu Rendang', 'Bumbu Dasar Putih', 'Bumbu Nasi Goreng', 'Bubuk Cabai Level', 'Bumbu Kuning Ayam'],
            'Frozen Food' => ['Bakso Sapi 500g', 'Nugget Ayam', 'Dimsum Ayam', 'Risoles Mayo Frozen', 'Sosis Bakar', 'Pempek Palembang'],
            'Kemasan' => ['Plastik Standing Pouch', 'Botol Sambal 150ml', 'Stiker Label UMKM', 'Kotak Mika'],
        ];

        $category = $this->faker->randomElement(array_keys($products));
        $name = $this->faker->randomElement($products[$category]);

        return [
            'team_id' => Team::factory(),
            'name' => $name,
            'category' => $category,
            'unit' => $category === 'Frozen Food' ? 'pack' : ($category === 'Bumbu' ? 'gram' : 'pcs'),
            'storage_type' => $category === 'Frozen Food' ? 'freezer' : 'suhu ruang',
            'low_stock_threshold' => $this->faker->numberBetween(10, 30),
        ];
    }
}

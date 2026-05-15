<?php

namespace Database\Seeders;

use App\Models\InventoryBatch;
use App\Models\InventoryItem;
use App\Models\Team;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Avoid running heavy application seeders during automated tests
        if (app()->environment('testing')) {
            return;
        }

        // 1. Buat User Pemilik (Pak Budi)
        $owner = User::factory()->create([
            'name' => 'Pak Budi',
            'email' => 'budi@cakdone.com',
            'password' => bcrypt('12345'),
        ]);

        // 2. Gunakan Team yang sudah dibuat otomatis oleh factory
        $team = $owner->personalTeam();
        $team->update([
            'name' => 'Warung SWK Pak Budi',
            'opening_balance' => 50000000, // Modal awal 50 Juta
        ]);

        // 3. Generate Historical Data for 3 Years (36 months)
        $startDate = Carbon::now()->subYears(3)->startOfMonth();
        $endDate = Carbon::now();

        // Items for reference
        $itemNames = [
            'Keripik Singkong' => 'Makanan Kemasan',
            'Basreng Pedas' => 'Makanan Kemasan',
            'Bumbu Rendang' => 'Bumbu',
            'Bubuk Cabai' => 'Bumbu',
            'Bakso Sapi Frozen' => 'Frozen Food',
            'Dimsum Ayam' => 'Frozen Food',
            'Standing Pouch 12x20' => 'Kemasan',
            'Gas LPG 3kg' => 'Operasional',
        ];

        $createdItems = [];
        foreach ($itemNames as $name => $category) {
            $createdItems[] = InventoryItem::factory()->create([
                'team_id' => $team->id,
                'name' => $name,
                'category' => $category,
                'unit' => in_array($category, ['Frozen Food', 'Makanan Kemasan']) ? 'pack' : (in_array($category, ['Bumbu']) ? 'gram' : 'pcs'),
                'storage_type' => $category === 'Frozen Food' ? 'freezer' : 'suhu ruang',
            ]);
        }

        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            // Generate 15-30 transactions per month
            $transactionCount = rand(15, 30);

            for ($i = 0; $i < $transactionCount; $i++) {
                $date = $current->copy()->addDays(rand(0, 27))->addHours(rand(8, 20));
                if ($date->gt($endDate)) {
                    continue;
                }

                Transaction::factory()->create([
                    'team_id' => $team->id,
                    'user_id' => $owner->id,
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);
            }

            // Occasional inventory restocking (every 1-2 months)
            if (rand(1, 10) > 4) {
                $randomItem = $createdItems[array_rand($createdItems)];
                InventoryBatch::factory()->create([
                    'team_id' => $team->id,
                    'inventory_item_id' => $randomItem->id,
                    'item_name' => $randomItem->name,
                    'unit' => $randomItem->unit,
                    'created_at' => $current->copy()->addDays(rand(1, 25)),
                    'expiry_date' => $current->copy()->addMonths(rand(3, 12))->format('Y-m-d'),
                ]);
            }

            $current->addMonth();
        }
    }
}

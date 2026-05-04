<?php

namespace Database\Seeders;

use App\Models\InventoryBatch;
use App\Models\InventoryItem;
use App\Models\Team;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Buat User Pemilik (Pak Budi)
        $owner = User::factory()->create([
            'name' => 'Pak Budi',
            'email' => 'budi@cakdone.com',
            'password' => bcrypt('12345'),
        ]);

        // 2. Buat UMKM (Team)
        $team = Team::forceCreate([
            'name' => 'Warung SWK Pak Budi',
            'is_personal' => true,
        ]);

        $team->members()->attach($owner->id, ['role' => 'owner']);

        // 3. Generate 50 Transaksi & 10 Stok untuk UMKM Pak Budi
        Transaction::factory(50)->create([
            'team_id' => $team->id,
            'user_id' => $owner->id,
        ]);

        // Buat beberapa item dasar
        $items = ['Sosis Sapi', 'Ayam Frozen', 'Beras', 'Minyak Goreng'];
        
        foreach ($items as $itemName) {
            $item = InventoryItem::factory()->create([
                'team_id' => $team->id,
                'name' => $itemName,
            ]);

            InventoryBatch::factory(2)->create([
                'team_id' => $team->id,
                'inventory_item_id' => $item->id,
                'item_name' => $itemName,
            ]);
        }
    }
}

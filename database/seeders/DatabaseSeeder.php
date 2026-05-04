<?php

namespace Database\Seeders;

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

        // 3. Generate 50 Transaksi untuk UMKM Pak Budi
        Transaction::factory(50)->create([
            'team_id' => $team->id,
            'user_id' => $owner->id,
        ]);

        // 4. Seed inventory items & batches
        $this->call(InventorySeeder::class);
    }
}

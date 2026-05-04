<?php

namespace Database\Seeders;

use App\Models\InventoryBatch;
use App\Models\InventoryItem;
use App\Models\Team;
use Illuminate\Database\Seeder;

class InventorySeeder extends Seeder
{
    /**
     * Seed inventory_items and inventory_batches for all existing teams.
     *
     * Each item gets 1–3 batches with varying quantities, COGS, and expiry
     * dates to simulate real culinary SME stock (some expired, some nearing
     * expiry, some fresh).
     */
    public function run(): void
    {
        /** @var array<int, array{name: string, category: string, unit: string, batches: list<array{qty: int, cogs: int, expiry_days: int}>}> */
        $catalog = [
            [
                'name' => 'Sosis Sapi',
                'category' => 'bahan_baku',
                'unit' => 'pcs',
                'batches' => [
                    ['qty' => 40, 'cogs' => 3500, 'expiry_days' => 14],
                    ['qty' => 12, 'cogs' => 3500, 'expiry_days' => 2],  // nearing expiry
                ],
            ],
            [
                'name' => 'Ayam Frozen',
                'category' => 'bahan_baku',
                'unit' => 'kg',
                'batches' => [
                    ['qty' => 10, 'cogs' => 38000, 'expiry_days' => 30],
                    ['qty' => 3, 'cogs' => 37000, 'expiry_days' => -1], // expired
                ],
            ],
            [
                'name' => 'Beras',
                'category' => 'bahan_baku',
                'unit' => 'kg',
                'batches' => [
                    ['qty' => 25, 'cogs' => 14000, 'expiry_days' => 90],
                ],
            ],
            [
                'name' => 'Minyak Goreng',
                'category' => 'bahan_baku',
                'unit' => 'liter',
                'batches' => [
                    ['qty' => 8, 'cogs' => 18000, 'expiry_days' => 60],
                    ['qty' => 2, 'cogs' => 17500, 'expiry_days' => 5], // nearing expiry
                ],
            ],
            [
                'name' => 'Telur',
                'category' => 'bahan_baku',
                'unit' => 'pcs',
                'batches' => [
                    ['qty' => 60, 'cogs' => 2500, 'expiry_days' => 21],
                    ['qty' => 10, 'cogs' => 2400, 'expiry_days' => 1],  // almost expired
                ],
            ],
            [
                'name' => 'Tepung Terigu',
                'category' => 'bahan_baku',
                'unit' => 'kg',
                'batches' => [
                    ['qty' => 15, 'cogs' => 12000, 'expiry_days' => 120],
                ],
            ],
            [
                'name' => 'Gula Pasir',
                'category' => 'bahan_baku',
                'unit' => 'kg',
                'batches' => [
                    ['qty' => 5, 'cogs' => 16000, 'expiry_days' => 180],
                ],
            ],
            [
                'name' => 'Cabai Rawit',
                'category' => 'bahan_baku',
                'unit' => 'kg',
                'batches' => [
                    ['qty' => 2, 'cogs' => 45000, 'expiry_days' => 5],
                    ['qty' => 1, 'cogs' => 48000, 'expiry_days' => -2], // expired
                ],
            ],
            [
                'name' => 'Kecap Manis',
                'category' => 'bahan_baku',
                'unit' => 'liter',
                'batches' => [
                    ['qty' => 6, 'cogs' => 22000, 'expiry_days' => 90],
                ],
            ],
            [
                'name' => 'Tahu',
                'category' => 'bahan_baku',
                'unit' => 'pcs',
                'batches' => [
                    ['qty' => 50, 'cogs' => 1000, 'expiry_days' => 3],
                    ['qty' => 20, 'cogs' => 1000, 'expiry_days' => -1], // expired
                    ['qty' => 80, 'cogs' => 950, 'expiry_days' => 7],
                ],
            ],
        ];

        $teams = Team::all();

        foreach ($teams as $team) {
            foreach ($catalog as $entry) {
                $item = InventoryItem::firstOrCreate(
                    ['team_id' => $team->id, 'name' => $entry['name']],
                    ['category' => $entry['category'], 'unit' => $entry['unit']]
                );

                foreach ($entry['batches'] as $batch) {
                    InventoryBatch::create([
                        'team_id' => $team->id,
                        'inventory_item_id' => $item->id,
                        'item_name' => $entry['name'],
                        'qty' => $batch['qty'],
                        'unit' => $entry['unit'],
                        'cogs' => $batch['cogs'],
                        'expiry_date' => now()->addDays($batch['expiry_days'])->toDateString(),
                    ]);
                }
            }
        }
    }
}

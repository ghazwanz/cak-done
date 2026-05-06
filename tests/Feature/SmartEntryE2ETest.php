<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SmartEntryE2ETest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test the full workflow from parsing text to storing the transaction.
     */
    public function test_full_smart_entry_workflow()
    {
        $user = User::factory()->create();
        $team = $user->personalTeam();
        $this->actingAs($user);

        // 1. Mock the Gemini API Response (to avoid hitting quota during CI, but mimicking real structure)
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'item_name' => 'Sosis Kanzler',
                                        'amount' => 50000,
                                        'type' => 'expense',
                                        'category' => 'bahan_baku',
                                        'is_business' => true,
                                        'inventory' => [
                                            'quantity' => 2,
                                            'unit' => 'pack',
                                            'expiry_days' => 30,
                                            'cogs' => 25000,
                                        ],
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        // 2. Phase 1: Parse the text
        $parseResponse = $this->post(route('transactions.parse', $team->slug), [
            'text' => 'beli sosis kanzler 2 pack harga 50rb',
        ]);

        $parseResponse->assertStatus(200);
        $parseResponse->assertJsonPath('success', true);
        $parseResponse->assertJsonPath('data.item_name', 'Sosis Kanzler');

        $extractedData = $parseResponse->json('data');

        // 3. Phase 2: Store the confirmed transaction
        $storeResponse = $this->post(route('transactions.store', $team->slug), array_merge($extractedData, [
            'raw_input' => 'beli sosis kanzler 2 pack harga 50rb',
        ]));

        $storeResponse->assertRedirect();

        // 4. Verify Database Persistence
        $this->assertDatabaseHas('transactions', [
            'team_id' => $team->id,
            'item_name' => 'Sosis Kanzler',
            'amount' => 50000,
            'type' => 'expense',
        ]);

        $this->assertDatabaseHas('inventory_batches', [
            'team_id' => $team->id,
            'item_name' => 'Sosis Kanzler',
            'qty' => 2,
            'unit' => 'pack',
        ]);
    }

    /**
     * Test that income transactions without cogs or full inventory data are handled correctly.
     */
    public function test_smart_entry_handles_income_without_cogs()
    {
        $user = User::factory()->create();
        $team = $user->personalTeam();
        $this->actingAs($user);

        // 1. Mock the Gemini API Response (missing cogs and expiry_days, typical for 'jual' intent)
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'item_name' => 'Masakan',
                                        'amount' => 100000,
                                        'type' => 'income',
                                        'category' => 'penjualan',
                                        'is_business' => true,
                                        'inventory' => [
                                            'quantity' => 20,
                                            'unit' => 'bungkus',
                                        ],
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        // 2. Parse the text
        $parseResponse = $this->post(route('transactions.parse', $team->slug), [
            'text' => 'jual 20 bungkus masakan',
        ]);

        $parseResponse->assertStatus(200);
        $parseResponse->assertJsonPath('success', true);
        $parseResponse->assertJsonPath('data.item_name', 'Masakan');

        $extractedData = $parseResponse->json('data');

        // 3. Store the confirmed transaction
        // Provide defaults that the frontend would now supply
        $extractedData['inventory'] = array_merge($extractedData['inventory'], [
            'cogs' => 0,
            'expiry_days' => 0,
        ]);

        $storeResponse = $this->post(route('transactions.store', $team->slug), array_merge($extractedData, [
            'raw_input' => 'jual 20 bungkus masakan',
        ]));

        $storeResponse->assertRedirect();

        // 4. Verify Database Persistence
        $this->assertDatabaseHas('transactions', [
            'team_id' => $team->id,
            'item_name' => 'Masakan',
            'amount' => 100000,
            'type' => 'income',
        ]);
    }

    /**
     * Test that inventory deduction is case-insensitive (crucial for PostgreSQL).
     */
    public function test_smart_entry_handles_case_insensitive_inventory_deduction()
    {
        $user = User::factory()->create();
        $team = $user->personalTeam();
        $this->actingAs($user);

        // 1. Setup: Create inventory item in lowercase
        $item = $team->inventoryItems()->create([
            'name' => 'masakan',
            'unit' => 'bungkus',
            'category' => 'penjualan',
        ]);

        $team->inventoryBatches()->create([
            'inventory_item_id' => $item->id,
            'team_id' => $team->id,
            'item_name' => 'masakan',
            'qty' => 50,
            'unit' => 'bungkus',
            'cogs' => 1000,
            'expiry_date' => now()->addDays(7),
        ]);

        // 2. Mock AI response with Capitalized item_name
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'item_name' => 'Masakan',
                                        'amount' => 20000,
                                        'type' => 'income',
                                        'category' => 'penjualan',
                                        'is_business' => true,
                                        'inventory' => [
                                            'quantity' => 20,
                                            'unit' => 'bungkus',
                                        ],
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        // 3. Parse and Store
        $parseResponse = $this->post(route('transactions.parse', $team->slug), ['text' => 'jual 20 bungkus masakan']);
        $extractedData = $parseResponse->json('data');

        $this->post(route('transactions.store', $team->slug), array_merge($extractedData, [
            'raw_input' => 'jual 20 bungkus masakan',
        ]));

        // 4. Verify stock decreased (50 - 20 = 30)
        $this->assertDatabaseHas('inventory_batches', [
            'inventory_item_id' => $item->id,
            'qty' => 30,
        ]);
    }

    /**
     * Test that transaction fails if selling more than available stock.
     */
    public function test_smart_entry_fails_if_insufficient_stock()
    {
        $user = User::factory()->create();
        $team = $user->personalTeam();
        $this->actingAs($user);

        // 1. Setup: Create inventory item with only 10 units
        $item = $team->inventoryItems()->create([
            'name' => 'masakan',
            'unit' => 'bungkus',
            'category' => 'penjualan',
        ]);

        $team->inventoryBatches()->create([
            'inventory_item_id' => $item->id,
            'team_id' => $team->id,
            'item_name' => 'masakan',
            'qty' => 10,
            'unit' => 'bungkus',
            'cogs' => 1000,
            'expiry_date' => now()->addDays(7),
        ]);

        // 2. Mock AI response for selling 30 (which is more than 10)
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'item_name' => 'masakan',
                                        'amount' => 30000,
                                        'type' => 'income',
                                        'category' => 'penjualan',
                                        'is_business' => true,
                                        'inventory' => [
                                            'quantity' => 30,
                                            'unit' => 'bungkus',
                                        ],
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        // 3. Parse and then try to Store
        $parseResponse = $this->post(route('transactions.parse', $team->slug), ['text' => 'jual 30 bungkus masakan']);
        $extractedData = $parseResponse->json('data');

        $storeResponse = $this->post(route('transactions.store', $team->slug), array_merge($extractedData, [
            'raw_input' => 'jual 30 bungkus masakan',
        ]));

        // 4. Verify validation error (Session should have errors)
        $storeResponse->assertSessionHasErrors('item_name');
        
        // Stock should still be 10
        $this->assertEquals(10, $team->inventoryBatches()->where('inventory_item_id', $item->id)->sum('qty'));
    }
}

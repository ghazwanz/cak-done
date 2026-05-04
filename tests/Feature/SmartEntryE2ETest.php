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
}

<?php

use App\Models\InventoryBatch;
use App\Models\InventoryItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('inventory page is accessible', function () {
    $user = User::factory()->create();
    $team = $user->personalTeam(); // Assuming this helper exists or we can just get the first team

    if (! $team) {
        $team = $user->ownedTeams()->first();
    }

    $item = InventoryItem::factory()->create([
        'team_id' => $team->id,
        'name' => 'Sosis Kanzler',
    ]);

    InventoryBatch::factory()->create([
        'team_id' => $team->id,
        'inventory_item_id' => $item->id,
        'item_name' => 'Sosis Kanzler',
        'qty' => 10,
        'expiry_date' => now()->addDays(5),
    ]);

    $response = $this->actingAs($user)
        ->get(route('inventory.index', ['current_team' => $team->slug]));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('inventory/index')
        ->has('batches', 1)
    );
});

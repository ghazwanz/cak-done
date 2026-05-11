<?php

use App\Models\InventoryBatch;
use App\Models\InventoryItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->team = $this->user->currentTeam;

    $this->item = InventoryItem::factory()->create([
        'team_id' => $this->team->id,
        'name' => 'Barang Test',
        'unit' => 'pcs',
        'low_stock_threshold' => 10,
    ]);

    $this->batch = InventoryBatch::factory()->create([
        'team_id' => $this->team->id,
        'inventory_item_id' => $this->item->id,
        'item_name' => 'Barang Test',
        'qty' => 50,
        'unit' => 'pcs',
        'cogs' => 1000,
        'expiry_date' => now()->addMonth()->toDateString(),
    ]);
});

test('it can update an inventory item', function () {
    $response = $this->actingAs($this->user)
        ->patch(route('inventory.items.update', ['current_team' => $this->team->slug, 'id' => $this->item->id]), [
            'name' => 'Barang Terupdate',
            'category' => 'Bahan Baku',
            'unit' => 'kg',
            'low_stock_threshold' => 5,
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('inventory_items', [
        'id' => $this->item->id,
        'name' => 'Barang Terupdate',
        'unit' => 'kg',
    ]);
});

test('it can delete an inventory item', function () {
    $response = $this->actingAs($this->user)
        ->delete(route('inventory.items.destroy', ['current_team' => $this->team->slug, 'id' => $this->item->id]));

    $response->assertRedirect();
    $this->assertDatabaseMissing('inventory_items', ['id' => $this->item->id]);
    $this->assertDatabaseMissing('inventory_batches', ['inventory_item_id' => $this->item->id]);
});

test('it can delete a batch', function () {
    $response = $this->actingAs($this->user)
        ->delete(route('inventory.destroy', ['current_team' => $this->team->slug, 'id' => $this->batch->id]));

    $response->assertRedirect();
    $this->assertDatabaseMissing('inventory_batches', ['id' => $this->batch->id]);
});

test('it can clear all expired batches', function () {
    // Add an expired batch
    InventoryBatch::factory()->create([
        'team_id' => $this->team->id,
        'inventory_item_id' => $this->item->id,
        'item_name' => 'Barang Expired',
        'qty' => 10,
        'unit' => 'pcs',
        'cogs' => 500,
        'expiry_date' => now()->subDay()->toDateString(),
    ]);

    $response = $this->actingAs($this->user)
        ->post(route('inventory.clear-expired', ['current_team' => $this->team->slug]));

    $response->assertRedirect();
    $this->assertDatabaseMissing('inventory_batches', ['expiry_date' => now()->subDay()->toDateString()]);
    // The non-expired batch should still be there
    $this->assertDatabaseHas('inventory_batches', ['id' => $this->batch->id]);
});

<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\Team;
use Illuminate\Database\Eloquent\Collection;

class InventoryService
{
    /**
     * Get inventory batches for a team ordered by nearest expiry.
     */
    public function getBatchesOrderedByExpiry(Team $team): Collection
    {
        return $team->inventoryBatches()
            ->with('inventoryItem')
            ->where('qty', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->get();
    }

    /**
     * Get items that are below their stock threshold.
     */
    public function getLowStockItems(Team $team): Collection
    {
        return $team->inventoryItems()
            ->with('batches')
            ->get()
            ->filter(function ($item) {
                return $item->batches->sum('qty') <= $item->low_stock_threshold;
            });
    }

    /**
     * Get all inventory items for a team.
     */
    public function getInventoryItems(Team $team): Collection
    {
        return $team->inventoryItems()->with('batches')->orderBy('name')->get();
    }

    /**
     * Create a new inventory item.
     */
    public function createItem(Team $team, array $data): InventoryItem
    {
        return $team->inventoryItems()->create($data);
    }

    /**
     * Update an inventory item.
     */
    public function updateItem(Team $team, int $itemId, array $data): void
    {
        $team->inventoryItems()->where('id', $itemId)->update($data);
    }

    /**
     * Delete an inventory item and its batches.
     */
    public function deleteItem(Team $team, int $itemId): void
    {
        $item = $team->inventoryItems()->find($itemId);
        if ($item) {
            $item->batches()->delete();
            $item->delete();
        }
    }

    /**
     * Update a specific batch quantity.
     */
    public function updateBatchQty(Team $team, int $batchId, int $newQty): void
    {
        $team->inventoryBatches()->where('id', $batchId)->update(['qty' => $newQty]);
    }

    /**
     * Delete all expired batches for a team.
     */
    public function deleteExpiredBatches(Team $team): void
    {
        $team->inventoryBatches()
            ->where('expiry_date', '<', now()->toDateString())
            ->delete();
    }

    /**
     * Delete a batch.
     */
    public function deleteBatch(Team $team, int $batchId): void
    {
        $team->inventoryBatches()->where('id', $batchId)->delete();
    }
}

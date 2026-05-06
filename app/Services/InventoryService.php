<?php

namespace App\Services;

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
     * Update a specific batch quantity.
     */
    public function updateBatchQty(Team $team, int $batchId, int $newQty): void
    {
        $team->inventoryBatches()->where('id', $batchId)->update(['qty' => $newQty]);
    }

    /**
     * Delete a batch.
     */
    public function deleteBatch(Team $team, int $batchId): void
    {
        $team->inventoryBatches()->where('id', $batchId)->delete();
    }
}

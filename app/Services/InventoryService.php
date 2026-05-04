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
}

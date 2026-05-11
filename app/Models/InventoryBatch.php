<?php

namespace App\Models;

use Database\Factories\InventoryBatchFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryBatch extends Model
{
    /** @use HasFactory<InventoryBatchFactory> */
    use HasFactory;

    protected $guarded = [];

    protected static function booted(): void
    {
        static::saved(function (InventoryBatch $batch) {
            // Automatically update the master item's selling price whenever a new batch is saved
            if ($batch->inventoryItem && $batch->cogs > 0) {
                $batch->inventoryItem->update([
                    'selling_price' => round($batch->cogs * 1.2),
                ]);
            }
        });
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }
}

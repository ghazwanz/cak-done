<?php

use App\Models\InventoryItem;

$items = InventoryItem::all();
foreach ($items as $item) {
    $avgCogs = $item->batches()->avg('cogs') ?? 0;
    if ($avgCogs > 0) {
        $item->update([
            'selling_price' => round($avgCogs * 1.2),
        ]);
        echo "Updated {$item->name} to ".round($avgCogs * 1.2)."\n";
    }
}

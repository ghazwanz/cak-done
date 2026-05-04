<?php

namespace App\Services;

use App\Models\Team;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class TransactionService
{
    /**
     * Store a transaction and optionally update inventory batches.
     */
    public function createTransaction(Team $team, int $userId, array $validated, ?array $inventory = null): Transaction
    {
        return DB::transaction(function () use ($team, $userId, $validated, $inventory) {
            $transaction = $team->transactions()->create([
                'user_id' => $userId,
                'item_name' => $validated['item_name'],
                'amount' => $validated['amount'],
                'type' => $validated['type'],
                'category' => $validated['category'],
                'is_business' => $validated['is_business'],
                'raw_input' => $validated['raw_input'] ?? null,
            ]);

            if ($inventory !== null && $validated['type'] === 'expense') {
                $this->processInventory($team, $validated, $inventory);
            }

            return $transaction;
        });
    }

    /**
     * Get transactions for a team, ordered by date.
     */
    public function getTransactionsOrderedByDate(Team $team, int $perPage = 15)
    {
        return $team->transactions()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Process inventory updates when a transaction is recorded.
     */
    protected function processInventory(Team $team, array $validated, array $inventory): void
    {
        // 1. Find or create the InventoryItem for this team
        $inventoryItem = $team->inventoryItems()->firstOrCreate(
            ['name' => $validated['item_name']],
            [
                'unit' => $inventory['unit'] ?? 'pcs',
                'category' => $validated['category'],
            ]
        );

        // 2. Create the specific batch
        $team->inventoryBatches()->create([
            'inventory_item_id' => $inventoryItem->id,
            'team_id' => $team->id,
            'item_name' => $validated['item_name'],
            'qty' => $inventory['quantity'] ?? 1,
            'unit' => $inventory['unit'] ?? 'pcs',
            'cogs' => round($inventory['cogs'] ?? ($validated['amount'] / ($inventory['quantity'] ?? 1)), 2),
            'expiry_date' => now()->addDays($inventory['expiry_days'] ?? 7),
        ]);
    }
}

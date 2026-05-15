<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\Team;
use App\Models\Transaction;
use App\Notifications\LowStockAlertNotification;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

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

            // Auto-deduct inventory for sales (Workflow 2)
            if ($validated['type'] === 'income' && $validated['is_business']) {
                $this->deductInventoryForSale($team, $validated, $inventory);
            }

            // Sync or Create Recurring Expense if detected by AI
            if (! empty($validated['is_recurring']) && $validated['is_recurring']) {
                $this->handleRecurringCreation($team, $validated);
            } else {
                // Fallback to simple keyword detection
                $this->syncRecurringExpense($team, $validated);
            }

            return $transaction;
        });
    }

    /**
     * Handle the creation or update of a recurring expense from AI metadata.
     */
    protected function handleRecurringCreation(Team $team, array $validated): void
    {
        $team->recurringExpenses()->updateOrCreate(
            ['name' => $validated['item_name'], 'is_business' => $validated['is_business']],
            [
                'amount' => $validated['amount'],
                'frequency' => $validated['frequency'] ?? 'monthly',
                'is_active' => true,
                'next_due_date' => $this->calculateNextDueDate($validated['frequency'] ?? 'monthly'),
                'user_id' => auth()->id(),
            ]
        );
    }

    protected function calculateNextDueDate(string $frequency): CarbonInterface
    {
        $date = now();
        switch ($frequency) {
            case 'daily': return $date->addDay();
            case 'weekly': return $date->addWeek();
            case 'monthly': return $date->addMonth();
            case 'yearly': return $date->addYear();
            default: return $date->addMonth();
        }
    }

    /**
     * Check if a transaction should trigger or update a recurring expense.
     */
    protected function syncRecurringExpense(Team $team, array $validated): void
    {
        // Simple logic: if a business expense with the same name/category
        // appears frequently, or is explicitly tagged, we manage it here.
        // For now, let's auto-detect based on string matching.
        $keywords = ['listrik', 'sewa', 'internet', 'gaji', 'wifi', 'pajak', 'langganan'];
        $isRecurringCandidate = false;

        foreach ($keywords as $keyword) {
            if (stripos($validated['item_name'], $keyword) !== false) {
                $isRecurringCandidate = true;
                break;
            }
        }

        if ($isRecurringCandidate && $validated['is_business'] && $validated['type'] === 'expense') {
            $recurring = $team->recurringExpenses()->where('name', $validated['item_name'])->first();

            if ($recurring) {
                // Update next_due_date based on frequency
                $nextDue = now();
                $nextDue = match ($recurring->frequency) {
                    'daily' => $nextDue->addDay(),
                    'weekly' => $nextDue->addWeek(),
                    'monthly' => $nextDue->addMonth(),
                    'yearly' => $nextDue->addYear(),
                    default => $nextDue->addMonth(),
                };
                $recurring->update(['next_due_date' => $nextDue]);
            }
        }
    }

    /**
     * Get transactions for a team, ordered by date with optional filtering.
     */
    public function getTransactionsOrderedByDate(Team $team, array $filters = [], int $perPage = 15)
    {
        $query = $team->transactions()
            ->with('user')
            ->orderBy('created_at', 'desc');

        if (! empty($filters['search'])) {
            $search = strtolower($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(item_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(category) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(raw_input) LIKE ?', ["%{$search}%"]);
            });
        }

        if (! empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }

        if (! empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Process inventory updates when a transaction is recorded.
     */
    protected function processInventory(Team $team, array $validated, array $inventory): void
    {
        // 1. Find or create the InventoryItem for this team (Case-insensitive for PGSQL)
        $inventoryItem = $team->inventoryItems()
            ->whereRaw('LOWER(name) = LOWER(?)', [$validated['item_name']])
            ->first();

        if (! $inventoryItem) {
            $inventoryItem = $team->inventoryItems()->create([
                'name' => $validated['item_name'],
                'unit' => $inventory['unit'] ?? 'pcs',
                'category' => $validated['category'],
            ]);
        }

        // 2. Create the specific batch
        $expiryDate = isset($inventory['expiry_date'])
            ? Carbon::parse($inventory['expiry_date'])
            : now()->addDays($inventory['expiry_days'] ?? 7);

        $cogs = round($inventory['cogs'] ?? ($validated['amount'] / ($inventory['quantity'] ?? 1)), 2);

        $team->inventoryBatches()->create([
            'inventory_item_id' => $inventoryItem->id,
            'team_id' => $team->id,
            'item_name' => $inventoryItem->name,
            'qty' => $inventory['quantity'] ?? 1,
            'unit' => $inventoryItem->unit,
            'cogs' => $cogs,
            'expiry_date' => $expiryDate,
        ]);
    }

    /**
     * Automatically deduct stock from existing batches when a sale is recorded.
     */
    protected function deductInventoryForSale(Team $team, array $validated, ?array $inventory): void
    {
        // Check if there's an inventory item matching the transaction item_name (Case-insensitive for PGSQL)
        $inventoryItem = $team->inventoryItems()
            ->whereRaw('LOWER(name) = LOWER(?)', [$validated['item_name']])
            ->first();

        if (! $inventoryItem) {
            return;
        }

        // Use quantity from metadata if available, else default to 1 (standard sale unit)
        $quantityToDeduct = $inventory['quantity'] ?? 1;

        $totalAvailable = $team->inventoryBatches()
            ->where('inventory_item_id', $inventoryItem->id)
            ->sum('qty');

        if ($totalAvailable < $quantityToDeduct) {
            throw ValidationException::withMessages([
                'item_name' => ["Waduh rek, stok gak cukup. Sisa mung {$totalAvailable} {$inventoryItem->unit}, tapi sampeyan dodol {$quantityToDeduct}."],
            ]);
        }

        // Get batches ordered by expiry date (FEFO - First Expired First Out)
        $batches = $team->inventoryBatches()
            ->where('inventory_item_id', $inventoryItem->id)
            ->where('qty', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->get();

        foreach ($batches as $batch) {
            if ($quantityToDeduct <= 0) {
                break;
            }

            if ($batch->qty >= $quantityToDeduct) {
                $batch->decrement('qty', $quantityToDeduct);
                $quantityToDeduct = 0;
            } else {
                $quantityToDeduct -= $batch->qty;
                $batch->update(['qty' => 0]);
            }
        }

        // Check for Low Stock Warning after deduction
        $this->checkLowStock($team, $inventoryItem);
    }

    /**
     * Check if the total stock for an item is below the threshold.
     */
    protected function checkLowStock(Team $team, InventoryItem $item): void
    {
        $totalQty = $item->batches()->sum('qty');

        if ($totalQty <= $item->low_stock_threshold) {
            // Notify team members or the owner about low stock
            $team->owner->notify(new LowStockAlertNotification($item, $totalQty));
        }
    }
}

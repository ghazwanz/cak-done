<?php

namespace App\Services\Ai;

use App\Models\Team;
use Illuminate\Support\Facades\DB;

class AggregatorService
{
    /**
     * Get a summary of financial performance for a team within a date range.
     */
    public function getFinancialSummary(Team $team, string $startDate, string $endDate): array
    {
        return [
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'totals' => [
                'income' => (float) $team->transactions()
                    ->where('type', 'income')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->sum('amount'),
                'expense' => (float) $team->transactions()
                    ->where('type', 'expense')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->sum('amount'),
                'count' => $team->transactions()
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
            ],
            'top_items' => $team->transactions()
                ->where('type', 'income')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->select('item_name', DB::raw('SUM(amount) as revenue'), DB::raw('COUNT(*) as sales'))
                ->groupBy('item_name')
                ->orderByDesc('revenue')
                ->limit(5)
                ->get()
                ->toArray(),
            'inventory_alerts' => [
                'low_stock' => $team->inventoryBatches()
                    ->where('qty', '<=', 5)
                    ->count(),
                'near_expiry' => $team->inventoryBatches()
                    ->whereBetween('expiry_date', [now(), now()->addDays(7)])
                    ->count(),
            ],
        ];
    }

    /**
     * Specifically aggregate inventory health data.
     */
    public function getInventoryHealth(Team $team): array
    {
        return $team->inventoryBatches()
            ->select(
                DB::raw('COUNT(*) as batch_count'),
                DB::raw('SUM(CASE WHEN expiry_date < CURRENT_DATE THEN 1 ELSE 0 END) as expired'),
                DB::raw('SUM(CASE WHEN expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + 7) THEN 1 ELSE 0 END) as nearing_expiry'),
                DB::raw('SUM(qty) as total_qty')
            )
            ->first()
            ?->toArray() ?? [];
    }
}

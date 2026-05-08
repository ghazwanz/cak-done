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
        $summary = $team->inventoryBatches()
            ->select(
                DB::raw('COUNT(*) as batch_count'),
                DB::raw('SUM(CASE WHEN expiry_date < CURRENT_DATE THEN 1 ELSE 0 END) as expired'),
                DB::raw('SUM(CASE WHEN expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + 7) THEN 1 ELSE 0 END) as nearing_expiry'),
                DB::raw('SUM(qty) as total_qty')
            )
            ->first()
            ?->toArray() ?? [];

        // Fetch details for items nearing expiry
        $summary['nearing_expiry_details'] = $team->inventoryBatches()
            ->whereBetween('expiry_date', [now()->toDateString(), now()->addDays(7)->toDateString()])
            ->where('qty', '>', 0)
            ->select('item_name', 'qty', 'expiry_date')
            ->get()
            ->toArray();

        // Fetch details for items already expired
        $summary['expired_details'] = $team->inventoryBatches()
            ->where('expiry_date', '<', now()->toDateString())
            ->where('qty', '>', 0)
            ->select('item_name', 'qty', 'expiry_date')
            ->get()
            ->toArray();

        return $summary;
    }

    /**
     * Get predictions for upcoming holidays based on historical data.
     */
    public function getUpcomingHolidayPredictions(Team $team): ?array
    {
        $holidays = [
            '01-01' => ['name' => 'Tahun Baru Masehi', 'is_hijri' => false],
            '02-14' => ['name' => 'Hari Valentine', 'is_hijri' => false],
            '05-01' => ['name' => 'Hari Buruh', 'is_hijri' => false],
            '05-27' => ['name' => 'Idul Adha', 'is_hijri' => true], // Berdasarkan tanggal 27 besok (2026)
            '08-17' => ['name' => 'Hari Kemerdekaan RI', 'is_hijri' => false],
            '10-28' => ['name' => 'Sumpah Pemuda', 'is_hijri' => false],
            '12-25' => ['name' => 'Hari Raya Natal', 'is_hijri' => false],
        ];

        $upcomingHoliday = null;
        $holidayDate = null;
        $isHijri = false;
        $today = now();

        for ($i = 1; $i <= 30; $i++) {
            $checkDate = $today->copy()->addDays($i);
            $md = $checkDate->format('m-d');
            if (isset($holidays[$md])) {
                $upcomingHoliday = $holidays[$md]['name'];
                $isHijri = $holidays[$md]['is_hijri'];
                $holidayDate = $checkDate;
                break;
            }
        }

        if (! $upcomingHoliday) {
            return null; // No holiday in next 30 days
        }

        // Look at data from exactly 1 year ago around the holiday (-7 days to +2 days)
        // Hijri holidays shift backward by ~11 days each Gregorian year, so to get last year's date, we add 11 days.
        $lastYearHoliday = $isHijri ? $holidayDate->copy()->subYear()->addDays(11) : $holidayDate->copy()->subYear();
        $startHist = $lastYearHoliday->copy()->subDays(7);
        $endHist = $lastYearHoliday->copy()->addDays(2);

        $historicalSales = collect(DB::select("
            SELECT item_name, SUM(amount) as revenue, COUNT(*) as qty_sold
            FROM transactions
            WHERE team_id = ? 
              AND type = 'income' 
              AND created_at BETWEEN ? AND ?
            GROUP BY item_name
            ORDER BY qty_sold DESC
            LIMIT 5
        ", [$team->id, $startHist, $endHist]));

        if ($historicalSales->isEmpty()) {
            return [
                'holiday' => $upcomingHoliday,
                'date' => $holidayDate->toDateString(),
                'message' => 'Event semakin dekat, namun tidak ada data historis penjualan tahun lalu untuk event ini.',
                'predictions' => [],
            ];
        }

        // Calculate growth trend comparing last 30 days vs same period last year
        $recent30DaysIncome = $team->transactions()
            ->where('type', 'income')
            ->whereBetween('created_at', [now()->subDays(30), now()])
            ->sum('amount');

        $lastYear30DaysIncome = $team->transactions()
            ->where('type', 'income')
            ->whereBetween('created_at', [now()->subYear()->subDays(30), now()->subYear()])
            ->sum('amount');

        $growthRate = 1.0;
        if ($lastYear30DaysIncome > 0) {
            // Cap between 0.5 (50% drop) and 3.0 (300% growth) to avoid crazy predictions
            $growthRate = max(0.5, min(3.0, $recent30DaysIncome / $lastYear30DaysIncome));
        }

        // Regression/Projection
        $predictions = [];
        foreach ($historicalSales as $item) {
            // Predict based on last year's volume multiplied by this year's growth factor
            $predictedQty = ceil($item->qty_sold * $growthRate);
            $predictions[] = [
                'item_name' => $item->item_name,
                'historical_qty_sold_last_year' => $item->qty_sold,
                'predicted_demand_this_year' => max(1, $predictedQty),
            ];
        }

        return [
            'holiday' => $upcomingHoliday,
            'date' => $holidayDate->toDateString(),
            'growth_trend' => round(($growthRate - 1) * 100).'% vs tahun lalu',
            'predictions' => $predictions,
        ];
    }
}

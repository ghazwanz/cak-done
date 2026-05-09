<?php

namespace App\Services\Ai;

use App\Models\Team;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AggregatorService
{
    /**
     * Get a summary of financial performance for a team within a date range.
     */
    public function getFinancialSummary(Team $team, string $startDate, string $endDate): array
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        $diff = $start->diffInDays($end);

        $prevStart = $start->copy()->subDays($diff + 1)->toDateString();
        $prevEnd = $start->copy()->subDay()->toDateString();

        $currentIncome = (float) $team->transactions()
            ->where('type', 'income')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');

        $prevIncome = (float) $team->transactions()
            ->where('type', 'income')
            ->whereBetween('created_at', [$prevStart, $prevEnd])
            ->sum('amount');

        $growth = 0;
        if ($prevIncome > 0) {
            $growth = (($currentIncome - $prevIncome) / $prevIncome) * 100;
        }

        return [
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'performance_trend' => [
                'income_growth_percent' => round($growth, 2),
                'comparison_period' => [
                    'start' => $prevStart,
                    'end' => $prevEnd,
                ],
            ],
            'totals' => [
                'income' => $currentIncome,
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
    public function getUpcomingHolidayPredictions(Team $team, ?string $query = null): ?array
    {
        $holidays = [
            '01-01' => ['name' => 'Tahun Baru Masehi', 'is_hijri' => false, 'keywords' => ['tahun baru', 'masehi', 'new year']],
            '02-14' => ['name' => 'Hari Valentine', 'is_hijri' => false, 'keywords' => ['valentine', 'kasih sayang']],
            '05-01' => ['name' => 'Hari Buruh', 'is_hijri' => false, 'keywords' => ['buruh', 'may day']],
            '05-27' => ['name' => 'Idul Adha', 'is_hijri' => true, 'keywords' => ['idul adha', 'kurban', 'qurban', 'haji']],
            '08-17' => ['name' => 'Hari Kemerdekaan RI', 'is_hijri' => false, 'keywords' => ['kemerdekaan', 'agustusan', '17 agustus']],
            '10-28' => ['name' => 'Sumpah Pemuda', 'is_hijri' => false, 'keywords' => ['sumpah pemuda']],
            '12-25' => ['name' => 'Hari Raya Natal', 'is_hijri' => false, 'keywords' => ['natal', 'christmas']],
        ];

        $upcomingHoliday = null;
        $holidayDate = null;
        $isHijri = false;
        $today = now();

        // 1. Try to find a holiday mentioned in the query
        if ($query) {
            $lowerQuery = strtolower($query);
            foreach ($holidays as $dateKey => $data) {
                foreach ($data['keywords'] as $keyword) {
                    if (str_contains($lowerQuery, $keyword)) {
                        $upcomingHoliday = $data['name'];
                        $isHijri = $data['is_hijri'];
                        // Set holiday date to this year's occurrence
                        $holidayDate = Carbon::createFromFormat('m-d', $dateKey)->setYear($today->year);
                        if ($holidayDate->isPast() && ! str_contains($dateKey, '12-25')) {
                            $holidayDate->addYear();
                        }
                        break 2;
                    }
                }
            }
        }

        // 2. If no specific holiday found, find the next upcoming one (no 30-day limit)
        if (! $upcomingHoliday) {
            for ($i = 1; $i <= 366; $i++) {
                $checkDate = $today->copy()->addDays($i);
                $md = $checkDate->format('m-d');
                if (isset($holidays[$md])) {
                    $upcomingHoliday = $holidays[$md]['name'];
                    $isHijri = $holidays[$md]['is_hijri'];
                    $holidayDate = $checkDate;
                    break;
                }
            }
        }

        if (! $upcomingHoliday) {
            return null;
        }

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
        ", [$team->id, $startHist->toDateTimeString(), $endHist->toDateTimeString()]));

        if ($historicalSales->isEmpty()) {
            return [
                'holiday' => $upcomingHoliday,
                'date' => $holidayDate->toDateString(),
                'message' => 'Event semakin dekat, namun tidak ada data historis penjualan tahun lalu untuk event ini.',
                'predictions' => [],
            ];
        }

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
            $growthRate = max(0.5, min(3.0, $recent30DaysIncome / $lastYear30DaysIncome));
        }

        $predictions = [];
        foreach ($historicalSales as $item) {
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
            'predicted_holiday_growth' => round(($growthRate - 1) * 100).'% vs tahun lalu',
            'predictions' => $predictions,
        ];
    }

    /**
     * Get historical cash flow data for chart visualization.
     */
    public function getHistoricalCashFlow(Team $team, string $period = '7_days'): array
    {
        $days = match ($period) {
            '1_month' => 30,
            '3_months' => 90,
            '1_year' => 365,
            '5_years' => 1825,
            default => 7,
        };

        $startDate = now()->subDays($days)->startOfDay();
        $endDate = now()->endOfDay();
        $isMonthly = $days > 90;
        $truncUnit = $isMonthly ? 'month' : 'day';

        // 1. Get starting balance BEFORE the start date (SQL sum)
        $openingBalance = (float) $team->opening_balance;
        $balanceBefore = $team->transactions()
            ->business()
            ->where('created_at', '<', $startDate)
            ->select(DB::raw("SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as total"))
            ->first()
            ?->total ?? 0;

        $runningBalance = $openingBalance + (float) $balanceBefore;

        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $periodRaw = $isSqlite
            ? ($isMonthly ? "strftime('%Y-%m-01 00:00:00', created_at)" : "strftime('%Y-%m-%d 00:00:00', created_at)")
            : "date_trunc('$truncUnit', created_at)";

        $aggregates = DB::table('transactions')
            ->where('team_id', $team->id)
            ->where('is_business', true)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw("$periodRaw as period"),
                DB::raw('SUM(CASE WHEN type = \'income\' THEN amount ELSE 0 END) as income'),
                DB::raw('SUM(CASE WHEN type = \'expense\' THEN amount ELSE 0 END) as expense')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $aggregates = $aggregates->keyBy(function ($item) use ($isMonthly) {
            return Carbon::parse($item->period)->format($isMonthly ? 'M Y' : 'Y-m-d');
        });

        // 3. Fill gaps and calculate running balance using DatePeriod for safety
        $data = [];

        $periodRange = new \DatePeriod(
            $isMonthly ? $startDate->copy()->startOfMonth() : $startDate->copy(),
            new \DateInterval($isMonthly ? 'P1M' : 'P1D'),
            $endDate->copy()->addSecond()
        );

        foreach ($periodRange as $date) {
            $carbonDate = Carbon::instance($date);
            $key = $carbonDate->format($isMonthly ? 'M Y' : 'Y-m-d');
            $agg = $aggregates->get($key);

            if ($agg) {
                $runningBalance += ((float) $agg->income - (float) $agg->expense);
            }

            $data[] = [
                'date' => $key,
                'balance' => $runningBalance,
            ];
        }

        return $data;
    }

    /**
     * Calculate the current balance for a team using opening balance and all business transactions.
     */
    public function calculateTeamBalance(Team $team): float
    {
        $openingBalance = (float) $team->opening_balance;

        $totalDiff = $team->transactions()
            ->business()
            ->select(DB::raw("SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as total"))
            ->first()
            ?->total ?? 0;

        return $openingBalance + (float) $totalDiff;
    }
}

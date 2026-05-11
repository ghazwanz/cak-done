<?php

namespace App\Services\Ai;

use App\Models\InventoryItem;
use App\Models\Team;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AggregatorService
{
    /**
     * Find the closest matching inventory item to prevent redundancy due to typos.
     */
    public function findClosestInventoryItem(Team $team, ?string $itemName): ?InventoryItem
    {
        if (! $itemName) {
            return null;
        }

        $itemName = strtolower(trim($itemName));

        // 1. Try exact match first (Case-insensitive)
        $exactMatch = $team->inventoryItems()
            ->whereRaw('LOWER(name) = ?', [$itemName])
            ->first();

        if ($exactMatch) {
            return $exactMatch;
        }

        // 2. Try LIKE match
        $likeMatch = $team->inventoryItems()
            ->whereRaw('LOWER(name) LIKE ?', ["%{$itemName}%"])
            ->first();

        if ($likeMatch) {
            return $likeMatch;
        }

        // 3. Try reverse LIKE (if database item name is inside user input)
        $reverseLikeMatch = $team->inventoryItems()
            ->whereRaw('? LIKE CONCAT(\'%\', LOWER(name), \'%\')', [$itemName])
            ->first();

        if ($reverseLikeMatch) {
            return $reverseLikeMatch;
        }

        // 4. PHP Fuzzy Match (Levenshtein) for typos like "singong" vs "singkong"
        $allItems = $team->inventoryItems()->select('id', 'name')->get();
        $bestMatch = null;
        $shortestDistance = -1;

        foreach ($allItems as $item) {
            $distance = levenshtein($itemName, strtolower($item->name));

            // Allow up to 3 character difference for a match
            if ($distance <= 3 && ($shortestDistance === -1 || $distance < $shortestDistance)) {
                $bestMatch = $item;
                $shortestDistance = $distance;
            }
        }

        if ($bestMatch) {
            return $team->inventoryItems()->find($bestMatch->id);
        }

        return null;
    }

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

        $currentExpense = (float) $team->transactions()
            ->where('type', 'expense')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');

        $prevIncome = (float) $team->transactions()
            ->where('type', 'income')
            ->whereBetween('created_at', [$prevStart, $prevEnd])
            ->sum('amount');

        $growth = $prevIncome > 0 ? (($currentIncome - $prevIncome) / $prevIncome) * 100 : 0;
        $profit = $currentIncome - $currentExpense;
        $margin = $currentIncome > 0 ? ($profit / $currentIncome) * 100 : 0;

        // Calculate current liquidity (Cash on Hand)
        $cashOnHand = $this->getCurrentBalance($team);

        return [
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
                'label' => $start->translatedFormat('F Y'),
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
                'expense' => $currentExpense,
                'profit' => $profit,
                'net_margin_percent' => round($margin, 2),
                'cash_on_hand' => $cashOnHand,
                'transaction_count' => $team->transactions()
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

    /**
     * Analyze recent sales trend (last 7 days vs previous 7 days)
     */
    public function getRecentTrendAdvice(Team $team, ?string $itemName): ?string
    {
        if (! $itemName) {
            return null;
        }

        $last7Days = $team->transactions()
            ->where('type', 'income')
            ->where('is_business', true)
            ->where(DB::raw('LOWER(item_name)'), 'like', '%'.strtolower($itemName).'%')
            ->whereBetween('created_at', [now()->subDays(7), now()])
            ->count();

        $prev7Days = $team->transactions()
            ->where('type', 'income')
            ->where('is_business', true)
            ->where(DB::raw('LOWER(item_name)'), 'like', '%'.strtolower($itemName).'%')
            ->whereBetween('created_at', [now()->subDays(14), now()->subDays(8)])
            ->count();

        if ($last7Days > $prev7Days) {
            $growth = $prev7Days > 0 ? round((($last7Days / $prev7Days) - 1) * 100) : 100;
            $msg = $prev7Days > 0
                ? "🔥 **Tren Meningkat**: Penjualan $itemName naik $growth% dalam seminggu terakhir."
                : "🔥 **Tren Baru**: $itemName mulai banyak dicari pelanggan minggu ini!";

            return "$msg Stoknya perlu ditambah biar nggak kehabisan rek!";
        }

        return null;
    }

    /**
     * Analyze weekly patterns to see if today/tomorrow is a high volume day for a specific item.
     */
    public function getWeeklyPatternAdvice(Team $team, ?string $itemName): ?string
    {
        if (! $itemName) {
            return null;
        }

        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $dayOfWeekRaw = $isSqlite ? "strftime('%w', created_at)" : 'extract(dow from created_at)';

        $stats = DB::table('transactions')
            ->where('team_id', $team->id)
            ->where('type', 'income')
            ->where('is_business', true)
            ->where(DB::raw('LOWER(item_name)'), 'like', '%'.strtolower($itemName).'%')
            ->where('created_at', '>=', now()->subDays(60))
            ->select(
                DB::raw("$dayOfWeekRaw as dow"),
                DB::raw('COUNT(*) as sales_count')
            )
            ->groupBy('dow')
            ->get();

        if ($stats->isEmpty()) {
            return null;
        }

        $avgSales = $stats->avg('sales_count');
        $tomorrowDow = now()->addDay()->dayOfWeek;
        $tomorrowStats = $stats->firstWhere('dow', $tomorrowDow);

        if ($tomorrowStats && $tomorrowStats->sales_count > ($avgSales * 1.3)) {
            $days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

            return "📅 **Pola Mingguan**: Biasane dino {$days[$tomorrowDow]} iku rame pesenan $itemName. Ojo lali nyiapno bahan luwih akeh ket mau bengi!";
        }

        return null;
    }

    /**
     * Get proactive alerts for upcoming national holidays.
     */
    public function getUpcomingHolidayAlerts(): array
    {
        $holidays = [
            ['date' => '2026-05-24', 'name' => 'Hari Raya Idul Adha', 'advice' => 'Stok daging dan bumbu sate biasanya naik drastis!'],
            ['date' => '2026-06-01', 'name' => 'Hari Lahir Pancasila', 'advice' => 'Libur panjang, biasanya pesanan kuliner meningkat.'],
            ['date' => '2026-08-17', 'name' => 'Hari Kemerdekaan RI', 'advice' => 'Banyak lomba dan hajatan, pesanan nasi kotak biasanya melonjak.'],
        ];

        $alerts = [];
        foreach ($holidays as $h) {
            $daysTo = now()->diffInDays(Carbon::parse($h['date']), false);
            if ($daysTo >= 0 && $daysTo <= 10) {
                $alerts[] = [
                    'name' => $h['name'],
                    'days_to' => $daysTo,
                    'advice' => $h['advice'],
                    'message' => "H-{$daysTo} {$h['name']}: {$h['advice']}",
                ];
            }
        }

        return $alerts;
    }

    /**
     * Analyze if the current stock + proposed purchase is enough for average weekly consumption.
     */
    public function getConsumptionAdvice(Team $team, ?string $itemName, float $proposedQty = 0): ?string
    {
        if (! $itemName) {
            return null;
        }

        // Cari barang dengan pencocokan lebih fleksibel (paling mendekati)
        $inventoryItem = $team->inventoryItems()
            ->where(function ($query) use ($itemName) {
                $query->whereRaw('LOWER(name) LIKE ?', ['%'.strtolower($itemName).'%'])
                    ->orWhereRaw('? LIKE LOWER(\'%\' || name || \'%\')', [strtolower($itemName)]);
            })
            ->first();

        if (! $inventoryItem) {
            return null;
        }

        $currentStock = (float) $inventoryItem->batches()->sum('qty');
        $totalStockAfterBuy = $currentStock + $proposedQty;

        // Hitung rata-rata penjualan mingguan (data 30 hari terakhir)
        $salesLast30Days = $team->transactions()
            ->where('type', 'income')
            ->where('is_business', true)
            ->where(function ($query) use ($itemName, $inventoryItem) {
                $query->whereRaw('LOWER(item_name) LIKE ?', ['%'.strtolower($itemName).'%'])
                    ->orWhere('item_name', $inventoryItem->name);
            })
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        // LOGIKA: Jika belum ada data penjualan, minimal sarankan beli sampai di atas threshold
        if ($salesLast30Days === 0) {
            $minSafe = max($inventoryItem->low_stock_threshold, 5); // Default minimal 5 jika threshold 0
            if ($totalStockAfterBuy < $minSafe) {
                $suggested = $minSafe - $totalStockAfterBuy;

                return "💡 **Saran Stok**: Barang baru ini belum ada riwayat penjualan. Tapi stokmu cuma {$totalStockAfterBuy}, mending stok sisan {$minSafe} biar aman!";
            }

            return null;
        }

        $avgWeeklySales = ($salesLast30Days / 30) * 7;
        // Berikan saran jika stok setelah beli < kebutuhan 1.5 minggu (agar ada cadangan)
        $targetStock = ceil($avgWeeklySales * 1.5);

        if ($totalStockAfterBuy < $targetStock) {
            $needed = $targetStock - $totalStockAfterBuy;

            return '💡 **Saran Presisi**: Biasanya kamu butuh sekitar '.ceil($avgWeeklySales)." {$inventoryItem->unit} per minggu. Stokmu saiki cuma {$totalStockAfterBuy}. Disarankan tambah {$needed} {$inventoryItem->unit} lagi biar aman seminggu ke depan.";
        }

        return null;
    }

    /**
     * Calculate the current liquidity of a team.
     */
    /**
     * Detect if the current purchase price is higher than historical average.
     */
    public function detectPriceHikeAlert(Team $team, string $itemName, float $currentPrice): ?string
    {
        // Langsung cari rata-rata COGS (harga modal per unit) dari batch sebelumnya
        $avgPrice = $team->inventoryBatches()
            ->where('item_name', $itemName)
            ->where('created_at', '>=', now()->subMonths(3))
            ->avg('cogs');

        if (! $avgPrice) {
            return null;
        }

        $avgPrice = (float) $avgPrice;

        if ($avgPrice > 0 && $currentPrice > ($avgPrice * 1.1)) {
            $increase = (($currentPrice - $avgPrice) / $avgPrice) * 100;

            return sprintf(
                '⚠️ **Margin Alert**: Harga satuan "%s" mundak %.1f%% dibanding biasane (saiki Rp %s, biasane Rp %s). Marginmu dadi tipis, opo rego jual perlu disesuaikan?',
                $itemName,
                $increase,
                number_format($currentPrice, 0, ',', '.'),
                number_format($avgPrice, 0, ',', '.')
            );
        }

        return null;
    }

    /**
     * Analyze weekly patterns to predict busy days.
     */
    public function getWeeklyPatternInsights(Team $team): array
    {
        $data = $team->transactions()
            ->where('created_at', '>=', now()->subDays(28))
            ->select(
                DB::raw('EXTRACT(DOW FROM created_at) as dow'),
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('COUNT(*) as count'),
                'type'
            )
            ->groupBy('dow', 'type')
            ->get();

        $days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        $busyDays = [];

        foreach ($data as $row) {
            // If revenue on this day of week is 30% higher than average daily revenue
            $avgDaily = $team->transactions()
                ->where('type', $row->type)
                ->where('created_at', '>=', now()->subDays(28))
                ->sum('amount') / 28;

            if ($row->total_amount > ($avgDaily * 1.3)) {
                $busyDays[] = [
                    'day' => $days[$row->dow],
                    'type' => $row->type,
                    'is_today' => now()->dayOfWeek == $row->dow,
                    'is_tomorrow' => now()->addDay()->dayOfWeek == $row->dow,
                ];
            }
        }

        return $busyDays;
    }

    public function getCurrentBalance(Team $team): float
    {
        $income = (float) $team->transactions()->where('type', 'income')->sum('amount');
        $expense = (float) $team->transactions()->where('type', 'expense')->sum('amount');

        return (float) ($team->opening_balance ?? 0) + $income - $expense;
    }
}

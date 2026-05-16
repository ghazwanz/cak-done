<?php

namespace App\Services\Ai;

use App\Models\InventoryItem;
use App\Models\Team;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AggregatorService
{
    /**
     * Centralized holiday database for consistent date resolution.
     */
    private function getHolidayDatabase(): array
    {
        return [
            'Idul Fitri' => [
                '2024' => '2024-04-10',
                '2025' => '2025-03-31',
                '2026' => '2026-03-20',
                '2027' => '2027-03-09',
                'keywords' => ['lebaran', 'idul fitri', 'ied', 'mudik'],
                'advice' => 'Puncak belanja tahunan! Pastikan stok melimpah dan cashflow terjaga.',
            ],
            'Idul Adha' => [
                '2024' => '2024-06-17',
                '2025' => '2025-06-07',
                '2026' => '2026-05-27',
                '2027' => '2027-06-08',
                'keywords' => ['idul adha', 'kurban', 'qurban', 'haji'],
                'advice' => 'Siapkan stok daging dan bumbu dapur, biasanya pesanan melonjak!',
            ],
            'Tahun Baru' => [
                'pattern' => '-01-01',
                'keywords' => ['tahun baru', 'new year', 'masehi'],
                'advice' => 'Awal tahun, potensi peningkatan belanja rumah tangga.',
            ],
            '17 Agustus' => [
                'pattern' => '-08-17',
                'keywords' => ['kemerdekaan', 'agustusan', '17 agustus'],
                'advice' => 'Banyak event & lomba, pesanan nasi kotak/snack biasanya ramai.',
            ],
            'Hari Lahir Pancasila' => [
                'pattern' => '-06-01',
                'keywords' => ['pancasila', 'lahir pancasila'],
                'advice' => 'Libur nasional, potensi pelanggan lokal meningkat.',
            ],
            'Natal' => [
                'pattern' => '-12-25',
                'keywords' => ['natal', 'christmas'],
                'advice' => 'Musim liburan, pastikan stok bahan baku aman untuk akhir tahun.',
            ],
        ];
    }

    /**
     * Resolve a holiday name and year into a specific date range for analysis.
     * Usually 7 days before to 2 days after the holiday.
     */
    public function resolveHolidayRange(string $query): ?array
    {
        $lowerQuery = strtolower($query);
        $year = null;

        // Detect Year
        if (str_contains($lowerQuery, 'tahun lalu') || str_contains($lowerQuery, 'tahun wingi') || str_contains($lowerQuery, 'wingi')) {
            $year = now()->year - 1;
        } elseif (preg_match('/\b(20\d{2})\b/', $query, $matches)) {
            $year = (int) $matches[1];
        }

        // Holiday Mappings
        $holidays = $this->getHolidayDatabase();

        foreach ($holidays as $name => $config) {
            foreach ($config['keywords'] as $keyword) {
                if (str_contains($lowerQuery, $keyword)) {
                    // If no year specified, decide between this year and last year
                    if ($year === null) {
                        $thisYearStr = $config[now()->year] ?? (now()->year.($config['pattern'] ?? ''));
                        $thisYearDate = Carbon::parse($thisYearStr);

                        // If it's more than 3 days in the future, and we are asking for history/stats, use last year
                        if ($thisYearDate->isFuture() && $thisYearDate->diffInDays(now()) > 3) {
                            $year = now()->year - 1;
                        } else {
                            $year = now()->year;
                        }
                    }

                    $dateStr = $config[$year] ?? ($year.($config['pattern'] ?? ''));

                    if (! str_contains($dateStr, '-')) {
                        continue;
                    }

                    $holidayDate = Carbon::parse($dateStr);

                    return [
                        'start' => $holidayDate->copy()->subDays(7)->toDateString(),
                        'end' => $holidayDate->copy()->addDays(2)->toDateString(),
                        'label' => "$name $year",
                    ];
                }
            }
        }

        return null;
    }

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
            ->where('is_business', true)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');

        $currentExpense = (float) $team->transactions()
            ->where('type', 'expense')
            ->where('is_business', true)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');

        $prevIncome = (float) $team->transactions()
            ->where('type', 'income')
            ->where('is_business', true)
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
                    ->where('is_business', true)
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
        $holidays = $this->getHolidayDatabase();

        $upcomingHoliday = null;
        $holidayDate = null;
        $today = now();

        // 1. Try to find a holiday mentioned in the query
        if ($query) {
            $lowerQuery = strtolower($query);
            foreach ($holidays as $name => $config) {
                foreach ($config['keywords'] as $keyword) {
                    if (str_contains($lowerQuery, $keyword)) {
                        $upcomingHoliday = $name;
                        $dateStr = $config[$today->year] ?? ($today->year.($config['pattern'] ?? ''));
                        if (str_contains($dateStr, '-')) {
                            $holidayDate = Carbon::parse($dateStr);
                            if ($holidayDate->isPast() && ! str_contains($dateStr, '12-25')) {
                                $holidayDate = Carbon::parse($config[$today->year + 1] ?? (($today->year + 1).($config['pattern'] ?? '')));
                            }
                        }
                        break 2;
                    }
                }
            }
        }

        // 2. If no specific holiday found, find the next upcoming one
        if (! $upcomingHoliday) {
            $nextDates = [];
            foreach ($holidays as $name => $config) {
                $dateStr = $config[$today->year] ?? ($today->year.($config['pattern'] ?? ''));
                if (str_contains($dateStr, '-')) {
                    $d = Carbon::parse($dateStr);
                    if ($d->isFuture()) {
                        $nextDates[] = ['name' => $name, 'date' => $d];
                    } else {
                        $nextYearDateStr = $config[$today->year + 1] ?? (($today->year + 1).($config['pattern'] ?? ''));
                        $nextDates[] = ['name' => $name, 'date' => Carbon::parse($nextYearDateStr)];
                    }
                }
            }
            usort($nextDates, fn ($a, $b) => $a['date']->timestamp <=> $b['date']->timestamp);
            if (! empty($nextDates)) {
                $upcomingHoliday = $nextDates[0]['name'];
                $holidayDate = $nextDates[0]['date'];
            }
        }

        if (! $upcomingHoliday) {
            return null;
        }

        // Determine if it was Hijri to use the 11-day shift for historical comparison
        $isHijri = in_array($upcomingHoliday, ['Idul Fitri', 'Idul Adha']);
        $lastYearHoliday = $isHijri ? $holidayDate->copy()->subYear()->addDays(11) : $holidayDate->copy()->subYear();
        $startHist = $lastYearHoliday->copy()->subDays(7);
        $endHist = $lastYearHoliday->copy()->addDays(2);

        $historicalSales = collect(DB::select("
            SELECT item_name, SUM(amount) as revenue, COUNT(*) as qty_sold
            FROM transactions
            WHERE team_id = ? 
              AND type = 'income' 
              AND is_business = true
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
            ->where('is_business', true)
            ->whereBetween('created_at', [now()->subDays(30), now()])
            ->sum('amount');

        $lastYear30DaysIncome = $team->transactions()
            ->where('type', 'income')
            ->where('is_business', true)
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
    public function getUpcomingHolidayAlerts(Team $team): array
    {
        $holidays = $this->getHolidayDatabase();
        $alerts = [];
        $today = now();

        foreach ($holidays as $name => $config) {
            $dateStr = $config[$today->year] ?? ($today->year.($config['pattern'] ?? ''));
            if (! str_contains($dateStr, '-')) {
                continue;
            }

            $holidayDate = Carbon::parse($dateStr);
            if ($holidayDate->isPast() && ! str_contains($dateStr, '12-25')) {
                $holidayDate = Carbon::parse($config[$today->year + 1] ?? (($today->year + 1).($config['pattern'] ?? '')));
            }

            $daysTo = ceil($today->diffInDays($holidayDate, false));

            // Show alert if holiday is in the next 15 days
            if ($daysTo >= 0 && $daysTo <= 15) {
                // FETCH DATA ASLI TOKO UNTUK SARAN NON-HALU
                $isHijri = in_array($name, ['Idul Fitri', 'Idul Adha']);
                $lastYearHoliday = $isHijri ? $holidayDate->copy()->subYear()->addDays(11) : $holidayDate->copy()->subYear();
                $startHist = $lastYearHoliday->copy()->subDays(7)->toDateTimeString();
                $endHist = $lastYearHoliday->copy()->addDays(2)->toDateTimeString();

                $topItems = DB::table('transactions')
                    ->where('team_id', $team->id)
                    ->where('type', 'income')
                    ->where('is_business', true)
                    ->whereBetween('created_at', [$startHist, $endHist])
                    ->select('item_name', DB::raw('COUNT(*) as qty'))
                    ->groupBy('item_name')
                    ->orderByDesc('qty')
                    ->limit(2)
                    ->get();

                $dataAdvice = '';
                if ($topItems->isNotEmpty()) {
                    $itemsStr = $topItems->map(fn ($i) => "{$i->item_name} ({$i->qty}x)")->implode(', ');
                    $dataAdvice = "Berdasarkan data tahun lalu, barang paling laku pas momen ini adalah {$itemsStr}. Siapkan stok lebih banyak rek!";
                } else {
                    $dataAdvice = $config['advice'] ?? '';
                }

                $alerts[] = [
                    'name' => $name,
                    'days_to' => $daysTo,
                    'advice' => $dataAdvice,
                    'message' => "H-{$daysTo} {$name}: {$dataAdvice}",
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
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $dayOfWeekRaw = $isSqlite ? "strftime('%w', created_at)" : 'extract(dow from created_at)';

        $data = $team->transactions()
            ->where('is_business', true)
            ->where('created_at', '>=', now()->subDays(28))
            ->select(
                DB::raw("$dayOfWeekRaw as dow"),
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('COUNT(*) as count'),
                'type'
            )
            ->groupBy('dow', 'type')
            ->get();

        $days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        $busyDays = [];

        foreach ($data as $row) {
            // Focus only on income spikes for business anticipation
            if ($row->type !== 'income') {
                continue;
            }

            // If revenue on this day of week is 30% higher than average daily revenue
            $avgDaily = $team->transactions()
                ->where('type', 'income')
                ->where('created_at', '>=', now()->subDays(28))
                ->sum('amount') / 28;

            if ($row->total_amount > ($avgDaily * 1.3)) {
                $spikePercent = round((($row->total_amount / $avgDaily) - 1) * 100);
                $dayName = $days[$row->dow];

                // Use day as key to ensure uniqueness
                $busyDays[$dayName] = [
                    'day' => $dayName,
                    'type' => $row->type,
                    'is_today' => now()->dayOfWeek == $row->dow,
                    'is_tomorrow' => now()->addDay()->dayOfWeek == $row->dow,
                    'message' => "Berdasarkan data 4 minggu terakhir, hari {$dayName} biasanya ada lonjakan omzet sekitar {$spikePercent}% dibanding hari biasa. Siap-siap rek!",
                ];
            }
        }

        return array_values($busyDays);
    }

    public function getCurrentBalance(Team $team): float
    {
        $income = (float) $team->transactions()->where('type', 'income')->sum('amount');
        $expense = (float) $team->transactions()->where('type', 'expense')->sum('amount');

        return (float) ($team->opening_balance ?? 0) + $income - $expense;
    }

    /**
     * Get emergency report for freezer/chiller failures.
     */
    public function getEmergencyViabilityReport(Team $team): array
    {
        $atRiskItems = $team->inventoryItems()
            ->whereIn('storage_type', ['freezer', 'chiller'])
            ->with(['batches' => function ($query) {
                $query->where('qty', '>', 0);
            }])
            ->get();

        $report = [
            'critical' => [], // Must use/sell in < 2 hours (Frozen meat, dairy)
            'urgent' => [],   // Must use/sell in < 4 hours (Vegetables, cooked food)
            'sturdy' => [],   // Can last 6-8 hours if unopened (Condiments, some fruits)
        ];

        foreach ($atRiskItems as $item) {
            $totalQty = $item->batches->sum('qty');
            if ($totalQty <= 0) {
                continue;
            }

            $data = [
                'name' => $item->name,
                'qty' => $totalQty,
                'unit' => $item->unit,
                'storage' => $item->storage_type,
            ];

            // Heuristic for risk categorization using name and category
            $category = strtolower($item->category ?? '');
            $name = strtolower($item->name);
            $combined = "$category $name";

            if ($item->storage_type === 'freezer') {
                // High risk frozen items
                if (preg_match('/(daging|ikan|ayam|sapi|kambing|seafood|frozen|ice cream|es krim|nugget|sosis)/i', $combined)) {
                    $report['critical'][] = $data;
                } else {
                    $report['urgent'][] = $data;
                }
            } else { // Chiller
                // High risk chilled items
                if (preg_match('/(susu|dairy|keju|telur|sayur|buah|salad|masakan|matang)/i', $combined)) {
                    $report['urgent'][] = $data;
                } else {
                    $report['sturdy'][] = $data;
                }
            }
        }

        return $report;
    }
}

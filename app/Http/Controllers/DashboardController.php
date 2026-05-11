<?php

namespace App\Http\Controllers;

use App\Services\Ai\AggregatorService;
use App\Services\CashFlowPredictor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, CashFlowPredictor $predictor, AggregatorService $aggregator): Response
    {
        $team = $request->user()->currentTeam;
        $period = $request->query('period', '7_days');

        $currentBalance = $aggregator->calculateTeamBalance($team);

        // Fetch historical cash flow instead of just predictions
        $historicalCashFlow = $aggregator->getHistoricalCashFlow($team, $period);

        $inventoryHealth = $aggregator->getInventoryHealth($team);

        $recentTransactions = $team->transactions()
            ->latest()
            ->limit(5)
            ->get();

        $thisMonth = $aggregator->getFinancialSummary(
            $team,
            now()->startOfMonth()->toDateTimeString(),
            now()->endOfDay()->toDateTimeString()
        );

        $proactiveAlerts = array_merge(
            $aggregator->getUpcomingHolidayAlerts(),
            $aggregator->getWeeklyPatternInsights($team)
        );

        $latestBriefing = DB::table('ai_insights')
            ->where('team_id', $team->id)
            ->where('type', 'daily_summary')
            ->latest()
            ->first();

        return Inertia::render('dashboard', [
            'currentBalance' => $currentBalance,
            'historicalCashFlow' => $historicalCashFlow,
            'period' => $period,
            'teamSlug' => $team->slug,
            'latestBriefing' => $latestBriefing ? $latestBriefing->reasoning : null,
            'proactiveAlerts' => $proactiveAlerts,
            'watchdog' => [
                'lowStockCount' => $inventoryHealth['nearing_expiry'] ?? 0,
                'expiredCount' => $inventoryHealth['expired'] ?? 0,
                'alerts' => array_slice(array_merge(
                    $inventoryHealth['nearing_expiry_details'] ?? [],
                    $inventoryHealth['expired_details'] ?? []
                ), 0, 3),
            ],
            'recentTransactions' => $recentTransactions,
            'monthlyTotals' => $thisMonth['totals'],
        ]);
    }
}

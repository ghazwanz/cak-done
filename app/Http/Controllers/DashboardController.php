<?php

namespace App\Http\Controllers;

use App\Services\CashFlowPredictor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, CashFlowPredictor $predictor): Response
    {
        $team = $request->user()->currentTeam;

        $currentBalance = $predictor->getCurrentBalance($team);
        $forecast7Days = $predictor->getForecastData($team, 7);
        $forecast30Days = $predictor->getForecastData($team, 30);

        return Inertia::render('dashboard', [
            'currentBalance' => $currentBalance,
            'forecast7Days' => $forecast7Days,
            'forecast30Days' => $forecast30Days,
            'teamSlug' => $team->slug,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function generateCashflow(Request $request)
    {
        $team = $request->user()->currentTeam;

        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))
            : Carbon::now()->startOfMonth();

        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))
            : Carbon::now()->endOfMonth();

        // Calculate operating income/expenses for the period
        $operatingIncome = $team->transactions()
            ->business()
            ->income()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');

        $operatingExpense = $team->transactions()
            ->business()
            ->expense()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');

        $netOperatingCash = $operatingIncome - $operatingExpense;

        // Calculate starting balance (all transactions before start date)
        $pastIncome = $team->transactions()
            ->business()
            ->income()
            ->where('created_at', '<', $startDate)
            ->sum('amount');

        $pastExpense = $team->transactions()
            ->business()
            ->expense()
            ->where('created_at', '<', $startDate)
            ->sum('amount');

        $startingBalance = $pastIncome - $pastExpense;

        $pdf = Pdf::loadView('reports.cashflow', compact(
            'team',
            'startDate',
            'endDate',
            'operatingIncome',
            'operatingExpense',
            'netOperatingCash',
            'startingBalance'
        ));

        return $pdf->download('Laporan_Arus_Kas_'.$team->slug.'.pdf');
    }
}

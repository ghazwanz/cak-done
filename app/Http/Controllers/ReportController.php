<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

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

        // Calculate starting balance (opening balance + all transactions before start date)
        $pastIncome = (float) $team->transactions()
            ->business()
            ->income()
            ->where('created_at', '<', $startDate)
            ->sum('amount');

        $pastExpense = (float) $team->transactions()
            ->business()
            ->expense()
            ->where('created_at', '<', $startDate)
            ->sum('amount');

        $startingBalance = (float) ($team->opening_balance ?? 0) + $pastIncome - $pastExpense;

        $data = [
            'startDate' => $startDate->toDateString(),
            'endDate' => $endDate->toDateString(),
            'operatingIncome' => (float) $operatingIncome,
            'operatingExpense' => (float) $operatingExpense,
            'netOperatingCash' => (float) $netOperatingCash,
            'startingBalance' => (float) $startingBalance,
            'endingBalance' => (float) ($startingBalance + $netOperatingCash),
            'team' => $team,
        ];

        if ($request->has('pdf')) {
            // Ensure dates are objects for the PDF view
            $pdfData = array_merge($data, [
                'startDate' => $startDate,
                'endDate' => $endDate,
            ]);
            
            $pdf = Pdf::loadView('reports.cashflow', $pdfData);

            return $pdf->download('Laporan_Arus_Kas_'.$team->slug.'.pdf');
        }

        return Inertia::render('reports/cashflow', $data);
    }
}

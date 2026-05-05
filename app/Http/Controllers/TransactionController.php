<?php

namespace App\Http\Controllers;

use App\Contracts\AiProvider;
use App\Models\Team;
use App\Models\Transaction;
use App\Services\CashFlowPredictor;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function __construct(
        protected AiProvider $ai,
        protected TransactionService $transactionService,
        protected CashFlowPredictor $cashFlowPredictor
    ) {}

    /**
     * Display a listing of transactions.
     */
    public function index(Request $request, Team $current_team): Response
    {
        return Inertia::render('transactions/index', [
            'transactions' => $this->transactionService->getTransactionsOrderedByDate($current_team),
        ]);
    }

    /**
     * Parse the multimodal input using AI.
     */
    public function parse(Request $request, Team $current_team)
    {
        $request->validate([
            'text' => 'nullable|string',
            'audio' => 'nullable|file|mimes:mp3,wav,m4a,ogg',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,webp',
        ]);

        // Note: For audio and image, you would normally store them temporarily
        // and pass the path to the AI provider.
        $audioPath = $request->file('audio')?->getRealPath();
        $imagePath = $request->file('image')?->getRealPath();

        try {
            $parsedData = $this->ai->parseTransaction(
                text: $request->input('text'),
                audioPath: $audioPath,
                imagePath: $imagePath
            );

            $liquidityWarning = null;
            if ($parsedData['type'] === 'expense' && isset($parsedData['items'])) {
                $totalExpense = collect($parsedData['items'])->sum('amount');
                if ($this->cashFlowPredictor->wouldCauseLiquidityCrisis($current_team, $totalExpense)) {
                    $liquidityWarning = 'Peringatan: Pengeluaran ini (Rp '.number_format($totalExpense, 0, ',', '.').') dapat mengganggu likuiditas dalam 7 hari ke depan.';
                }
            }

            return response()->json([
                'success' => true,
                'data' => $parsedData,
                'liquidity_warning' => $liquidityWarning,
                'raw_input' => $request->input('text') ?? 'Multimodal Input',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to parse transaction: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Store the confirmed transaction.
     */
    public function store(Request $request, Team $current_team)
    {
        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'amount' => 'required|integer|min:0',
            'type' => 'required|in:income,expense',
            'category' => 'required|string',
            'is_business' => 'required|boolean',
            'raw_input' => 'nullable|string',
        ]);

        $this->transactionService->createTransaction(
            team: $current_team,
            userId: Auth::id(),
            validated: $validated,
            inventory: $request->input('inventory')
        );

        return redirect()->back()->with('success', 'Transaksi berhasil disimpan!');
    }
}

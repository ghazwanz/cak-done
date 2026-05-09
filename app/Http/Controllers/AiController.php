<?php

namespace App\Http\Controllers;

use App\Contracts\AiProvider;
use App\Models\Team;
use App\Services\Ai\AggregatorService;
use App\Services\CashFlowPredictor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AiController extends Controller
{
    public function __construct(
        protected AiProvider $ai,
        protected AggregatorService $aggregator,
        protected CashFlowPredictor $cashFlowPredictor
    ) {}

    public function catat(Team $current_team)
    {
        $history = DB::table('ai_insights')
            ->where('team_id', $current_team->id)
            ->where('type', 'chat_history')
            ->first();

        return Inertia::render('catat/index', [
            'recentTransactions' => $current_team->transactions()
                ->latest()
                ->take(5)
                ->get(),
            'lowStockItems' => $current_team->inventoryItems()
                ->withSum('batches', 'qty')
                ->whereRaw('(SELECT COALESCE(SUM(qty), 0) FROM inventory_batches WHERE inventory_item_id = inventory_items.id) <= low_stock_threshold')
                ->take(5)
                ->get(),
            'initialChatHistory' => $history ? json_decode($history->data, true) : [],
        ]);
    }

    public function saveChatHistory(Request $request, Team $current_team)
    {
        $messages = $request->input('messages', []);

        DB::table('ai_insights')->updateOrInsert(
            ['team_id' => $current_team->id, 'type' => 'chat_history'],
            [
                'data' => json_encode($messages),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return response()->json(['success' => true]);
    }

    public function clearChatHistory(Team $current_team)
    {
        DB::table('ai_insights')
            ->where('team_id', $current_team->id)
            ->where('type', 'chat_history')
            ->delete();

        return back();
    }

    /**
     * Dual-Intent Engine: Decides whether to RECORD a transaction or QUERY insights.
     */
    public function process(Request $request, Team $current_team)
    {
        $request->validate([
            'text' => 'nullable|string',
            'audio' => 'nullable|file|mimes:wav,mp3,m4a,ogg,webm',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,webp',
            'intent_context' => 'nullable|string|in:smart_entry,dashboard,catat',
        ]);

        $text = $request->input('text');
        $audio = $request->file('audio');
        $image = $request->file('image');
        $context = $request->input('intent_context', 'dashboard');

        // If nothing is provided, return error early
        if (! $text && ! $audio && ! $image) {
            return response()->json([
                'success' => false,
                'message' => 'Input kosong rek. Coba ngomong atau ketik sesuatu.',
            ], 422);
        }

        // 1. First, check if simple prompt (Smart Entry) -> Always RECORD
        if ($context === 'smart_entry') {
            return $this->handleRecordIntent($current_team, $text, $audio, $image);
        }

        // 2. Hybrid Page (Dashboard / CATAT): Determine Intent via Classifier or Keyword
        $isQuery = $text ? $this->detectInquiryIntent($text) : false;

        if ($isQuery) {
            return $this->handleQueryIntent($text, $current_team);
        }

        return $this->handleRecordIntent($current_team, $text, $audio, $image);
    }

    protected function handleRecordIntent(Team $team, ?string $text = null, $audio = null, $image = null)
    {
        Log::debug('AiController handleRecordIntent', [
            'has_text' => ! empty($text),
            'has_audio' => ! empty($audio),
            'has_image' => ! empty($image),
        ]);

        $audioPath = $audio ? $audio->store('ai/audio') : null;
        $imagePath = $image ? $image->store('ai/images') : null;

        try {
            $parsed = $this->ai->parseTransaction(
                $text,
                $audioPath ? Storage::path($audioPath) : null,
                $imagePath ? Storage::path($imagePath) : null
            );

            if (isset($parsed['out_of_context']) && $parsed['out_of_context'] === true) {
                return response()->json([
                    'intent' => 'OOC',
                    'success' => true,
                    'message' => 'Sepurane rek, aku iki mung asisten ngurus keuangan ambek stok tokomu tok. Lek soal liyane iku aku ga paham.',
                    'data' => null,
                ]);
            }

            // Liquidity Warning Check
            $liquidityWarning = null;
            if ($parsed['type'] === 'expense' && isset($parsed['items'])) {
                $totalExpense = collect($parsed['items'])->sum('amount');
                if ($this->cashFlowPredictor->wouldCauseLiquidityCrisis($team, $totalExpense)) {
                    $liquidityWarning = 'Peringatan: Pengeluaran ini (Rp '.number_format($totalExpense, 0, ',', '.').') dapat mengganggu likuiditas dalam 7 hari ke depan. Pastikan ketersediaan dana.';
                }
            }

            // Visual stock info for Smart Entry (Workflow 2 point 4)
            $inventoryInfo = null;
            $suggestedPrice = null;

            $itemName = $parsed['item_name'] ?? null;
            $inventoryItem = null;

            if ($itemName) {
                $inventoryItem = $team->inventoryItems()
                    ->where(DB::raw('LOWER(name)'), 'like', '%'.strtolower($itemName).'%')
                    ->with(['batches' => fn ($q) => $q->where('qty', '>', 0)->orderBy('expiry_date', 'asc')])
                    ->first();
            }

            if ($inventoryItem) {
                $totalQty = (int) $inventoryItem->batches->sum('qty');
                $inventoryInfo = [
                    'item_id' => $inventoryItem->id,
                    'current_qty' => $totalQty,
                    'unit' => $inventoryItem->unit,
                    'threshold' => $inventoryItem->low_stock_threshold,
                ];

                // Suggest price based on COGS if amount is missing or low
                if ($parsed['type'] === 'income' && empty($parsed['amount'])) {
                    $firstBatch = $inventoryItem->batches->first();
                    $quantityToSell = (float) ($parsed['inventory']['quantity'] ?? 1);

                    if ($firstBatch) {
                        // Default markup 20% from COGS for suggestion if AI forgot price
                        $cogs = (float) ($firstBatch->cogs > 0 ? $firstBatch->cogs : 10000); // Fallback to 10k if COGS is 0
                        $suggestedPrice = round($cogs * $quantityToSell * 1.2);

                        $parsed['amount'] = (int) $suggestedPrice;
                        $parsed['inventory']['quantity'] = $quantityToSell; // Ensure quantity is set for deduction
                        $parsed['transcription'] = ($parsed['transcription'] ?? '').' (Harga disesuaikan otomatis dari modal: Rp '.number_format($parsed['amount'], 0, ',', '.').')';
                    }
                }
            }

            return response()->json([
                'intent' => 'RECORD',
                'success' => true,
                'data' => $parsed,
                'liquidity_warning' => $liquidityWarning,
                'inventory_info' => $inventoryInfo,
                'message' => 'Silakan konfirmasi data transaksi di bawah ini.',
            ]);
        } catch (\Exception $e) {
            Log::error('AI Parsing Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses data rekaman: '.$e->getMessage(),
            ], 500);
        }
    }

    protected function handleQueryIntent(string $text, Team $team)
    {
        // 1. Detect dynamic date range from text (e.g. "Maret", "Bulan lalu")
        $startDate = now()->startOfMonth()->toDateString();
        $endDate = now()->toDateString();

        $months = [
            'januari' => 1, 'februari' => 2, 'maret' => 3, 'april' => 4, 'mei' => 5, 'juni' => 6,
            'juli' => 7, 'agustus' => 8, 'september' => 9, 'oktober' => 10, 'november' => 11, 'desember' => 12,
            'january' => 1, 'february' => 2, 'march' => 3, 'may' => 5, 'june' => 6,
            'july' => 7, 'august' => 8, 'october' => 10, 'december' => 12,
        ];

        $lowerText = strtolower($text);

        // Extract year if present (4 digits)
        $targetYear = now()->year;
        if (preg_match('/\b(20\d{2})\b/', $text, $matches)) {
            $targetYear = (int) $matches[1];
        }

        foreach ($months as $name => $num) {
            if (str_contains($lowerText, $name)) {
                $targetDate = now()->setYear($targetYear)->setMonth($num);

                // If no year specified and month is in future, assume last year
                if (! preg_match('/\b(20\d{2})\b/', $text) && $targetDate->isFuture() && $num > now()->month) {
                    $targetDate->subYear();
                }

                $startDate = $targetDate->startOfMonth()->toDateString();
                $endDate = $targetDate->endOfMonth()->toDateString();
                break;
            }
        }

        if (str_contains($lowerText, 'bulan lalu') || str_contains($lowerText, 'sasi wingi')) {
            $startDate = now()->subMonth()->startOfMonth()->toDateString();
            $endDate = now()->subMonth()->endOfMonth()->toDateString();
        }

        // SQL-First: Get clean aggregates for the detected period
        $summary = $this->aggregator->getFinancialSummary($team, $startDate, $endDate);

        // Add more context for richer AI responses
        $summary['inventory_health'] = $this->aggregator->getInventoryHealth($team);
        $summary['holiday_predictions'] = $this->aggregator->getUpcomingHolidayPredictions($team, $text);

        // Fetch chat history from DB for conversational context
        $historyData = DB::table('ai_insights')
            ->where('team_id', $team->id)
            ->where('type', 'chat_history')
            ->first();

        $history = $historyData ? json_decode($historyData->data, true) : [];

        // Final Narration by AI using provided aggregates and history as context
        $narration = $this->ai->narrateInsights($text, $summary, $history);

        $isRejected = str_starts_with($narration, '[REJECT]');
        if ($isRejected) {
            $narration = trim(str_replace('[REJECT]', '', $narration));
        }

        // Determine if we should show the full summary card
        // Show summary if query contains keywords for detailed data and NOT rejected
        $showSummary = ! $isRejected && (bool) preg_match('/(ringkasan|summary|laporan|semua|performa|statistik|grafik|total|berapa)/i', $text);

        return response()->json([
            'intent' => 'QUERY',
            'success' => true,
            'narration' => $narration,
            'data' => $summary,
            'show_summary' => $showSummary,
        ]);
    }

    protected function detectInquiryIntent(string $text): bool
    {
        // 1. Jika teks diawali dengan kata kerja pencatatan secara eksplisit, ini pasti RECORD.
        if (preg_match('/^(jual|beli|bayar|tambah|kurangi|masuk|keluar)\b/i', trim($text))) {
            return false;
        }

        // 2. Deteksi kata tanya (Indonesia/Suroboyoan) dan istilah analitik/kesehatan stok
        $inquiryPattern = '/\b(apa|opo|berapa|piro|mana|endi|kapan|bagaimana|piye|kenapa|kenopo|mengapa|mengapo|kok|kenapa|mengapa|sebutkan|tampilkan|berikan|info|summary|ringkasan|laporan|statistik|grafik|profit|laba|untung|rugi|kadaluarsa|expired|basi|sisa|stok|paling laku|terlaris|analisis|prediksi)\b/i';

        return (bool) preg_match($inquiryPattern, $text);
    }
}

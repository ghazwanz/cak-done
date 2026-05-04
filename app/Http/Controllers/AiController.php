<?php

namespace App\Http\Controllers;

use App\Contracts\AiProvider;
use App\Models\Team;
use App\Services\Ai\AggregatorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AiController extends Controller
{
    public function __construct(
        protected AiProvider $ai,
        protected AggregatorService $aggregator
    ) {}

    /**
     * Dual-Intent Engine: Decides whether to RECORD a transaction or QUERY insights.
     */
    public function process(Request $request, Team $current_team)
    {
        $request->validate([
            'text' => 'nullable|string',
            'audio' => 'nullable|file|mimes:wav,mp3,m4a,ogg,webm',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,webp',
            'intent_context' => 'nullable|string|in:smart_entry,dashboard',
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
                $audioPath ? storage_path('app/'.$audioPath) : null,
                $imagePath ? storage_path('app/'.$imagePath) : null
            );

            return response()->json([
                'intent' => 'RECORD',
                'success' => true,
                'data' => $parsed,
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
        // SQL-First: Get clean aggregates instead of raw rows
        $summary = $this->aggregator->getFinancialSummary($team, now()->startOfMonth()->toDateString(), now()->toDateString());

        // Final Narration by AI using provided aggregates as context
        $narration = $this->ai->narrateInsights($text, $summary);

        return response()->json([
            'intent' => 'QUERY',
            'success' => true,
            'narration' => $narration,
            'data' => $summary,
        ]);
    }

    protected function detectInquiryIntent(string $text): bool
    {
        $keywords = ['profit', 'laba', 'berapa', 'mana', 'tampilkan', 'info', 'summary', 'ringkasan', 'stok'];
        foreach ($keywords as $word) {
            if (stripos($text, $word) !== false) {
                return true;
            }
        }

        return false;
    }
}

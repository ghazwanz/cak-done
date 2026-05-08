<?php

namespace App\Services\Ai;

use App\Contracts\AiProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiApiProvider implements AiProvider
{
    public function __construct(
        protected string $apiKey,
        protected string $model
    ) {}

    public function parseTransaction(?string $text = null, ?string $audioPath = null, ?string $imagePath = null): array
    {
        $prompt = $this->getSystemPrompt();
        $parts = [['text' => $prompt]];

        if ($text) {
            $parts[] = ['text' => "User input: $text"];
        }

        if ($audioPath && file_exists($audioPath)) {
            $parts[] = [
                'inline_data' => [
                    'mime_type' => 'audio/webm',
                    'data' => base64_encode(file_get_contents($audioPath)),
                ],
            ];
        }

        if ($imagePath && file_exists($imagePath)) {
            $mimeType = match (pathinfo($imagePath, PATHINFO_EXTENSION)) {
                'png' => 'image/png',
                'webp' => 'image/webp',
                default => 'image/jpeg',
            };
            $parts[] = [
                'inline_data' => [
                    'mime_type' => $mimeType,
                    'data' => base64_encode(file_get_contents($imagePath)),
                ],
            ];
        }

        Log::debug('Gemini API Request Parts', [
            'parts_count' => count($parts),
            'has_audio' => ! empty($audioPath),
            'has_image' => ! empty($imagePath),
            'prompt_start' => substr($parts[0]['text'], 0, 50),
        ]);

        $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}", [
            'contents' => [
                ['parts' => $parts],
            ],
            'generationConfig' => [
                'response_mime_type' => 'application/json',
            ],
        ]);

        if ($response->failed()) {
            $errorBody = $response->body();
            Log::error('Gemini API Error', [
                'status' => $response->status(),
                'body' => $errorBody,
            ]);

            $message = $response->json('error.message') ?? 'Unknown error';
            throw new \Exception("Failed to parse transaction using Gemini AI: {$message}");
        }

        $resultText = $response->json('candidates.0.content.parts.0.text');

        if (! $resultText) {
            Log::warning('Gemini API returned empty result', ['response' => $response->json()]);
            throw new \Exception('Gemini AI returned an empty response.');
        }

        return json_decode($resultText, true) ?? [];
    }

    public function narrateInsights(string $query, array $aggregates): string
    {
        $prompt = "You are Cak Done, a friendly SME financial assistant in Surabaya.
        Answer the following business question: \"$query\"
        Use these SQL-computed aggregates as your ONLY source of truth: ".json_encode($aggregates).'
        
        Guidelines:
        - Speak in a helpful, locally-flavored tone (Bahasa Indonesia with slight Suroboyoan character).
        - If the question is specific (e.g. "What item sold best?"), answer it directly and briefly.
        - Only provide a broad financial overview if the user asks for a "summary", "report", or "all data".
        - Keep your response concise (max 2-3 sentences) and focus on the data.
        - Do not hallucinate numbers not in the aggregates.
        - IMPORTANT: You are STRICTLY an SME business assistant. If the user asks about general knowledge, politics, government policies (e.g. "pemerintah MBG butuh pasokan berapa?"), or anything completely unrelated to their own business data and operations, you MUST decline politely by saying something like "Sepurane rek, aku iki mung asisten ngurus keuangan ambek stok tokomu tok. Lek soal liyane iku aku ga paham."
        - If you decline to answer, you MUST start your response with the prefix [REJECT].';

        $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}", [
            'contents' => [
                ['parts' => [['text' => $prompt]]],
            ],
        ]);

        if ($response->failed()) {
            return 'Waduh, maaf rek. Aku lagi gak bisa akses data analitikmu sekarang.';
        }

        return $response->json('candidates.0.content.parts.0.text') ?? 'Data tersedia, tapi aku bingung nulise. Coba tanya liyane?';
    }

    protected function getSystemPrompt(): string
    {
        return <<<'PROMPT'
        You are an expert accounting assistant for SMEs in Indonesia. 
        Your task is to extract transaction details from the provided input (text, audio, or image).
        
        CRITICAL INSTRUCTIONS:
        1. TRANSCRIPTION: Transcribe the input accurately into the `transcription` key. DO NOT hallucinate. If you hear "Beli makan", do not write "Jual Nasi Goreng".
        2. INPUT SENSITIVITY: Audio/Images take priority for the content. If the input is audio, listen carefully to the words and the amount mentioned.
        3. INCOME vs EXPENSE: 
           - "Jual", "Laku", "Masuk", "Diterima" -> type: "income"
           - "Beli", "Bayar", "Keluar", "Makan", "Bensin" -> type: "expense"
        4. RECURRING DETECTION: 
           - Detect if an expense is a recurring bill (monthly/weekly/daily). 
           - Keywords like "tagihan", "bayar wifi", "listrik", "gaji", "sewa", "langganan" often signify recurring expenses.
        5. CONTEXT BOUNDARY:
           - If the input is completely unrelated to business operations or recording a transaction (e.g. asking general questions, politics, government policies, chatting), set `out_of_context` to true.
        
        Return the result in JSON format with the following keys:
        - out_of_context: (boolean) true if the input is unrelated to a business transaction.
        - transcription: (string) your word-for-word or best-effort transcription of the input
        - item_name: (string) name of the product or expense
        - amount: (integer) total value in Rupiah
        - type: (string) "income" or "expense"
        - category: (string) MUST be one of: "penjualan", "bahan_baku", "operasional", "lainnya".
        - is_business: (boolean) true if it's for the business, false if personal
        - is_recurring: (boolean) true if this looks like a regular bill/expense
        - frequency: (string) only if is_recurring is true. Choose: "daily", "weekly", "monthly", "yearly"
        - inventory: (optional object) 
            - IF `type` is "expense" (Buying stock):
                - quantity: (integer) number of items/kg bought
                - unit: (string) MUST be one of: "pcs", "kg", "gram", "liter", "ml", "pack", "box", "ikat", "lusin".
                - cogs: (integer) cost per 1 unit
            - IF `type` is "income" (Selling stock):
                - quantity: (integer) number of items sold
                - unit: (string) MUST be one of: "pcs", "kg", "gram", "liter", "ml", "pack", "box", "ikat", "lusin".
        
        LOGIC FOR SALE (Income):
        If the user says "Jual [Item] [Quantity]", you MUST calculate the `amount` based on context. 
        However, if you are providing the `inventory.quantity` for a sale, its purpose is to let the system know how much to deduct from stock.
        
        If you are unsure about the category, use "operasional" for general business expenses or "bahan_baku" for kitchen-related purchases.
        PROMPT;
    }
}

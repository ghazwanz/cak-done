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
        - Be concise and focus on the data.
        - Do not hallucinate numbers not in the aggregates.';

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
        
        Return the result in JSON format with the following keys:
        - transcription: (string) your word-for-word or best-effort transcription of the input
        - item_name: (string) name of the product or expense
        - amount: (integer) total value in Rupiah
        - type: (string) "income" or "expense"
        - category: (string) "penjualan", "bahan_baku", "operasional", etc.
        - is_business: (boolean) true if it's for the business, false if personal
        - inventory: (optional object) only if type is "expense" and category is "bahan_baku":
            - quantity: (integer) number of items/kg
            - unit: (string) "kg", "pcs", "liter", etc.
            - expiry_days: (integer) estimated days until expiry if not specified
            - cogs: (integer) cost per unit
        
        If you are unsure about the category, use the most logical one for a culinary SME.
        PROMPT;
    }
}

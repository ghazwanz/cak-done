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
        $contents = [];

        $parts = [['text' => $prompt]];

        if ($text) {
            $parts[] = ['text' => "User input: $text"];
        }

        // Note: In real implementation, audio and image need to be base64 encoded or uploaded to Google Cloud Storage
        // For simplicity in this workflow, we prepare the structure.

        Log::debug('Gemini API Request', [
            'model' => $this->model,
            'parts_count' => count($parts),
            'prompt_snippet' => substr($prompt, 0, 100) . '...'
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
        
        if (!$resultText) {
            Log::warning('Gemini API returned empty result', ['response' => $response->json()]);
            throw new \Exception('Gemini AI returned an empty response.');
        }

        return json_decode($resultText, true) ?? [];
    }

    protected function getSystemPrompt(): string
    {
        return <<<'PROMPT'
        You are an expert accounting assistant for SMEs in Indonesia. 
        Your task is to extract transaction details from the provided input (text, audio, or image).
        
        Return the result in JSON format with the following keys:
        - item_name: (string) name of the product or expense
        - amount: (integer) total value in Rupiah
        - type: (string) "income" or "expense"
        - category: (string) "penjualan", "bahan_baku", "operasional", etc.
        - is_business: (boolean) true if it's for the business, false if personal
        - inventory: (optional object) only if type is "expense" and category is "bahan_baku":
            - quantity: (integer) number of items/kg
            - unit: (string) "kg", "pcs", "liter", etc.
            - expiry_days: (integer) estimated days until expiry if not specified (e.g., 3 for meat, 30 for canned)
            - cogs: (integer) cost per unit
        
        If you are unsure about the category, use the most logical one for a culinary SME.
        The currency is always IDR.
        PROMPT;
    }
}

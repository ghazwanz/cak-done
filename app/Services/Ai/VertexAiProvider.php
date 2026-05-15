<?php

namespace App\Services\Ai;

use App\Contracts\AiProvider;
use Google\Auth\Credentials\ServiceAccountCredentials;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VertexAiProvider implements AiProvider
{
    public function __construct(
        protected string $projectId,
        protected string $location,
        protected string $model,
        protected string $apiEndpoint,
        protected string $credentialsPath
    ) {}

    public function parseTransaction(?string $text = null, ?string $audioPath = null, ?string $imagePath = null): array
    {
        // Vertex AI usually requires Google Application Credentials or a manually fetched token
        $token = $this->getAccessToken();

        $url = "{$this->apiEndpoint}/v1/projects/{$this->projectId}/locations/{$this->location}/publishers/google/models/{$this->model}:streamGenerateContent";

        $prompt = $this->getSystemPrompt();
        $parts = [['text' => $prompt]];

        if ($text) {
            $parts[] = ['text' => "User input: $text"];
        }

        $response = Http::withToken($token)->post($url, [
            'contents' => [
                ['role' => 'user', 'parts' => $parts],
            ],
            'generationConfig' => [
                'response_mime_type' => 'application/json',
            ],
        ]);

        if ($response->failed()) {
            Log::error('Vertex AI Error', ['response' => $response->json()]);
            throw new \Exception('Failed to parse transaction using Vertex AI.');
        }

        $result = $response->json('0.candidates.0.content.parts.0.text');

        return $result ? json_decode($result, true) : [];
    }

    public function narrateInsights(string $query, array $aggregates, array $history = []): string
    {
        $token = $this->getAccessToken();
        $url = "{$this->apiEndpoint}/v1/projects/{$this->projectId}/locations/{$this->location}/publishers/google/models/{$this->model}:streamGenerateContent";

        $prompt = 'You are Cak Done, a friendly, savvy SME financial assistant from Surabaya.
        Use these SQL-computed aggregates as your ONLY source of truth: '.json_encode($aggregates).'
        
        Mandatory Guidelines:
        - Speak in a helpful, locally-flavored tone (Bahasa Indonesia with slight Suroboyoan/Jawa character).
        - **UNITS ARE CRITICAL**: When mentioning item quantities, you MUST include their units (e.g., "10 pcs", "5 kg", "2 liter") based on the "unit" field in the data. Never just say the number alone.
        - **Growth Analysis**: Prioritize "performance_trend" data. If income dropped, offer encouragement; if it grew, celebrate with the user.
        - **Holiday Logic**: "holiday_predictions" are FUTURE forecasts. Mention them as predictions.
        - **Accuracy**: Do not hallucinate. If data isn\'t in the aggregates, say you don\'t have it yet.
        - **Concision**: Keep it punchy (3-6 sentences). focus on actionable business advice.
        - **Rejection**: Politely decline non-business topics starting with [REJECT].
        
        User Question: "'.$query.'"';

        $response = Http::withToken($token)->post($url, [
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => $prompt]]],
            ],
        ]);

        if ($response->failed()) {
            Log::error('Vertex AI Narration Error', ['response' => $response->json()]);

            return 'Waduh, maaf rek. Aku lagi gak bisa akses data analitikmu sekarang.';
        }

        return $response->json('0.candidates.0.content.parts.0.text') ?? 'Data tersedia, tapi aku bingung nulise. Coba tanya liyane?';
    }

    protected function getAccessToken(): string
    {
        try {
            $auth = new ServiceAccountCredentials(
                'https://www.googleapis.com/auth/cloud-platform',
                $this->credentialsPath
            );

            return $auth->fetchAuthToken()['access_token'];
        } catch (\Exception $e) {
            Log::error('Failed to fetch Vertex AI access token', [
                'error' => $e->getMessage(),
                'path' => $this->credentialsPath,
            ]);
            throw new \Exception('Vertex AI authentication failed: '.$e->getMessage());
        }
    }

    protected function getSystemPrompt(): string
    {
        return 'You are a professional SME accounting assistant. 
        Your task is to parse unstructured financial inputs (text, audio, or image) into a structured JSON format.
        
        REQUIRED JSON SCHEMA:
        {
          "item_name": "string (the primary item or expense name)",
          "amount": "integer (total money involved)",
          "type": "string (income OR expense)",
          "category": "string (one of: Penjualan, Bahan Baku, Operasional, Kemasan, Lainnya)",
          "is_business": "boolean (true if it relates to SME operations, false for personal stuff)",
          "inventory": {
             "quantity": "float (the count or weight of items, default 1)",
             "unit": "string (pcs, kg, gram, liter, ml, pack, box, ikat, lusin, default pcs)",
             "expiry_days": "integer (estimated shelf life in days, default 0)"
          },
          "transcription": "string (clean transcription of the input)",
          "out_of_context": "boolean (true if input is NOT about finance/SME/inventory, e.g. general chat)"
        }
        
        RULES:
        - If the user says "beli", "belanja", "kulakan", or "pengeluaran", type is "expense".
        - If the user says "jual", "laku", or "pemasukan", type is "income".
        - Be smart with units. "setengah kilo" means quantity 0.5 and unit "kg".
        - If an image is a receipt, extract the items and sum the total amount.
        - If input is general conversation or out of scope, set "out_of_context" to true.';
    }
}

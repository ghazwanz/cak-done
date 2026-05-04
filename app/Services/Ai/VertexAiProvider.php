<?php

namespace App\Services\Ai;

use App\Contracts\AiProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VertexAiProvider implements AiProvider
{
    public function __construct(
        protected string $projectId,
        protected string $bearerToken,
        protected string $location,
        protected string $model,
        protected string $apiEndpoint
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

    public function narrateInsights(string $query, array $aggregates): string
    {
        $token = $this->getAccessToken();
        $url = "{$this->apiEndpoint}/v1/projects/{$this->projectId}/locations/{$this->location}/publishers/google/models/{$this->model}:streamGenerateContent";

        $prompt = "You are Cak Done, a friendly SME financial assistant in Surabaya.
        Answer the following business question: \"$query\"
        Use these SQL-computed aggregates as your ONLY source of truth: ".json_encode($aggregates).'
        
        Guidelines:
        - Speak in a helpful, locally-flavored tone (Bahasa Indonesia with slight Suroboyoan character).
        - Be concise and focus on the data.
        - Do not hallucinate numbers not in the aggregates.';

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
        // In a production environment, you would use Google\Auth\Credentials\ServiceAccountCredentials
        // For now, we expect it from environment or a cached value.
        return $this->bearerToken;
    }

    protected function getSystemPrompt(): string
    {
        return 'You are an accounting assistant. Parse the transaction input into JSON format with keys: item_name, amount, type, category, is_business.';
    }
}

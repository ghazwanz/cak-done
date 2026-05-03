<?php

namespace App\Services\Ai;

use App\Contracts\AiProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VertexAiProvider implements AiProvider
{
    public function __construct(
        protected string $projectId,
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

        // Vertex AI response structure can vary between unary and stream calls
        $result = $response->json('0.candidates.0.content.parts.0.text');

        return $result ? json_decode($result, true) : [];
    }

    protected function getAccessToken(): string
    {
        // In a production environment, you would use Google\Auth\Credentials\ServiceAccountCredentials
        // For now, we expect it from environment or a cached value.
        return env('VERTEX_BEARER_TOKEN', '');
    }

    protected function getSystemPrompt(): string
    {
        return 'You are an accounting assistant. Parse the transaction input into JSON format with keys: item_name, amount, type, category, is_business.';
    }
}

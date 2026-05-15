<?php

namespace App\Services\Ai;

use Illuminate\Support\Manager;

class AiManager extends Manager
{
    /**
     * Get the default driver name.
     */
    public function getDefaultDriver(): string
    {
        // Prioritize Vertex if configured
        if (! empty($this->config->get('ai.providers.vertex.project_id')) && ! empty($this->config->get('ai.providers.vertex.credentials_path'))) {
            return 'vertex';
        }

        // Fallback to Gemini
        if (! empty($this->config->get('ai.providers.gemini.api_key'))) {
            return 'gemini';
        }

        // Default
        return $this->config->get('ai.default', 'gemini');
    }

    /**
     * Create the Gemini driver instance.
     */
    protected function createGeminiDriver(): GeminiApiProvider
    {
        $config = $this->config->get('ai.providers.gemini');

        return new GeminiApiProvider(
            apiKey: $config['api_key'],
            model: $config['model']
        );
    }

    /**
     * Create the Vertex driver instance.
     */
    protected function createVertexDriver(): VertexAiProvider
    {
        $config = $this->config->get('ai.providers.vertex');

        return new VertexAiProvider(
            projectId: $config['project_id'],
            location: $config['location'],
            model: $config['model'],
            apiEndpoint: $config['api_endpoint'],
            credentialsPath: $config['credentials_path']
        );
    }
}

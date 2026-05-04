<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default AI Provider
    |--------------------------------------------------------------------------
    |
    | This value determines the default AI provider used to process multimodal
    | inputs. Supported providers are "vertex" and "gemini".
    |
    */

    'default' => env('AI_PROVIDER', 'gemini'),

    'providers' => [

        'vertex' => [
            'project_id' => env('VERTEX_PROJECT_ID'),
            'location' => env('VERTEX_LOCATION', 'us-central1'),
            'model' => env('VERTEX_MODEL', 'gemini-2.5-flash'),
            'api_endpoint' => env('VERTEX_API_ENDPOINT', 'https://us-central1-aiplatform.googleapis.com'),
        ],

        'gemini' => [
            'api_key' => env('GEMINI_API_KEY'),
            'model' => env('GEMINI_MODEL', 'gemini-2.5-flash'),
        ],

    ],

];

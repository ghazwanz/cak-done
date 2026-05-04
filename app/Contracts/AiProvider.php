<?php

namespace App\Contracts;

interface AiProvider
{
    /**
     * Parse a transaction from multimodal input (text, audio, or image).
     */
    public function parseTransaction(?string $text = null, ?string $audioPath = null, ?string $imagePath = null): array;
}

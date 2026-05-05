<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('ai process handles text and returns record intent', function () {
    $user = User::factory()->create();
    $team = $user->personalTeam();

    $response = $this->actingAs($user)
        ->post("/{$team->slug}/ai/process", [
            'text' => 'Jual bakso 5 porsi',
            'intent_context' => 'smart_entry',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('intent', 'RECORD');
});

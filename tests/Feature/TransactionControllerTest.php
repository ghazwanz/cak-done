<?php

namespace Tests\Feature;

use App\Contracts\AiProvider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

uses(RefreshDatabase::class);

test('user can parse transaction text via AI', function () {
    $user = User::factory()->create();
    $team = $user->personalTeam();

    $this->actingAs($user);

    // Mock AI Provider
    $mockAi = Mockery::mock(AiProvider::class);
    $mockAi->shouldReceive('parseTransaction')
        ->once()
        ->with('beli ayam 5kg', null, null)
        ->andReturn([
            'item_name' => 'Ayam',
            'amount' => 150000,
            'type' => 'expense',
            'category' => 'bahan_baku',
            'is_business' => true,
        ]);

    $this->app->instance(AiProvider::class, $mockAi);

    $response = $this->post(route('transactions.parse', $team->slug), [
        'text' => 'beli ayam 5kg',
    ]);

    $response->assertStatus(200);
    $response->assertJsonPath('data.item_name', 'Ayam');
    $response->assertJsonPath('data.amount', 150000);
});

test('user can store a confirmed transaction', function () {
    $user = User::factory()->create();
    $team = $user->personalTeam();

    $this->actingAs($user);

    $response = $this->post(route('transactions.store', $team->slug), [
        'item_name' => 'Ayam',
        'amount' => 150000,
        'type' => 'expense',
        'category' => 'bahan_baku',
        'is_business' => true,
        'raw_input' => 'beli ayam 5kg',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('transactions', [
        'team_id' => $team->id,
        'item_name' => 'Ayam',
        'amount' => 150000,
    ]);
});

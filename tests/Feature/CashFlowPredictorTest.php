<?php

use App\Models\Team;
use App\Models\Transaction;
use App\Models\RecurringExpense;
use App\Models\User;
use App\Services\CashFlowPredictor;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('calculates current balance correctly', function () {
    $team = Team::factory()->create();
    $predictor = new CashFlowPredictor();

    Transaction::factory()->create(['team_id' => $team->id, 'type' => 'income', 'amount' => 1000000, 'is_business' => true]);
    Transaction::factory()->create(['team_id' => $team->id, 'type' => 'expense', 'amount' => 200000, 'is_business' => true]);
    // Personal shouldn't count
    Transaction::factory()->create(['team_id' => $team->id, 'type' => 'income', 'amount' => 500000, 'is_business' => false]);
    
    $balance = $predictor->getCurrentBalance($team);
    expect($balance)->toBe(800000.0);
});

it('predicts balance accurately factoring in recurring expenses', function () {
    Carbon::setTestNow('2026-05-01 10:00:00');
    
    $team = Team::factory()->create();
    $predictor = new CashFlowPredictor();

    // Initial balance: 2.000.000
    Transaction::factory()->create(['team_id' => $team->id, 'type' => 'income', 'amount' => 2000000, 'is_business' => true]);

    // Recurring expense due tomorrow: 500.000
    RecurringExpense::factory()->create([
        'team_id' => $team->id,
        'name' => 'Sewa Kios',
        'amount' => 500000,
        'next_due_date' => Carbon::now()->addDay(),
        'frequency' => 'daily',
        'is_business' => true,
    ]);

    // Fast forward 3 days prediction (due dates: 2nd, 3rd, 4th -> total 3x500k = 1.500.000)
    $predictedBalance = $predictor->predictBalanceAfterDays($team, 3);
    
    expect($predictedBalance)->toBe(500000.0); // 2M - 1.5M = 500k
});

it('provides correctly structured forecast data', function () {
    Carbon::setTestNow('2026-05-01 10:00:00');
    
    $team = Team::factory()->create();
    $predictor = new CashFlowPredictor();

    // Initial balance: 1.000.000
    Transaction::factory()->create(['team_id' => $team->id, 'type' => 'income', 'amount' => 1000000, 'is_business' => true]);

    // Recurring expense due tomorrow: 200.000
    RecurringExpense::factory()->create([
        'team_id' => $team->id,
        'name' => 'Listrik',
        'amount' => 200000,
        'next_due_date' => Carbon::now()->addDay(),
        'frequency' => 'daily',
        'is_business' => true,
    ]);

    $forecast = $predictor->getForecastData($team, 2);

    expect($forecast)->toHaveCount(3); // Today + Day 1 + Day 2
    
    // Day 0
    expect($forecast[0]['date'])->toBe('2026-05-01')
        ->and($forecast[0]['predicted_balance'])->toBe(1000000.0);
        
    // Day 1
    expect($forecast[1]['date'])->toBe('2026-05-02')
        ->and($forecast[1]['predicted_balance'])->toBe(800000.0);
        
    // Day 2
    expect($forecast[2]['date'])->toBe('2026-05-03')
        ->and($forecast[2]['predicted_balance'])->toBe(600000.0);
});

it('triggers liquidity warning correctly', function () {
    Carbon::setTestNow('2026-05-01 10:00:00');
    
    $team = Team::factory()->create();
    $predictor = new CashFlowPredictor();

    // Initial balance: 500.000
    Transaction::factory()->create(['team_id' => $team->id, 'type' => 'income', 'amount' => 500000, 'is_business' => true]);

    // Future recurring: 300.000 within 7 days
    RecurringExpense::factory()->create([
        'team_id' => $team->id,
        'name' => 'Gaji',
        'amount' => 300000,
        'next_due_date' => Carbon::now()->addDays(2),
        'frequency' => 'monthly',
        'is_business' => true,
    ]);

    // If proposed expense is 100.000 -> 500k - 300k - 100k = +100k (safe)
    $warning1 = $predictor->wouldCauseLiquidityCrisis($team, 100000);
    expect($warning1)->toBeFalse();

    // If proposed expense is 300.000 -> 500k - 300k - 300k = -100k (unsafe)
    $warning2 = $predictor->wouldCauseLiquidityCrisis($team, 300000);
    expect($warning2)->toBeTrue();
});

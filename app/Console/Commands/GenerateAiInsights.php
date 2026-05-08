<?php

namespace App\Console\Commands;

use App\Contracts\AiProvider;
use App\Models\Team;
use App\Services\Ai\AggregatorService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

#[Signature('ai:generate-briefings')]
#[Description('Generate daily strategic AI briefings (Bisikan Strategis) for all teams based on SQL aggregates.')]
class GenerateAiInsights extends Command
{
    public function handle(AggregatorService $aggregator, AiProvider $ai)
    {
        $this->info('Starting AI insight generation for teams...');

        $teams = Team::all();

        foreach ($teams as $team) {
            $this->info("Processing Team: {$team->name}");

            try {
                // 1. Get SQL-first aggregates
                $summary = $aggregator->getFinancialSummary(
                    $team,
                    now()->subDays(7)->toDateString(),
                    now()->toDateString()
                );

                $holidayPredictions = $aggregator->getUpcomingHolidayPredictions($team);
                if ($holidayPredictions) {
                    $summary['holiday_predictions'] = $holidayPredictions;
                }

                // 2. Instruct AI to generate the daily strategic briefing
                $prompt = "Buatlah satu paragraf singkat 'Bisikan Strategis' untuk pemilik UMKM. Fokus pada peringatan likuiditas, stok, saran operasional, atau persiapan event/hari raya terdekat jika ada di data prediksi. Gunakan data: ".json_encode($summary);
                $narration = $ai->narrateInsights($prompt, $summary);

                // 3. Save to database
                DB::table('ai_insights')->insert([
                    'team_id' => $team->id,
                    'type' => 'daily_summary',
                    'data' => json_encode($summary),
                    'reasoning' => $narration,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $this->info("Successfully generated insight for team {$team->id}.");

            } catch (\Exception $e) {
                $this->error("Failed to generate insight for team {$team->id}: ".$e->getMessage());
                Log::error('AI Briefing Error', ['team_id' => $team->id, 'error' => $e->getMessage()]);
            }
        }

        $this->info('AI insights generation completed.');
    }
}

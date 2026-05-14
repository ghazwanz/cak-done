<?php

namespace App\Console\Commands;

use App\Jobs\ProcessTeamInventoryAlertsJob;
use App\Models\Team;
use Illuminate\Console\Command;

class CheckExpiryDates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inventory:check-expiry';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatch inventory alert jobs for teams whose notification time has reached';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $nowTime = now()->format('H:i');

        // Find teams where notification_time matches the current hour/minute
        // Or process all if running manually via CLI without minute precision
        $teams = Team::where('notification_time', $nowTime)->get();

        if ($teams->isEmpty() && ! $this->laravel->runningInConsole()) {
            return;
        }

        // If running manually from CLI, we might want to force all
        if ($this->laravel->runningInConsole() && $teams->isEmpty()) {
            $this->info("No teams scheduled for $nowTime. Processing all teams due to manual CLI run.");
            $teams = Team::all();
        }

        foreach ($teams as $team) {
            $this->info("Dispatching inventory alert job for team: {$team->name}");
            ProcessTeamInventoryAlertsJob::dispatch($team);
        }

        $this->info('All scheduled inventory alert jobs have been dispatched.');
    }
}

<?php

namespace App\Jobs;

use App\Models\Team;
use App\Notifications\ExpiryAlertNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Notification;

class ProcessTeamInventoryAlertsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public Team $team) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $threshold = $this->team->expiry_threshold_days ?? 3;

        // Find batches nearing expiry for this team
        $batches = $this->team->inventoryBatches()
            ->where('expiry_date', '<=', now()->addDays($threshold))
            ->where('expiry_date', '>=', now()->toDateString())
            ->where('qty', '>', 0)
            ->get();

        if ($batches->isEmpty()) {
            return;
        }

        // Notify all team members
        foreach ($batches as $batch) {
            Notification::send($this->team->members, new ExpiryAlertNotification($batch));
        }
    }
}

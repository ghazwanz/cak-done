<?php

namespace App\Console\Commands;

use App\Models\InventoryBatch;
use App\Notifications\ExpiryAlertNotification;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:check-expiry-dates')]
#[Description('Periksa stok yang mendekati kadaluarsa dan kirim notifikasi ke pemilik tim.')]
class CheckExpiryDates extends Command
{
    public function handle()
    {
        $this->info('Memeriksa stok kadaluarsa...');

        // Cari batch yang kadaluarsa dalam 3 hari ke depan
        $batches = InventoryBatch::with('team.owner')
            ->where('expiry_date', '<=', now()->addDays(3))
            ->where('expiry_date', '>', now())
            ->get();

        foreach ($batches as $batch) {
            $owner = $batch->team->owner;
            if ($owner) {
                $owner->notify(new ExpiryAlertNotification($batch));
                $this->line("Notifikasi dikirim untuk {$batch->item_name} (Tim: {$batch->team->name})");
            }
        }

        $this->info('Pemeriksaan selesai.');
    }
}

<?php

namespace App\Notifications;

use App\Models\InventoryBatch;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ExpiryAlertNotification extends Notification
{
    use Queueable;

    public function __construct(public InventoryBatch $batch) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('⚠️ Peringatan Stok Kadaluarsa!')
            ->line("Barang {$this->batch->item_name} akan kadaluarsa pada tanggal {$this->batch->expiry_date}.")
            ->line("Sisa stok: {$this->batch->qty} {$this->batch->unit}")
            ->action('Lihat Inventaris', url('/inventory'))
            ->line('Segera lakukan tindakan (diskon/promosi) agar tidak merugi.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'batch_id' => $this->batch->id,
            'item_name' => $this->batch->item_name,
            'expiry_date' => $this->batch->expiry_date,
            'qty' => $this->batch->qty,
            'message' => "Stok {$this->batch->item_name} akan segera basi!",
        ];
    }
}

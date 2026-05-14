<?php

namespace App\Notifications;

use App\Models\InventoryBatch;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class ExpiryAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public InventoryBatch $batch) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail', WebPushChannel::class];
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

    public function toWebPush($notifiable, $notification)
    {
        return (new WebPushMessage)
            ->title('⚠️ Peringatan Kadaluarsa!')
            ->icon('/logo.png')
            ->body("Stok {$this->batch->item_name} ({$this->batch->qty} {$this->batch->unit}) akan segera basi pada {$this->batch->expiry_date}!")
            ->action('Cek Stok', 'view_inventory')
            ->options(['TTL' => 1000]);
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

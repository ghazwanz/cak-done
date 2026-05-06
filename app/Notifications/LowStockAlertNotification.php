<?php

namespace App\Notifications;

use App\Models\InventoryItem;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LowStockAlertNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public InventoryItem $item, public int $totalQty)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'item_id' => $this->item->id,
            'item_name' => $this->item->name,
            'current_qty' => $this->totalQty,
            'threshold' => $this->item->low_stock_threshold,
            'message' => "Stok {$this->item->name} menipis! Sisa {$this->totalQty} {$this->item->unit} (Batas: {$this->item->low_stock_threshold}).",
        ];
    }
}

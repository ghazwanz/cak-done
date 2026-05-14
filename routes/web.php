<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Controllers\TransactionController;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('/manifest.webmanifest', function () {
    return response(file_get_contents(public_path('manifest.webmanifest')), 200, [
        'Content-Type' => 'application/manifest+json',
    ]);
})->name('pwa.manifest');

Route::get('/sw.js', function () {
    return response(file_get_contents(public_path('sw.js')), 200, [
        'Content-Type' => 'application/javascript',
    ]);
})->name('pwa.service-worker');

Route::get('/dashboard', function () {
    return redirect()->route('dashboard', ['current_team' => auth()->user()->currentTeam->slug]);
})->middleware(['auth', 'verified']);

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');
        Route::get('catat', [AiController::class, 'catat'])->name('catat.index');

        // Transactions (Workflow 1 & 2 Integration)
        Route::post('ai/process', [AiController::class, 'process'])->name('ai.process');
        Route::post('ai/chat/save', [AiController::class, 'saveChatHistory'])->name('ai.chat.save');
        Route::post('ai/chat/clear', [AiController::class, 'clearChatHistory'])->name('ai.chat.clear');

        Route::post('transactions/parse', [TransactionController::class, 'parse'])->name('transactions.parse');
        Route::get('transactions', [TransactionController::class, 'index'])->name('transactions.index');
        Route::post('transactions', [TransactionController::class, 'store'])->name('transactions.store');

        // Inventory (Workflow 2)
        Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
        Route::post('inventory/items', [InventoryController::class, 'storeItem'])->name('inventory.items.store');
        Route::patch('inventory/items/{id}', [InventoryController::class, 'updateItem'])->name('inventory.items.update');
        Route::delete('inventory/items/{id}', [InventoryController::class, 'destroyItem'])->name('inventory.items.destroy');
        Route::post('inventory/clear-expired', [InventoryController::class, 'clearExpired'])->name('inventory.clear-expired');
        Route::patch('inventory/{id}', [InventoryController::class, 'update'])->name('inventory.update');
        Route::delete('inventory/{id}', [InventoryController::class, 'destroy'])->name('inventory.destroy');

        // Reports (Workflow 3)
        Route::get('/reports/cashflow', [ReportController::class, 'generateCashflow'])->name('reports.cashflow');

        // Notifications
        Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
        Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

        // Push Subscriptions
        Route::post('push-subscriptions', [PushSubscriptionController::class, 'store'])->name('push-subscriptions.store');
        Route::delete('push-subscriptions', [PushSubscriptionController::class, 'destroy'])->name('push-subscriptions.destroy');
    });

Route::middleware(['auth'])->group(function () {
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
});

require __DIR__.'/settings.php';

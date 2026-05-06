<?php

namespace App\Http\Controllers;

use App\Services\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function __construct(protected InventoryService $inventoryService) {}

    public function index(Request $request): Response
    {
        $team = $request->user()->currentTeam;

        return Inertia::render('inventory/index', [
            'batches' => fn () => $this->inventoryService->getBatchesOrderedByExpiry($team),
            'lowStockItems' => fn () => $this->inventoryService->getLowStockItems($team)->values(),
        ]);
    }

    public function update(Request $request, string $team, int $id): RedirectResponse
    {
        $request->validate([
            'qty' => ['required', 'integer', 'min:0'],
        ]);

        $this->inventoryService->updateBatchQty($request->user()->currentTeam, $id, $request->qty);

        return back()->with('flash', ['message' => 'Stok diperbarui.']);
    }

    public function destroy(Request $request, string $team, int $id): RedirectResponse
    {
        $this->inventoryService->deleteBatch($request->user()->currentTeam, $id);

        return back()->with('flash', ['message' => 'Batch dihapus.']);
    }
}

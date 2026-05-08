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
            'inventoryItems' => fn () => $this->inventoryService->getInventoryItems($team),
        ]);
    }

    public function storeItem(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'unit' => ['required', 'string', 'max:255'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
            'initial_qty' => ['nullable', 'integer', 'min:0'],
            'initial_cogs' => ['nullable', 'numeric', 'min:0'],
            'initial_expiry' => ['nullable', 'date'],
        ]);

        $item = $this->inventoryService->createItem($request->user()->currentTeam, $request->only([
            'name', 'category', 'unit', 'low_stock_threshold',
        ]));

        if ($request->filled('initial_qty') && $request->initial_qty > 0) {
            $request->user()->currentTeam->inventoryBatches()->create([
                'inventory_item_id' => $item->id,
                'item_name' => $item->name,
                'qty' => $request->initial_qty,
                'unit' => $item->unit,
                'cogs' => $request->initial_cogs ?? 0,
                'expiry_date' => $request->initial_expiry ?? now()->addMonths(6)->toDateString(),
            ]);
        }

        return back()->with('flash', ['message' => 'Barang baru ditambahkan.']);
    }

    public function updateItem(Request $request, string $team, int $id): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'unit' => ['required', 'string', 'max:255'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
        ]);

        $this->inventoryService->updateItem($request->user()->currentTeam, $id, $request->only([
            'name', 'category', 'unit', 'low_stock_threshold',
        ]));

        return back()->with('flash', ['message' => 'Data barang diperbarui.']);
    }

    public function destroyItem(Request $request, string $team, int $id): RedirectResponse
    {
        $this->inventoryService->deleteItem($request->user()->currentTeam, $id);

        return back()->with('flash', ['message' => 'Barang dihapus.']);
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

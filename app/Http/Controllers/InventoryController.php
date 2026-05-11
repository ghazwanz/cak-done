<?php

namespace App\Http\Controllers;

use App\Services\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
            'selling_price' => ['nullable', 'numeric', 'min:0'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
            'initial_qty' => ['nullable', 'integer', 'min:0'],
            'initial_cogs' => ['nullable', 'numeric', 'min:0'],
            'initial_expiry' => ['nullable', 'date'],
        ]);

        $data = $request->only([
            'name', 'category', 'unit', 'selling_price', 'low_stock_threshold',
        ]);

        if (isset($data['selling_price'])) {
            $data['selling_price'] = (float) $data['selling_price'];
        }

        $item = $this->inventoryService->createItem($request->user()->currentTeam, $data);

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
        Log::debug('Inventory update request', $request->all());

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'unit' => ['required', 'string', 'max:255'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
        ]);

        $data = $request->only([
            'name', 'category', 'unit', 'selling_price', 'low_stock_threshold',
        ]);

        if (isset($data['selling_price'])) {
            $data['selling_price'] = (float) $data['selling_price'];
        }

        Log::debug('Inventory update data', $data);

        $this->inventoryService->updateItem($request->user()->currentTeam, $id, $data);

        return back()->with('flash', ['message' => 'Data barang diperbarui.']);
    }

    public function destroyItem(Request $request, string $team, int $id): RedirectResponse
    {
        $this->inventoryService->deleteItem($request->user()->currentTeam, $id);

        return back()->with('flash', ['message' => 'Barang dihapus.']);
    }

    public function clearExpired(Request $request): RedirectResponse
    {
        $this->inventoryService->deleteExpiredBatches($request->user()->currentTeam);

        return back()->with('flash', ['message' => 'Semua barang kadaluarsa telah dihapus.']);
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

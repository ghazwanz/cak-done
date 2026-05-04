<?php

namespace App\Http\Controllers;

use App\Models\InventoryBatch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $team = $request->user()->currentTeam;

        $batches = InventoryBatch::with('inventoryItem')
            ->where('team_id', $team->id)
            ->orderBy('expiry_date', 'asc')
            ->get();

        return Inertia::render('inventory/index', [
            'batches' => $batches,
        ]);
    }
}

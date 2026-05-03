<?php

namespace App\Http\Controllers;

use App\Contracts\AiProvider;
use App\Models\Team;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    public function __construct(
        protected AiProvider $ai
    ) {}

    /**
     * Parse the multimodal input using AI.
     */
    public function parse(Request $request, Team $current_team)
    {
        $request->validate([
            'text' => 'nullable|string',
            'audio' => 'nullable|file|mimes:mp3,wav,m4a,ogg',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,webp',
        ]);

        // Note: For audio and image, you would normally store them temporarily
        // and pass the path to the AI provider.
        $audioPath = $request->file('audio')?->getRealPath();
        $imagePath = $request->file('image')?->getRealPath();

        try {
            $parsedData = $this->ai->parseTransaction(
                text: $request->input('text'),
                audioPath: $audioPath,
                imagePath: $imagePath
            );

            return response()->json([
                'success' => true,
                'data' => $parsedData,
                'raw_input' => $request->input('text') ?? 'Multimodal Input',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to parse transaction: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Store the confirmed transaction.
     */
    public function store(Request $request, Team $current_team)
    {
        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'amount' => 'required|integer|min:0',
            'type' => 'required|in:income,expense',
            'category' => 'required|string',
            'is_business' => 'required|boolean',
            'raw_input' => 'nullable|string',
        ]);

        $transaction = $current_team->transactions()->create([
            'user_id' => Auth::id(),
            'item_name' => $validated['item_name'],
            'amount' => $validated['amount'],
            'type' => $validated['type'],
            'category' => $validated['category'],
            'is_business' => $validated['is_business'],
            'raw_input' => $validated['raw_input'],
        ]);

        if ($request->has('inventory') && $validated['type'] === 'expense') {
            $inventory = $request->input('inventory');
            $current_team->inventoryBatches()->create([
                'item_name' => $validated['item_name'],
                'qty' => $inventory['quantity'] ?? 1,
                'unit' => $inventory['unit'] ?? 'pcs',
                'cogs' => $inventory['cogs'] ?? ($validated['amount'] / ($inventory['quantity'] ?? 1)),
                'expiry_date' => now()->addDays($inventory['expiry_days'] ?? 7),
            ]);
        }

        return redirect()->back()->with('success', 'Transaksi berhasil disimpan!');
    }
}

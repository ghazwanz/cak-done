<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    /**
     * Store or update a push subscription.
     */
    public function store(Request $request)
    {
        $this->validate($request, [
            'endpoint' => 'required',
            'keys.auth' => 'required',
            'keys.p256dh' => 'required',
        ]);

        $request->user()->updatePushSubscription(
            $request->endpoint,
            $request->keys['p256dh'],
            $request->keys['auth']
        );

        return response()->json(['success' => true]);
    }

    /**
     * Delete a push subscription.
     */
    public function destroy(Request $request)
    {
        $this->validate($request, [
            'endpoint' => 'required',
        ]);

        $request->user()->deletePushSubscription($request->endpoint);

        return response()->json(['success' => true]);
    }
}

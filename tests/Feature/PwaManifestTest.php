<?php

use Illuminate\Testing\Fluent\AssertableJson;

test('pwa manifest is available with install metadata', function () {
    $this->get('/manifest.webmanifest')
        ->assertOk()
        ->assertHeader('content-type', 'application/manifest+json')
        ->assertJson(fn (AssertableJson $json) => $json
            ->where('name', 'Cak Done')
            ->where('short_name', 'Cak Done')
            ->where('display', 'standalone')
            ->where('start_url', '/?source=pwa')
            ->has('icons')
            ->etc()
        );
});

test('service worker is available with javascript content', function () {
    $this->get('/sw.js')
        ->assertOk()
        ->assertHeader('content-type', 'application/javascript')
        ->assertSee('cak-done-pwa-v1')
        ->assertSee('self.addEventListener');
});

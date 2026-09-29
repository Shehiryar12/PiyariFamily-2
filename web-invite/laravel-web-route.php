<?php

use Illuminate\Support\Facades\Route;

Route::get('/{code}', function (string $code) {
    $invite = public_path('invite.html');

    if (!is_file($invite)) {
        abort(404);
    }

    return response()->file($invite);
})->where('code', '[A-Za-z0-9]{6,16}');

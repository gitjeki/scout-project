<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        // PERBAIKAN DI SINI:
        // Ubah 'password' menjadi 'password_hash' sesuai dengan database dan Model User Anda
        $request->user()->update([
            'password_hash' => Hash::make($validated['password']),
        ]);

        return back()->with('status', 'password-updated');
    }
}
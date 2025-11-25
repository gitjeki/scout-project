<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class PasswordResetRequestController extends Controller
{
    /**
     * Menampilkan Form Lupa Password (untuk User/Sales)
     */
    public function create()
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Memproses Permintaan dari User (Simpan ke Database)
     */
    public function store(Request $request)
    {
        // 1. Validasi email
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // 2. Cari User berdasarkan email
        $user = User::where('email', $request->email)->first();

        // 3. Cek apakah sudah ada request pending? (Opsional, biar gak spam)
        // Tapi untuk sekarang kita langsung simpan saja
        
        DB::table('password_reset_requests')->insert([
            'user_id' => $user->id,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. Kembalikan pesan sukses
        return back()->with('status', 'Permintaan terkirim! Admin akan segera mereset password Anda.');
    }

    /**
     * ADMIN: Menampilkan Daftar Permintaan Reset
     */
    public function index()
    {
        // Ambil data request digabung dengan data user (Join Table)
        $requests = DB::table('password_reset_requests')
            ->join('users', 'password_reset_requests.user_id', '=', 'users.id')
            ->select('password_reset_requests.*', 'users.name', 'users.email', 'users.username', 'users.profile_photo')
            ->where('password_reset_requests.status', 'pending')
            ->orderBy('password_reset_requests.created_at', 'desc')
            ->get();

        return Inertia::render('Admin/ResetPassword/Index', [
            'requests' => $requests
        ]);
    }

    /**
     * ADMIN: Eksekusi Reset Password
     */
public function reset(Request $request, $id)
    {
        // 1. Validasi Input Password dari Admin
        $request->validate([
            'password' => 'required|string|min:6', // Minimal 6 karakter
        ]);

        $resetRequest = DB::table('password_reset_requests')->where('id', $id)->first();
        
        if (!$resetRequest) {
            return back()->with('error', 'Permintaan tidak ditemukan.');
        }

        // 2. Update Password User dengan input Admin
        $user = User::find($resetRequest->user_id);
        
        if ($user) {
            $user->password = Hash::make($request->password);
            $user->save();
        }

        // 3. Tandai Request selesai
        DB::table('password_reset_requests')->where('id', $id)->update([
            'status' => 'completed',
            'updated_at' => now()
        ]);

        // 4. Kembalikan pesan sukses biasa
        return back()->with('message', "Sukses! Password untuk {$user->name} berhasil diubah.");
    }
}
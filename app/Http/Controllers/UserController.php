<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        // Cek apakah Admin minta lihat yang "archived" (sampah)?
        if ($request->has('status') && $request->status === 'archived') {
            $users = User::onlyTrashed()->orderBy('deleted_at', 'desc')->get();
        } else {
            $users = User::orderBy('created_at', 'desc')->get();
        }

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['status']) // Kirim status filter ke frontend
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'role' => 'sales', // Default sales
            'password' => Hash::make($request->password),
        ]);

        return redirect()->back()->with('message', 'Akun berhasil dibuat.');
    }

    // FITUR BARU: Update Role
    public function update(Request $request, User $user)
    {
        // Validasi input role harus 'admin' atau 'sales'
        $request->validate([
            'role' => 'required|in:admin,sales',
        ]);

        // Cegah admin menurunkan pangkat dirinya sendiri (biar gak terkunci)
        if ($user->id === auth()->id() && $request->role !== 'admin') {
            return back()->with('error', 'Anda tidak bisa mengubah role sendiri.');
        }

        $user->update(['role' => $request->role]);

        return back()->with('message', 'Role pengguna berhasil diperbarui.');
    }

    // FITUR UPDATE: Destroy sekarang jadi "Arsip"
    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Anda tidak bisa mengarsipkan akun sendiri!');
        }

        $user->delete(); // Karena pakai SoftDeletes, ini otomatis jadi "Arsip"

        return back()->with('message', 'Akun berhasil diarsipkan (Soft Delete).');
    }

    public function restore($id)
    {
        $user = User::withTrashed()->findOrFail($id);
        $user->restore(); // Ajaib! User kembali aktif

        return redirect()->back()->with('message', 'Akun berhasil dipulihkan.');
    }
}
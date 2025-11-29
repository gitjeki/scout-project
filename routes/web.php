<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PasswordResetRequestController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// --- 1. HALAMAN AWAL (ROOT) KE LOGIN ---
Route::get('/', function () {
    return redirect()->route('login');
});

// --- 2. DASHBOARD ---
Route::get('/dashboard', function () {
    // Ambil Statistik
    $totalSales = User::where('role', 'sales')->count();
    $totalAdmin = User::where('role', 'admin')->count();
    $pendingResets = DB::table('password_reset_requests')->where('status', 'pending')->count();

    // AMBIL DATA USER TERBARU (Ini yang sebelumnya hilang)
    $latestUsers = User::latest()->take(5)->get();

    // Kirim semua data ke Frontend React
    return Inertia::render('Dashboard', [
        'stats' => [
            'total_sales' => $totalSales,
            'total_admin' => $totalAdmin,
            'pending_resets' => $pendingResets,
        ],
        'latest_users' => $latestUsers // <--- PASTIKAN BARIS INI ADA
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

// --- 3. GROUP AUTH (Fitur Admin & Profil) ---
Route::middleware('auth')->group(function () {
    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Users Management (CRUD)
    Route::resource('users', UserController::class);
    Route::put('/users/{id}/restore', [UserController::class, 'restore'])->name('users.restore');

    // Password Reset (Admin Side)
    Route::get('/admin/reset-password', [PasswordResetRequestController::class, 'index'])->name('admin.reset.index');
    Route::post('/admin/reset-password/{id}', [PasswordResetRequestController::class, 'reset'])->name('admin.reset.action');
    Route::delete('/admin/reset-password/{id}', [PasswordResetRequestController::class, 'destroy'])->name('admin.reset.destroy');
});

require __DIR__.'/auth.php';
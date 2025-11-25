<?php

use App\Http\Controllers\UserController;
use App\Models\User;
use App\Models\PasswordResetRequest;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\PasswordResetRequestController;

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    // 1. Ambil Data Statistik Sederhana
    $totalSales = User::where('role', 'sales')->count();
    $totalAdmin = User::where('role', 'admin')->count();
    $pendingResets = DB::table('password_reset_requests')->where('status', 'pending')->count();

    // 2. Ambil 5 User Terbaru untuk list di Dashboard
    $latestUsers = User::latest()->take(5)->get();

    return Inertia::render('Dashboard', [
        'stats' => [
            'total_sales' => $totalSales,
            'total_admin' => $totalAdmin,
            'pending_resets' => $pendingResets,
        ],
        'latest_users' => $latestUsers
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/users/{id}/restore', [UserController::class, 'restore'])->name('users.restore');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    // Rute CRUD User (Hanya bisa diakses jika role admin? Nanti kita tambahkan middleware role)
    Route::resource('users', UserController::class);
    Route::get('/admin/reset-password', [PasswordResetRequestController::class, 'index'])
        ->name('admin.reset.index');
    Route::post('/admin/reset-password/{id}', [PasswordResetRequestController::class, 'reset'])
        ->name('admin.reset.action');
});

require __DIR__.'/auth.php';

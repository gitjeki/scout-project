<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PasswordResetRequestController; 
use App\Http\Controllers\DashboardController; 
use App\Http\Controllers\SalesController; 
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect()->route('login');
});

// --- GROUP ADMIN & SHARED ---
Route::middleware(['auth', 'verified'])->group(function () {
    
    // 1. Dashboard Utama Admin (Bisa diakses Sales juga jika perlu, tapi Sales punya dashboard sendiri di bawah)
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 2. Action Admin (Import & Prediksi)
    Route::post('/dashboard/import', [DashboardController::class, 'import'])->name('dashboard.import');
    Route::post('/dashboard/predict', [DashboardController::class, 'runPredictions'])->name('dashboard.predict');

    // 3. CRUD Data Prospek (Admin)
    Route::post('/dashboard/store', [DashboardController::class, 'store'])->name('dashboard.store');
    Route::put('/dashboard/{id}', [DashboardController::class, 'update'])->name('dashboard.update');
    
    // Admin Bulk Actions
    Route::delete('/dashboard/{id}', [DashboardController::class, 'destroy'])->name('dashboard.destroy');
    Route::post('/dashboard/bulk-destroy', [DashboardController::class, 'bulkDestroy'])->name('dashboard.bulk-destroy');
    
    // Route resource untuk prospects (General destroy/bulk)
    Route::delete('/prospects/{id}', [DashboardController::class, 'destroy'])->name('prospects.destroy');
    Route::post('/prospects/bulk-destroy', [DashboardController::class, 'bulkDestroy'])->name('prospects.bulk-destroy');
});

// --- GROUP KHUSUS SALES WORKSPACE ---
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Halaman Utama Sales (Dashboard + Table jadi satu)
    Route::get('/sales/prospects', [SalesController::class, 'index'])->name('sales.prospects.index');
    
    // Action Update & Log Activity
    Route::put('/sales/prospects/{id}', [SalesController::class, 'update'])->name('sales.prospects.update');
    Route::post('/sales/activity', [SalesController::class, 'logActivity'])->name('sales.activity.log');


});

// --- GROUP PROFILE & USER MANAGEMENT (ADMIN TOOLS) ---
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('users', UserController::class);
    Route::put('/users/{id}/restore', [UserController::class, 'restore'])->name('users.restore');

    Route::get('/admin/reset-password', [PasswordResetRequestController::class, 'index'])->name('admin.reset.index');
    Route::post('/admin/reset-password/{id}', [PasswordResetRequestController::class, 'reset'])->name('admin.reset.action');
    Route::delete('/admin/reset-password/{id}', [PasswordResetRequestController::class, 'destroy'])->name('admin.reset.destroy');

    // RUTE DARURAT (Hapus nanti di production)
    Route::get('/emergency-login', function () {
        $user = \App\Models\User::where('email', 'admin@bank.com')->first();
        if (!$user) return 'User Admin tidak ditemukan di database!';

        \Illuminate\Support\Facades\Auth::login($user);
        return redirect('/dashboard');
    });
});

require __DIR__.'/auth.php';
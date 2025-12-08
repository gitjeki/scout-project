<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PasswordResetRequestController; 
use App\Http\Controllers\DashboardController; 
use App\Http\Controllers\DataControlController; 
use App\Http\Controllers\SalesController; 
use App\Http\Controllers\AssignmentController; // <-- BARU: Import Controller
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
    
    // 1. Dashboard Utama Admin
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 2. Data Control
    Route::get('/data-control', [DataControlController::class, 'index'])->name('data-control.index');

    // 3. PENUGASAN (Assignment) - BARU
    Route::get('/assignments', [AssignmentController::class, 'index'])->name('assignments.index');
    Route::post('/assignments/assign', [AssignmentController::class, 'assign'])->name('assignments.assign');

    // 4. Action Admin (Import, Prediksi & Konfigurasi)
    Route::post('/dashboard/import', [DashboardController::class, 'import'])->name('dashboard.import');
    
    // [PENTING] Nama route ini disesuaikan agar tombol Prediksi di React berfungsi
    Route::post('/dashboard/run-predictions', [DashboardController::class, 'runPredictions'])->name('dashboard.run-predictions');

    // Route untuk Simpan Konfigurasi Template Form
    Route::post('/dashboard/configuration', [DashboardController::class, 'updateConfiguration'])->name('dashboard.update-configuration');

    // 5. CRUD Data Prospek
    Route::post('/dashboard/store', [DashboardController::class, 'store'])->name('dashboard.store');
    Route::put('/dashboard/{id}', [DashboardController::class, 'update'])->name('dashboard.update');
    
    // Admin Bulk Actions (Dashboard)
    Route::delete('/dashboard/{id}', [DashboardController::class, 'destroy'])->name('dashboard.destroy');
    Route::post('/dashboard/bulk-destroy', [DashboardController::class, 'bulkDestroy'])->name('dashboard.bulk-destroy');
    
    // Route resource untuk prospects (General / Data Control)
    Route::delete('/prospects/{id}', [DashboardController::class, 'destroy'])->name('prospects.destroy');
    Route::post('/prospects/bulk-destroy', [DashboardController::class, 'bulkDestroy'])->name('prospects.bulk-destroy');
});

// --- GROUP KHUSUS SALES WORKSPACE ---
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Halaman Utama Sales
    Route::get('/sales/prospects', [SalesController::class, 'index'])->name('sales.prospects.index');
    
    // Action Update & Log Activity
    Route::put('/sales/prospects/{id}', [SalesController::class, 'update'])->name('sales.prospects.update');
    Route::post('/sales/activity', [SalesController::class, 'logActivity'])->name('sales.activity.log');
});

// --- GROUP PROFILE & USER MANAGEMENT (ADMIN TOOLS) ---
Route::middleware('auth')->group(function () {
    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // User Management
    Route::resource('users', UserController::class);
    Route::put('/users/{id}/restore', [UserController::class, 'restore'])->name('users.restore');

    // Reset Password Management
    Route::get('/admin/reset-password', [PasswordResetRequestController::class, 'index'])->name('admin.reset.index');
    Route::post('/admin/reset-password/{id}', [PasswordResetRequestController::class, 'reset'])->name('admin.reset.action');
    Route::delete('/admin/reset-password/{id}', [PasswordResetRequestController::class, 'destroy'])->name('admin.reset.destroy');

    // RUTE DARURAT (Opsional, hapus jika production)
    Route::get('/emergency-login', function () {
        $user = \App\Models\User::where('email', 'admin@bank.com')->first();
        if (!$user) return 'User Admin tidak ditemukan di database!';

        \Illuminate\Support\Facades\Auth::login($user);
        return redirect()->route('dashboard'); 
    });
});

require __DIR__.'/auth.php';
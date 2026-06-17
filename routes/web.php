<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PasswordResetRequestController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DataControlController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\AssignmentController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/data-control', [DataControlController::class, 'index'])->name('data-control.index');
    Route::get('/assignments', [AssignmentController::class, 'index'])->name('assignments.index');
    Route::post('/assignments/assign', [AssignmentController::class, 'assign'])->name('assignments.assign');
    Route::get('/assignments/get-ids', [AssignmentController::class, 'getIds'])->name('assignments.get-ids');
    Route::post('/dashboard/import', [DashboardController::class, 'import'])->name('dashboard.import');
    Route::post('/dashboard/run-predictions', [DashboardController::class, 'runPredictions'])->name('dashboard.run-predictions');
    Route::post('/dashboard/configuration', [DashboardController::class, 'updateConfiguration'])->name('dashboard.update-configuration');
    Route::post('/dashboard/store', [DashboardController::class, 'store'])->name('dashboard.store');
    Route::put('/dashboard/{id}', [DashboardController::class, 'update'])->name('dashboard.update');
    Route::delete('/dashboard/{id}', [DashboardController::class, 'destroy'])->name('dashboard.destroy');
    Route::post('/dashboard/bulk-destroy', [DashboardController::class, 'bulkDestroy'])->name('dashboard.bulk-destroy');
    Route::delete('/prospects/{id}', [DashboardController::class, 'destroy'])->name('prospects.destroy');
    Route::post('/prospects/bulk-destroy', [DashboardController::class, 'bulkDestroy'])->name('prospects.bulk-destroy');
    Route::resource('users', UserController::class);
    Route::put('/users/{id}/restore', [UserController::class, 'restore'])->name('users.restore');
    Route::get('/admin/reset-password', [PasswordResetRequestController::class, 'index'])->name('admin.reset.index');
    Route::post('/admin/reset-password/{id}', [PasswordResetRequestController::class, 'reset'])->name('admin.reset.action');
    Route::delete('/admin/reset-password/{id}', [PasswordResetRequestController::class, 'destroy'])->name('admin.reset.destroy');
});

Route::middleware(['auth', 'verified', 'role:sales'])->group(function () {
    Route::get('/sales/prospects', [SalesController::class, 'index'])->name('sales.prospects.index');
    Route::put('/sales/prospects/{id}', [SalesController::class, 'update'])->name('sales.prospects.update');
    Route::post('/sales/activity', [SalesController::class, 'logActivity'])->name('sales.activity.log');
});

require __DIR__.'/auth.php';

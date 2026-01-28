<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\WorkLogController;
use App\Http\Controllers\Api\WorkLogReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authentication Routes (Public)
Route::post('/auth/login', [AuthController::class, 'login'])->name('auth.login');

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth Routes
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::get('/auth/me', [AuthController::class, 'me'])->name('auth.me');

    // User endpoint
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Employee Management Routes
    Route::prefix('employees')->group(function () {
        Route::get('/', [EmployeeController::class, 'index'])->name('employees.index');
        Route::post('/', [EmployeeController::class, 'store'])->name('employees.store');
        Route::get('/{employee}', [EmployeeController::class, 'show'])->name('employees.show');
        Route::put('/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
        Route::delete('/{employee}/deactivate', [EmployeeController::class, 'deactivate'])->name('employees.deactivate');
        Route::post('/{employee}/reactivate', [EmployeeController::class, 'reactivate'])->name('employees.reactivate')->withTrashed();
    });
});

Route::middleware('auth:sanctum')
    ->prefix('work-log')
    ->group(function () {
        Route::post('/', [WorkLogController::class, 'store']);
        Route::get('/calculate', [WorkLogController::class, 'calculateWorkMinutes']);
        Route::get('/reports', [WorkLogReportController::class, 'index']);
        Route::patch(
            '/reports/{workLogReport}/notes',
            [WorkLogReportController::class, 'updateNotes']
        );
    });

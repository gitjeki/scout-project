<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Statistik Harian Sales (Per User)
        Schema::create('daily_sales_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('date'); // Tanggal statistik
            
            // Metrik Kinerja
            $table->integer('hot_leads_target')->default(0); // Target Prioritas
            $table->integer('calls_made')->default(0);       // Aktivitas Call
            $table->integer('total_duration_sec')->default(0); // Durasi Detik
            
            $table->timestamps();

            // Mencegah duplikasi data untuk user yang sama di tanggal yang sama
            $table->unique(['user_id', 'date']);
        });

        // 2. Tabel Snapshot Pipeline Global (Harian)
        Schema::create('daily_pipeline_snapshots', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('status_code'); // NEW, CONTACTED, dll
            $table->integer('count')->default(0); // Jumlah prospek
            $table->string('status_desc')->nullable();
            
            $table->timestamps();

            // Mencegah duplikasi status yang sama di tanggal yang sama
            $table->unique(['date', 'status_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_sales_stats');
        Schema::dropIfExists('daily_pipeline_snapshots');
    }
};
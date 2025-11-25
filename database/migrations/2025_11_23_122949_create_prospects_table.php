<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('prospects', function (Blueprint $table) {
            $table->id(); // ID Unik

            // --- 1. Data Nasabah (Bank Marketing Dataset) ---
            $table->integer('age');                 // Umur
            $table->string('job');                  // Pekerjaan
            $table->string('marital');              // Status Pernikahan
            $table->string('education');            // Pendidikan
            $table->string('default');              // Kredit Macet?
            $table->string('housing');              // KPR?
            $table->string('loan');                 // Pinjaman Pribadi?

            // --- 2. Data Kontak ---
            $table->string('contact');              // Jenis Kontak
            $table->string('month');                // Bulan Kontak
            $table->string('day_of_week');          // Hari Kontak
            $table->integer('duration');            // Durasi (detik)

            // --- 3. Data Kampanye ---
            $table->integer('campaign');            // Jumlah kontak kampanye ini
            $table->integer('pdays');               // Hari sejak kontak terakhir
            $table->integer('previous');            // Kontak sebelum kampanye ini
            $table->string('poutcome');             // Hasil sebelumnya

            // --- 4. Indikator Ekonomi (Float) ---
            $table->float('emp_var_rate');
            $table->float('cons_price_idx');
            $table->float('cons_conf_idx');
            $table->float('euribor3m');
            $table->float('nr_employed');

            // --- 5. Target & Hasil Prediksi ---
            $table->string('y');                    // Data aktual (Yes/No)
            $table->float('prediction_score')->nullable(); // Skor Machine Learning (0.0 - 1.0)

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prospects');
    }
};
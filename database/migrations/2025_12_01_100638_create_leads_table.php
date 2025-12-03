<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            
            // --- 1. IDENTITAS NASABAH (Untuk Manusia/Sales) ---
            // ML tidak butuh ini, tapi Sales butuh untuk menghubungi nasabah.
            $table->string('name'); 
            $table->string('phone_number')->nullable();
            
            // --- 2. DATA PROFIL (Input Admin) ---
            // Ini data yang akan Admin isi di Form dan dipakai ML.
            $table->integer('age');              
            $table->string('job');               // admin., blue-collar, dll
            $table->string('education');         // university.degree, dll
            $table->string('marital')->nullable(); 
            $table->string('housing')->nullable(); // Punya KPR? (yes/no)
            $table->string('loan')->nullable();    // Punya Cicilan? (yes/no)
            
            // --- 3. DATA TEKNIS (Hidden / Default System) ---
            // Admin tidak perlu isi, sistem otomatis mengisi di background.
            $table->string('contact')->default('cellular'); // HP atau Telpon rumah
            $table->string('month')->default('may');      // Default: bulan input
            $table->string('day_of_week')->default('mon'); // Default: hari input
            $table->string('poutcome')->default('nonexistent'); 
            $table->integer('campaign')->default(1);      // Kontak ke-1
            $table->integer('pdays')->default(999);       // Belum pernah dikontak
            $table->integer('previous')->default(0);      // Kontak sebelumnya 0
            $table->float('duration')->default(0);        // Durasi telpon awal 0
            
            // --- 4. DATA EKONOMI MAKRO (Hidden / Hardcoded) ---
            // Wajib ada agar Model ML (File .pkl) tidak error. 
            // Kita isi nilai rata-rata dari dataset agar netral.
            $table->float('emp_var_rate')->default(1.1);
            $table->float('cons_price_idx')->default(93.57); 
            $table->float('cons_conf_idx')->default(-40.5);
            $table->float('euribor3m')->default(3.62);
            $table->float('nr_employed')->default(5167.0);

            // --- 5. HASIL PREDIKSI (Output ML) ---
            // Tempat menyimpan hasil ramalan AI
            $table->float('prediction_score')->nullable(); // Skor 0.0 - 1.0
            $table->string('prediction_label')->nullable(); // 'Potensial' / 'Tidak'

            // --- 6. MANAJEMEN SALES ---
            $table->enum('status', ['New', 'Proses', 'Berhasil', 'Gagal'])->default('New');
            $table->foreignId('assigned_to')->nullable()->constrained('users'); // Sales yg pegang
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
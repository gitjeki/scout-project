<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // --- PERBAIKAN: Cek dulu apakah tabel sudah ada ---
        if (!Schema::hasTable('prospects')) {
            
            Schema::create('prospects', function (Blueprint $table) {
                $table->bigIncrements('id');

                // === Features (Data Nasabah) ===
                $table->integer('age')->nullable();
                $table->string('job', 100)->nullable();
                $table->string('education', 100)->nullable();
                $table->string('month', 20)->nullable();
                $table->decimal('duration', 10, 2)->nullable();
                $table->integer('campaign')->nullable();
                $table->string('poutcome', 50)->nullable();
                $table->text('description')->nullable();

                // === Data Ekonomi Makro ===
                $table->decimal('cons_price_idx', 10, 4)->nullable();
                $table->decimal('cons_conf_idx', 10, 4)->nullable();
                $table->decimal('euribor3m', 10, 4)->nullable();
                $table->decimal('nr_employed', 10, 2)->nullable();

                // === Foreign Keys ===
                $table->unsignedBigInteger('prospect_status_id');
                $table->unsignedBigInteger('created_by_user_id')->nullable();

                // === Timestamps ===
                $table->timestampTz('created_at')->useCurrent();
                $table->timestampTz('updated_at')->useCurrent()->useCurrentOnUpdate();

                // === Constraints ===
                // Pastikan tabel prospect_statuses ada sebelum ini dijalankan. 
                // Jika error foreign key, berarti tabel status belum dibuat.
                if (Schema::hasTable('prospect_statuses')) {
                    $table->foreign('prospect_status_id', 'fk_prospects_status')
                          ->references('id')->on('prospect_statuses');
                }

                if (Schema::hasTable('users')) {
                    $table->foreign('created_by_user_id', 'fk_prospects_creator')
                          ->references('id')->on('users');
                }
            });
        }
    }

    public function down(): void {
        Schema::dropIfExists('prospects');
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prediction_scores', function (Blueprint $table) {
            // Index Composite: Mempercepat pencarian berdasarkan prospect_id dan id sekaligus
         
            $table->index(['prospect_id', 'id']); 
        });
    }

    public function down(): void
    {
        Schema::table('prediction_scores', function (Blueprint $table) {
            $table->dropIndex(['prospect_id', 'id']);
        });
    }
};
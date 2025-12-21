<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('prediction_scores', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('prospect_id');
            $table->string('model_version', 50);
            $table->decimal('score_value', 5, 4);
            $table->integer('priority')->nullable();
            $table->unsignedBigInteger('scored_by_user_id')->nullable();

            $table->timestampTz('scored_at')->useCurrent();

            $table->foreign('prospect_id', 'fk_scores_prospect')
                  ->references('id')->on('prospects')
                  ->onDelete('cascade');

            $table->foreign('scored_by_user_id', 'fk_scores_user')
                  ->references('id')->on('users');
        });
    }

    public function down(): void {
        Schema::dropIfExists('prediction_scores');
    }
};

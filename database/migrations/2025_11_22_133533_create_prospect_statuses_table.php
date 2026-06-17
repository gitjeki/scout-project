<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('prospect_statuses', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('status_code', 50)->unique();
            $table->enum('status_type', ['open', 'closed']);
            $table->text('description')->nullable();

            $table->unsignedBigInteger('updated_by_user_id')->nullable();
            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('updated_by_user_id', 'fk_prospect_statuses_user')
                  ->references('id')->on('users');
        });
    }

    public function down(): void {
        Schema::dropIfExists('prospect_statuses');
    }
};

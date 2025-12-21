<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('contact_activities', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('prospect_id');
            $table->unsignedBigInteger('telemarketer_id');
            $table->unsignedBigInteger('prospect_status_id')->nullable();

            $table->string('contact_channel', 50)->nullable();
            $table->text('contact_notes')->nullable();
            $table->timestampTz('contact_at')->useCurrent();
            $table->integer('call_duration_sec')->nullable();

            $table->foreign('prospect_id', 'fk_activities_prospect')
                  ->references('id')->on('prospects')
                  ->onDelete('cascade');

            $table->foreign('telemarketer_id', 'fk_activities_telemarketer')
                  ->references('id')->on('users');

            $table->foreign('prospect_status_id', 'fk_activities_status')
                  ->references('id')->on('prospect_statuses');
        });
    }

    public function down(): void {
        Schema::dropIfExists('contact_activities');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('konfigurasi_dashboards', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // Identitas setting (misal: 'form_template')
            $table->json('value'); // Data template (defaults & dropdowns)
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('konfigurasi_dashboards');
    }
};
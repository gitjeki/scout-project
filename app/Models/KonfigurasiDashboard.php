<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KonfigurasiDashboard extends Model
{
    use HasFactory;

    protected $table = 'konfigurasi_dashboards';

    protected $fillable = [
        'key',
        'value',
    ];

    // Penting: Agar kolom 'value' otomatis dikonversi jadi Array/Object saat diambil
    protected $casts = [
        'value' => 'array',
    ];
}
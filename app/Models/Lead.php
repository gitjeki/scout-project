<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use SoftDeletes;

    // Izinkan semua kolom diisi (karena kita sudah validasi di Controller)
    protected $guarded = [];

    // Relasi ke User (Sales yang menangani)
    public function sales()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
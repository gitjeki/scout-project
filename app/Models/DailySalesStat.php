<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailySalesStat extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'hot_leads_target',
        'calls_made',
        'total_duration_sec'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
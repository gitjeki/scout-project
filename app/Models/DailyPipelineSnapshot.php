<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyPipelineSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'status_code',
        'count',
        'status_desc'
    ];
}
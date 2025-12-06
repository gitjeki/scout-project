<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PredictionScore extends Model
{
    use HasFactory;

    protected $table = 'prediction_scores';

    public $timestamps = false; 

    protected $fillable = [
        'prospect_id',
        'model_version',
        'score_value',
        'priority',
        'scored_by_user_id',
        'scored_at',
    ];

    protected $casts = [
        'score_value' => 'float',
        'scored_at'   => 'datetime',
    ];

    public function prospect()
    {
        return $this->belongsTo(Prospect::class, 'prospect_id');
    }

    /**
     * Relasi ke User (Digunakan di DashboardController)
     * Kita namakan 'user' agar sesuai dengan with('latestScore.user')
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'scored_by_user_id');
    }

    // (Opsional) Jika Anda masih ingin mempertahankan nama scoredBy untuk keperluan lain
    public function scoredBy()
    {
        return $this->belongsTo(User::class, 'scored_by_user_id');
    }
}
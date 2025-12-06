<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prospect extends Model
{
    use HasFactory;

    protected $table = 'prospects';

    protected $fillable = [
        'age',
        'job',
        'education',
        'month',
        'duration',
        'campaign',
        'poutcome',
        'cons_price_idx',
        'cons_conf_idx',
        'euribor3m',
        'nr_employed',
        'prospect_status_id',
        'created_by_user_id',
    ];

    protected $casts = [];

    public function status()
    {
        return $this->belongsTo(ProspectStatus::class, 'prospect_status_id');
    }

    public function scores()
    {
        return $this->hasMany(PredictionScore::class, 'prospect_id');
    }

    public function latestScore()
    {
        // ambil skor paling baru berdasarkan scored_at
        return $this->hasOne(PredictionScore::class, 'prospect_id')->latestOfMany('scored_at');
    }
    public function latestActivity()
{
    return $this->hasOne(ContactActivity::class, 'prospect_id')
                ->latest('contact_at');
}

public function contactActivities()
{
    return $this->hasMany(ContactActivity::class, 'prospect_id');
}
}
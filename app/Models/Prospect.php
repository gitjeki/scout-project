<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder; // <--- Tambahkan ini untuk type hinting query

class Prospect extends Model
{
    use HasFactory;

    protected $table = 'prospects';

    // Konstanta kolom vital untuk Machine Learning (BARU)
    // Digunakan untuk pengecekan data NULL secara otomatis
    public const ML_COLUMNS = [
        'age', 'job', 'education', 'month', 'duration', 'campaign',
        'poutcome', 'cons_price_idx', 'cons_conf_idx', 'euribor3m', 'nr_employed'
    ];

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
        'assigned_to', // Pastikan ini ada jika kamu pakai fitur assign sales
    ];

    protected $casts = [];

    // --- SCOPES BARU (Logika Data Control) ---

    /**
     * Scope: Hanya ambil data yang SEMUA kolom vitalnya terisi (NOT NULL).
     * Dipakai di DashboardController & Prediksi.
     */
    public function scopeReadyForPrediction(Builder $query)
    {
        return $query->where(function ($q) {
            foreach (self::ML_COLUMNS as $col) {
                $q->whereNotNull($col);
            }
        });
    }

    /**
     * Scope: Ambil data jika ADA SATU SAJA kolom vital yang NULL.
     * Dipakai di DataControlController.
     */
    public function scopeIncompleteData(Builder $query)
    {
        return $query->where(function ($q) {
            foreach (self::ML_COLUMNS as $col) {
                $q->orWhereNull($col);
            }
        });
    }


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
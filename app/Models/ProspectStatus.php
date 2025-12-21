<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProspectStatus extends Model
{
    const UPDATED_AT = 'updated_at';
    const CREATED_AT = null;

    protected $fillable = [
        'status_code',
        'status_type',
        'updated_by_user_id',
    ];

    protected $casts = [
        'updated_at' => 'datetime',
    ];

    public function prospects()
    {
        return $this->hasMany(Prospect::class, 'prospect_status_id');
    }

    public function contactActivities()
    {
        return $this->hasMany(ContactActivity::class, 'prospect_status_id');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }
}
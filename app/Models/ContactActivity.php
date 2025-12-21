<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactActivity extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'prospect_id',
        'telemarketer_id',
        'prospect_status_id',
        'contact_channel',
        'contact_notes',
        'contact_at',
        'call_duration_sec',
    ];

    protected $casts = [
        'contact_at' => 'datetime',
        'call_duration_sec' => 'integer',
    ];

    public function prospect()
    {
        return $this->belongsTo(Prospect::class, 'prospect_id');
    }

    public function telemarketer()
    {
        return $this->belongsTo(User::class, 'telemarketer_id');
    }

    public function status()
    {
        return $this->belongsTo(ProspectStatus::class, 'prospect_status_id');
    }
}
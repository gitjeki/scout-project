<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password_hash',
        'office_phone',
        'is_active',
        'role',
    ];

    /**
     * @var array<int, string>
     */
    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'password_hash' => 'hashed',
    ];

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public function createdProspects()
    {
        return $this->hasMany(Prospect::class, 'created_by_user_id');
    }

    public function contactActivities()
    {
        return $this->hasMany(ContactActivity::class, 'telemarketer_id');
    }

    public function predictionScores()
    {
        return $this->hasMany(PredictionScore::class, 'scored_by_user_id');
    }

    public function updatedStatuses()
    {
        return $this->hasMany(ProspectStatus::class, 'updated_by_user_id');
    }
}

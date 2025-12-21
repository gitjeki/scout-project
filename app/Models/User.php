<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes; // Tambahkan ini
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes; // Gunakan SoftDeletes

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',             // Baru
        'username',         // Baru
        'email',
        'password_hash',
        'office_phone',
        'is_active',
        'role',             // Diubah dari role_id menjadi role (string)
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'password_hash' => 'hashed', // Opsional: Casting modern Laravel
    ];

    /**
     * Override default password column name.
     * Laravel default looks for 'password', we tell it to look for 'password_hash'.
     */
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    // === RELATIONSHIPS ===

    // Relasi ke tabel Prospect (User yang menginput data nasabah)
    public function createdProspects()
    {
        return $this->hasMany(Prospect::class, 'created_by_user_id');
    }

    // Relasi ke tabel ContactActivity (Telemarketer yang menelpon)
    public function contactActivities()
    {
        return $this->hasMany(ContactActivity::class, 'telemarketer_id');
    }

    // Relasi ke tabel PredictionScore (User yang melakukan scoring manual)
    public function predictionScores()
    {
        return $this->hasMany(PredictionScore::class, 'scored_by_user_id');
    }

    // Relasi ke tabel ProspectStatus (Admin yang update master status)
    public function updatedStatuses()
    {
        return $this->hasMany(ProspectStatus::class, 'updated_by_user_id');
    }
}
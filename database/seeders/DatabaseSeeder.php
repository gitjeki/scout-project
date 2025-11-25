<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Buat Akun Admin
        User::create([
            'name' => 'Administrator',
            'username' => 'admin01',
            'email' => 'admin@bank.com',
            'role' => 'admin',
            'password' => Hash::make('password123'),
        ]);

        // 2. Buat Akun Sales (Telemarketing)
        User::create([
            'name' => 'Budi Sales',
            'username' => 'sales01',
            'email' => 'sales@bank.com',
            'role' => 'sales',
            'password' => Hash::make('password123'),
        ]);
    }
}
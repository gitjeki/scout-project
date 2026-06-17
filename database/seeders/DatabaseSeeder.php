<?php

namespace Database\Seeders;

<<<<<<< HEAD
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

=======
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
>>>>>>> origin/final
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
<<<<<<< HEAD
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
=======
        // 1. Matikan Foreign Key Checks agar aman saat truncate
        Schema::disableForeignKeyConstraints();

        $this->command->info('Starting database seeding...');

        // 2. Bersihkan data lama
        $this->command->info('Clearing existing data...');
        DB::table('prospect_statuses')->truncate();
        DB::table('users')->truncate();
       
        // 3. Setup Variabel Umum
        $passwordDefault = Hash::make('password123'); 
        $now = now();

        // 4. Insert User ADMIN & Tangkap ID-nya
        $this->command->info('Inserting Admin user...');
        
        $adminId = DB::table('users')->insertGetId([
            'name'          => 'Administrator Bank',
            'username'      => 'admin01',
            'email'         => 'admin@bank.com',
            'email_verified_at' => $now,
            'password_hash' => $passwordDefault,
            'role'          => 'admin',          
            'office_phone'  => '021-555-0001',
            'is_active'     => true,
            'created_at'    => $now,
            'updated_at'    => $now,
        ]);

        // 5. Insert User SALES (Telemarketer)
        $this->command->info('Inserting Sales users...');
        
        DB::table('users')->insert([
            [
                'name'          => 'Budi Sales',
                'username'      => 'sales01',
                'email'         => 'sales@bank.com',
                'email_verified_at' => $now,
                'password_hash' => $passwordDefault,
                'role'          => 'sales',
                'office_phone'  => '021-555-8888',
                'is_active'     => true,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'name'          => 'Siti Marketing',
                'username'      => 'sales02',
                'email'         => 'sales2@bank.com',
                'email_verified_at' => $now,
                'password_hash' => $passwordDefault,
                'role'          => 'sales',
                'office_phone'  => '021-555-9999',
                'is_active'     => true,
                'created_at'    => $now,
                'updated_at'    => $now,
            ]
        ]);
        
        $this->command->info('Users inserted: ' . DB::table('users')->count());

        // 6. Insert Prospect Statuses
        // updated_by_user_id diisi dengan variable $adminId yang kita tangkap di atas
        $this->command->info('Inserting prospect statuses...');

        $statuses = [
            ['code' => 'NEW',           'type' => 'open',            'desc' => 'Data baru, belum dihubungi'],
            ['code' => 'CONTACTED',     'type' => 'open',            'desc' => 'Sudah ditelepon, belum ada keputusan'],
            ['code' => 'INTERESTED',    'type' => 'open',            'desc' => 'Nasabah tertarik, butuh follow up'],
            ['code' => 'ACCEPTED',      'type' => 'closed',  'desc' => 'Nasabah setuju mendaftar'],
            ['code' => 'REFUSED',       'type' => 'closed',  'desc' => 'Nasabah menolak penawaran'],
            ['code' => 'NO_ANSWER',     'type' => 'closed',  'desc' => 'Telepon tidak diangkat berkali-kali'],
            ['code' => 'INVALID_NUMBER','type' => 'closed',  'desc' => 'Nomor telepon salah/tidak terdaftar'],
        ];

        foreach ($statuses as $status) {
            DB::table('prospect_statuses')->insert([
                'status_code'        => $status['code'],
                'status_type'        => $status['type'],
                'description'        => $status['desc'],
                'updated_by_user_id' => $adminId, 
                'updated_at'         => $now,
            ]);
        }

        $this->command->info('Prospect statuses inserted: ' . DB::table('prospect_statuses')->count());

        // 7. Nyalakan Kembali Foreign Key Checks
        Schema::enableForeignKeyConstraints();

        // 8. Output Ringkasan
        $this->command->info('');
        $this->command->info('DATABASE SEEDING COMPLETED');
        $this->command->table(
            ['Table', 'Count'],
            [
                ['users', DB::table('users')->count()],
                ['prospect_statuses', DB::table('prospect_statuses')->count()],
            ]
        );

        $this->command->info('');
        $this->command->info('Login Credentials (Password: password123):');
        $this->command->info('1. Admin: admin@bank.com');
        $this->command->info('2. Sales: sales@bank.com');
        $this->command->info('2. Sales: sales2@bank.com');

    }
}
>>>>>>> origin/final

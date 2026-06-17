# Scout Project

Sistem manajemen prospek dan prediksi lead scoring berbasis web untuk institusi perbankan. Aplikasi ini membantu tim sales memprioritaskan calon nasabah menggunakan model Machine Learning (Decision Tree), sehingga proses telemarketing menjadi lebih efektif dan terarah.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Laravel 12, PHP 8.2+ |
| Frontend | React 18, Inertia.js, Tailwind CSS |
| Database | PostgreSQL |
| ML API | Python Flask, scikit-learn (Decision Tree) |

## Fitur Utama

### Admin
- **Dashboard** — Statistik prospek, import data CSV, dan konfigurasi sistem
- **Prediksi ML** — Jalankan model Decision Tree untuk scoring otomatis pada data prospek
- **Penugasan** — Distribusi prospek ke tim sales berdasarkan skor prediksi
- **Manajemen User** — CRUD user (admin & sales) dengan soft delete
- **Data Control** — Identifikasi dan kelola data prospek yang tidak lengkap
- **Reset Password** — Reset password user secara manual

### Sales
- **Workspace** — Daftar prospek yang ditugaskan dengan filter & sorting (prioritas, status, tanggal kontak)
- **Log Aktivitas** — Catat setiap panggilan telepon, durasi, dan catatan
- **Pipeline** — Lacak status prospek (NEW → CONTACTED → INTERESTED → ACCEPTED/REFUSED)

## Persyaratan

- PHP >= 8.2
- Composer
- Node.js >= 18
- PostgreSQL
- Python >= 3.8 (untuk ML API)

## Instalasi

### 1. Clone & Setup Laravel

```bash
git clone https://github.com/gitjeki/scout-project.git
cd scout-project
composer install
npm install
```

### 2. Konfigurasi Environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit file `.env` dan sesuaikan konfigurasi database:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=scout_project
DB_USERNAME=postgres
DB_PASSWORD=dzakyfauzan23
```

### 3. Setup Database

Buat database `scout_project` di PostgreSQL, lalu jalankan:

```bash
php artisan migrate --seed
```

### 4. Setup ML API

```bash
cd ml_api
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install flask pandas joblib scikit-learn
```

### 5. Jalankan Aplikasi

**Terminal 1** — Laravel + Vite:

```bash
php artisan serve
npm run dev
```

**Terminal 2** — ML API (dari folder `ml_api`):

```bash
cd ml_api
venv\Scripts\activate
python ml_api.py
```

Akses aplikasi di `http://127.0.0.1:8000`

## Akun Default

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bank.com | password123 |
| Sales | sales@bank.com | password123 |
| Sales | sales2@bank.com | password123 |

## Struktur Project

```
scout-project/
├── app/
│   ├── Http/Controllers/    # Controller (Dashboard, Sales, User, dll)
│   ├── Http/Middleware/      # RoleMiddleware, HandleInertiaRequests
│   └── Models/               # Eloquent models
├── database/
│   ├── migrations/           # Schema database
│   └── seeders/              # Data awal (users, statuses)
├── resources/
│   ├── js/
│   │   ├── Components/       # Komponen React reusable
│   │   ├── Layouts/          # Layout wrapper
│   │   └── Pages/            # Halaman React (Admin, Sales, Auth)
│   └── css/                  # Tailwind CSS
├── routes/
│   ├── web.php               # Route utama (admin, sales, shared)
│   └── auth.php              # Route autentikasi
└── ml_api/                   # Flask API untuk prediksi ML
    ├── ml_api.py             # Endpoint prediksi
    ├── decision_tree_model.pkl
    └── target_encoder.pkl
```

## Lisensi

MIT License

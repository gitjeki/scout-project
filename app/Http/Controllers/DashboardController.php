<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\ProspectStatus;
use App\Models\PredictionScore;
use App\Models\ContactActivity;       // Model Baru
use App\Models\DailySalesStat;        // Model Baru
use App\Models\DailyPipelineSnapshot; // Model Baru
use App\Models\User;                  // Model Baru (Opsional jika butuh query user)
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia; 
use Carbon\Carbon;

class DashboardController extends Controller
{
    // --- KONFIGURASI STATUS (Untuk Pipeline Sales) ---
    private const PROSPECT_STATUSES = [
        ['code' => 'NEW',            'type' => 'open',            'desc' => 'Data baru, belum dihubungi'],
        ['code' => 'CONTACTED',      'type' => 'open',            'desc' => 'Sudah ditelepon, belum ada keputusan'],
        ['code' => 'INTERESTED',     'type' => 'open',            'desc' => 'Nasabah tertarik, butuh follow up'],
        ['code' => 'ACCEPTED',       'type' => 'closed_accepted', 'desc' => 'Nasabah setuju mendaftar'],
        ['code' => 'REFUSED',        'type' => 'closed_refused',  'desc' => 'Nasabah menolak penawaran'],
        ['code' => 'NO_ANSWER',      'type' => 'closed_refused',  'desc' => 'Telepon tidak diangkat berkali-kali'],
        ['code' => 'INVALID_NUMBER', 'type' => 'closed_refused',  'desc' => 'Nomor telepon salah/tidak terdaftar'],
    ];

    /**
     * Menampilkan Dashboard
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isSales = $user->role === 'sales';

        // --- 1. STATISTIK UMUM (Dipakai Admin) ---
        $stats = [
            'total_input' => Prospect::count(),
            'today_input' => Prospect::whereDate('created_at', Carbon::today())->count(),
            'total_predicted' => PredictionScore::count(),
            'today_predicted' => PredictionScore::whereDate('scored_at', Carbon::today())->count(),
        ];

        // --- 2. STATISTIK KHUSUS SALES (Personal & Pipeline) ---
        $personalStats = null;
        $pipelineStats = null;

        if ($isSales) {
            // A. Hitung Personal Stats
            $today = now()->format('Y-m-d');
            
            // Hitung Hot Leads (Target)
            $hotLeads = Prospect::whereHas('status', fn($q) => $q->where('status_code', 'NEW'))
                ->whereHas('latestScore', fn($q) => $q->where('priority', 1))
                ->count();

            // Hitung Calls Made Hari Ini
            $callsMade = ContactActivity::where('telemarketer_id', $user->id)
                ->whereDate('contact_at', $today)->count();

            // Hitung Durasi Telepon Hari Ini
            $durationSec = ContactActivity::where('telemarketer_id', $user->id)
                ->whereDate('contact_at', $today)->sum('call_duration_sec');

            // Simpan ke DB (Sync ke tabel DailySalesStat)
            $statRecord = DailySalesStat::updateOrCreate(
                ['user_id' => $user->id, 'date' => $today],
                [
                    'hot_leads_target' => $hotLeads,
                    'calls_made' => $callsMade,
                    'total_duration_sec' => $durationSec
                ]
            );

            $personalStats = [
                'hot_leads' => $statRecord->hot_leads_target,
                'calls_today' => $statRecord->calls_made,
                'duration_min' => round($statRecord->total_duration_sec / 60, 1),
            ];

            // B. Hitung Global Pipeline Stats
            $allStatuses = collect(self::PROSPECT_STATUSES)->where('code', '!==', 'NEW')->values();
            $pipelineStats = [];

            foreach ($allStatuses as $status) {
                // Hitung jumlah per status
                $count = Prospect::whereHas('status', function($q) use ($status) {
                    $q->where('status_code', $status['code']);
                })->count();

                // Simpan ke DB (Sync ke tabel DailyPipelineSnapshot)
                $snapshot = DailyPipelineSnapshot::updateOrCreate(
                    ['date' => $today, 'status_code' => $status['code']],
                    ['count' => $count, 'status_desc' => $status['desc']]
                );

                $pipelineStats[] = [
                    'code' => $snapshot->status_code,
                    'desc' => $snapshot->status_desc,
                    'count' => $snapshot->count,
                    'color' => $this->getStatusColor($snapshot->status_code)
                ];
            }
        }

        // --- 3. Query Data Tabel (Utama untuk Admin) ---
        // Jika sales tidak boleh lihat tabel utama, data ini tidak akan dirender di frontend (logic ada di JSX)
        $query = Prospect::with(['status', 'latestScore'])
            ->readyForPrediction(); 

        // Filter Status
        if ($request->has('status') && $request->status != '') {
            $query->whereHas('status', function($q) use ($request) {
                $q->where('status_code', $request->status);
            });
        }

        // Ambil Opsi Status
        $statusOptions = ProspectStatus::select('status_code')
            ->distinct()
            ->orderBy('status_code')
            ->pluck('status_code');

        // Pagination & Formatting
        $prospects = $query->orderByDesc('id')
            ->paginate(50)
            ->withQueryString()
            ->through(function ($item) {
                return [
                    'id'             => $item->id,
                    'status'         => $item->status ? $item->status->status_code : 'UNKNOWN',
                    'score'          => $item->latestScore ? $item->latestScore->score_value : null,
                    'priority'       => $item->latestScore ? $item->latestScore->priority : null,
                    'scored_at'      => $item->latestScore 
                                            ? Carbon::parse($item->latestScore->scored_at)->format('d M Y H:i') 
                                            : null,
                    'age'            => $item->age,
                    'job'            => $item->job,
                    'education'      => $item->education,
                    'month'          => $item->month,
                    'duration'       => $item->duration,
                    'campaign'       => $item->campaign,
                    'poutcome'       => $item->poutcome,
                    'cons_price_idx' => $item->cons_price_idx,
                    'cons_conf_idx'  => $item->cons_conf_idx,
                    'euribor3m'      => $item->euribor3m,
                    'nr_employed'    => $item->nr_employed,
                ];
            });

        return Inertia::render('Dashboard', [
            'prospects'     => $prospects,
            'statusOptions' => $statusOptions,        
            'filters'       => $request->only(['status']),
            'stats'         => $stats,
            // Data tambahan untuk Sales
            'personalStats' => $personalStats, 
            'pipelineStats' => $pipelineStats 
        ]);
    }

    /**
     * Fitur Tambah Manual
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'age'            => 'required|numeric',
            'job'            => 'required|string',
            'education'      => 'required|string',
            'month'          => 'required|string',
            'duration'       => 'required|numeric',
            'campaign'       => 'required|numeric',
            'poutcome'       => 'required|string',
            'cons_price_idx' => 'required|numeric',
            'cons_conf_idx'  => 'required|numeric',
            'euribor3m'      => 'required|numeric',
            'nr_employed'    => 'required|numeric',
        ]);

        DB::beginTransaction();
        try {
            $defaultStatus = ProspectStatus::firstOrCreate(
                ['status_code' => 'NEW'],
                ['status_type' => 'open']
            );

            $validated['prospect_status_id'] = $defaultStatus->id;
            $validated['created_by_user_id'] = auth()->id();

            Prospect::create($validated);

            DB::commit();
            return back()->with('success', 'Data prospek berhasil ditambahkan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menyimpan: ' . $e->getMessage());
        }
    }

    /**
     * Fitur Update Data
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'age'            => 'numeric|nullable',
            'job'            => 'string|nullable',
            'education'      => 'string|nullable',
            'assigned_to'    => 'numeric|nullable|exists:users,id', 
            'month'          => 'string|nullable',
            'duration'       => 'numeric|nullable',
            'campaign'       => 'numeric|nullable',
            'poutcome'       => 'string|nullable',
            'cons_price_idx' => 'numeric|nullable',
            'cons_conf_idx'  => 'numeric|nullable',
            'euribor3m'      => 'numeric|nullable',
            'nr_employed'    => 'numeric|nullable',
        ]);

        DB::beginTransaction();
        try {
            $prospect = Prospect::findOrFail($id);
            
            // Update
            $prospect->update($validated);

            // Reset Score jika data vital berubah
            $dataVital = ['age', 'duration', 'campaign', 'poutcome'];
            if ($prospect->wasChanged($dataVital)) {
                $prospect->scores()->delete();
            }

            DB::commit();
            return back()->with('success', 'Data diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal update: ' . $e->getMessage());
        }
    }
    
    /**
     * Fitur Hapus Satuan
     */
    public function destroy($id)
    {
        try {
            $prospect = Prospect::findOrFail($id);
            $prospect->delete();
            return back()->with('success', 'Data prospek berhasil dihapus.');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menghapus: ' . $e->getMessage());
        }
    }

    /**
     * Fitur Hapus Batch (Diperbarui)
     */
    public function bulkDestroy(Request $request)
    {
        ini_set('max_execution_time', 0);
        set_time_limit(0);

        $type = $request->input('type'); 

        DB::beginTransaction();
        try {
            $count = 0;

            if ($type === 'selection') {
                $ids = $request->input('ids', []);
                
                if (!is_array($ids) || empty($ids)) {
                    return back()->with('error', 'Tidak ada data valid yang dipilih.');
                }
                
                $count = Prospect::whereIn('id', $ids)->delete();

            } elseif ($type === 'all_filtered') {
                $statusFilter = $request->input('status');
                
                $query = Prospect::query();
                
                if ($statusFilter) {
                    $query->whereHas('status', function($q) use ($statusFilter) {
                        $q->where('status_code', $statusFilter);
                    });
                }
                
                $count = $query->delete();
            }

            DB::commit();
            return back()->with('success', "Berhasil menghapus {$count} data prospek.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal hapus batch: ' . $e->getMessage());
        }
    }

    /**
     * Fitur Import CSV
     */
    public function import(Request $request)
    {
        ini_set('max_execution_time', 0);
        set_time_limit(0);

        if ($request->user()->role !== 'admin') {
            abort(403, 'Akses Ditolak.');
        }

        // Validasi File
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:10240', // Max 10MB
        ], [
            'csv_file.required' => 'File CSV wajib diunggah.',
            'csv_file.mimes'    => 'Format file harus CSV atau TXT.',
            'csv_file.max'      => 'Ukuran file maksimal 10MB.',
        ]);

        try {
            $file = $request->file('csv_file');
            $path = $file->getRealPath();

            $handle    = fopen($path, 'r');
            $firstLine = fgets($handle);
            fclose($handle);

            $delimiter = ';';
            if (substr_count($firstLine, ',') > substr_count($firstLine, ';')) {
                $delimiter = ',';
            }

            $csv = array_map(function ($line) use ($delimiter) {
                return str_getcsv($line, $delimiter);
            }, file($path));

            if (empty($csv)) return back()->with('error', 'File CSV kosong.');

            $header = array_map(function ($col) {
                return strtolower(trim($col));
            }, array_shift($csv));

            $columnMapping = [
                'age'            => 'age',
                'job'            => 'job',
                'education'      => 'education',
                'month'          => 'month',
                'duration'       => 'duration',
                'campaign'       => 'campaign',
                'poutcome'       => 'poutcome',
                'cons.price.idx' => 'cons_price_idx',
                'cons_price_idx' => 'cons_price_idx',
                'cons.conf.idx'  => 'cons_conf_idx',
                'cons_conf_idx'  => 'cons_conf_idx',
                'euribor3m'      => 'euribor3m',
                'nr.employed'    => 'nr_employed',
                'nr_employed'    => 'nr_employed',
            ];

            $headerIndexes = [];
            foreach ($header as $index => $columnName) {
                if (isset($columnMapping[$columnName])) {
                    $dbColumn = $columnMapping[$columnName];
                    $headerIndexes[$dbColumn] = $index;
                }
            }

            if (empty($headerIndexes)) return back()->with('error', 'Header CSV tidak sesuai format.');

            $defaultStatus = ProspectStatus::firstOrCreate(
                ['status_code' => 'NEW'],
                ['status_type' => 'open']
            );

            $imported = 0;
            $skipped  = 0;

            DB::beginTransaction();

            foreach ($csv as $rowNum => $row) {
                if (empty(array_filter($row))) continue;

                $data = [];
                foreach ($headerIndexes as $dbColumn => $csvIndex) {
                    if (array_key_exists($csvIndex, $row)) {
                        $value = trim($row[$csvIndex]);
                        $data[$dbColumn] = ($value === '' || strtolower($value) === 'unknown') ? null : $value;
                    }
                }

                $nonNullValues = array_filter($data, fn($v) => !is_null($v));
                if (empty($nonNullValues)) {
                    $skipped++;
                    continue;
                }

                $data['prospect_status_id'] = $defaultStatus->id;
                $data['created_by_user_id'] = auth()->id() ?? null;

                try {
                    Prospect::create($data);
                    $imported++;
                } catch (\Exception $e) {
                    $skipped++;
                }
            }

            DB::commit();
            
            if ($imported > 0) {
                return back()->with('success', "Import selesai: {$imported} data berhasil masuk.");
            } else {
                return back()->with('error', "Import gagal. Tidak ada data valid yang ditemukan.");
            }

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal import sistem: ' . $e->getMessage());
        }
    }

    /**
     * Fitur Run Predictions
     */
    public function runPredictions(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Akses Ditolak.');
        }

        ini_set('max_execution_time', 0); 
        set_time_limit(0); 

        $totalProcessed = 0;
        $totalFailed    = 0;

        $query = Prospect::readyForPrediction()
            ->whereDoesntHave('scores');

        // Chunking untuk memory efficiency
        $query->chunkById(2000, function ($prospects) use (&$totalProcessed, &$totalFailed) {
            
            $payload = [];

            foreach ($prospects as $prospect) {
                $payload[] = [
                    'id'             => $prospect->id, 
                    'age'            => (int) $prospect->age,
                    'job'            => (string) $prospect->job,
                    'education'      => (string) $prospect->education,
                    'month'          => (string) $prospect->month,
                    'duration'       => (float) $prospect->duration,
                    'campaign'       => (int) $prospect->campaign,
                    'poutcome'       => (string) $prospect->poutcome,
                    'cons.price.idx' => (float) $prospect->cons_price_idx,
                    'cons.conf.idx'  => (float) $prospect->cons_conf_idx,
                    'euribor3m'      => (float) $prospect->euribor3m,
                    'nr.employed'    => (float) $prospect->nr_employed,
                ];
            }

            if (empty($payload)) return;

            try {
                // Pastikan URL Microservice Python Benar
                $response = Http::timeout(300)->post('http://127.0.0.1:8001/predict_batch', [
                    'data' => $payload
                ]);

                if ($response->successful()) {
                    $results = $response->json();
                    
                    foreach ($results as $res) {
                        try {
                            $pId  = $res['id'];
                            $prob = (float) $res['probability'];
                            
                            if ($prob >= 0.8) $priority = 1;
                            elseif ($prob >= 0.5) $priority = 2;
                            else $priority = 3;

                            PredictionScore::create([
                                'prospect_id'       => $pId,
                                'model_version'     => 'decision_tree_v1',
                                'score_value'       => $prob,
                                'priority'          => $priority,
                                'scored_by_user_id' => auth()->id() ?? null,
                            ]);

                            $totalProcessed++;
                        } catch (\Exception $e) {
                            \Log::error("Gagal simpan score ID {$res['id']}: " . $e->getMessage());
                        }
                    }

                } else {
                    \Log::error("Python API Error: " . $response->body());
                    $totalFailed += count($payload);
                }

            } catch (\Exception $e) {
                \Log::error("Batch Prediction Exception: " . $e->getMessage());
                $totalFailed += count($payload);
            }
        });

        if ($totalProcessed > 0) {
            return redirect()->route('dashboard')
                ->with('success', "Proses selesai. {$totalProcessed} data berhasil diprediksi.");
        } else {
            return redirect()->route('dashboard')
                ->with('error', "Gagal memproses. Cek koneksi ke Service Python.");
        }
    }

    /**
     * Helper Function: Menentukan warna status
     */
    private function getStatusColor($code) {
        return match($code) {
            'CONTACTED' => 'blue', 
            'INTERESTED' => 'purple', 
            'ACCEPTED' => 'green',
            'REFUSED' => 'red', 
            'NO_ANSWER' => 'orange', 
            'INVALID_NUMBER' => 'gray', 
            default => 'gray'
        };
    }
}
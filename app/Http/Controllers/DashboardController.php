<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\ProspectStatus;
use App\Models\PredictionScore;
use App\Models\KonfigurasiDashboard; 
use App\Models\ContactActivity; 
use App\Models\User; // Tambahkan Model User
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia; 
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Menampilkan Dashboard
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isSales = $user->role === 'sales';

        // --- 1. AMBIL KONFIGURASI TEMPLATE FORM ---
        $configRecord = KonfigurasiDashboard::where('key', 'form_template')->first();
        
        $formTemplate = $configRecord ? $configRecord->value : [
            'defaults' => [
                'cons_price_idx' => 93.200,
                'cons_conf_idx'  => -36.1,
                'euribor3m'      => 4.857,
                'nr_employed'    => 5191,
            ],
            'dropdowns' => [
                'jobs' => ['admin.', 'blue-collar', 'technician', 'services', 'management', 'retired', 'entrepreneur', 'self-employed', 'housemaid', 'student'],
                'education' => ['university.degree', 'high.school', 'basic.9y', 'professional.course', 'basic.4y', 'basic.6y', 'illiterate'],
                'poutcome' => ['nonexistent', 'failure', 'success']
            ]
        ];

        // --- 2. STATISTIK SISTEM (ADMIN) ---
        $stats = [
            'total_input' => Prospect::count(),
            'today_input' => Prospect::whereDate('created_at', Carbon::today())->count(),
            'total_predicted' => PredictionScore::count(),
            'today_predicted' => PredictionScore::whereDate('scored_at', Carbon::today())->count(),
        ];

        // --- 3. STATISTIK REAL-TIME KHUSUS SALES ---
        $personalStats = null;
        $personalPipelineStats = [];
        $globalPipelineStats = [];

        if ($isSales) {
            
            $myCallsQuery = ContactActivity::whereHas('prospect', function($q) use ($user) {
                $q->where('assigned_to', $user->id);
            });

            // Clone query agar bisa dipakai berkali-kali (count & sum)
            $callsToday = (clone $myCallsQuery)->whereDate('contact_at', Carbon::today())->count();
            $durationTotal = (clone $myCallsQuery)->whereDate('contact_at', Carbon::today())->sum('call_duration_sec');

            $personalStats = [
                'hot_leads' => Prospect::where('assigned_to', $user->id)
                    ->whereHas('status', fn($q) => $q->where('status_code', 'NEW'))
                    ->count(),

                // Total Calls Hari Ini
                'calls_today' => $callsToday,

                // Durasi Bicara Hari Ini (Menit)
                'duration_min' => round($durationTotal / 60, 1),
            ];
        
            // Jika ingin 'NEW' tetap muncul di pipeline bawah, hapus ->where('status_code', '!=', 'NEW')
            $allStatuses = ProspectStatus::where('status_code', '!=', 'NEW')
                ->orderBy('id') 
                ->get();

            // 2. Hitung Jumlah Personal (Group by status_id)
            $userCounts = Prospect::where('assigned_to', $user->id)
                ->select('prospect_status_id', DB::raw('count(*) as total'))
                ->groupBy('prospect_status_id')
                ->pluck('total', 'prospect_status_id'); 

            // 3. Hitung Jumlah Global (Group by status_id)
            $globalCounts = Prospect::select('prospect_status_id', DB::raw('count(*) as total'))
                ->groupBy('prospect_status_id')
                ->pluck('total', 'prospect_status_id');

            // 4. Mapping Data Personal (Looping Status agar yang 0 tetap muncul)
            $personalPipelineStats = $allStatuses->map(function($status) use ($userCounts) {
                return [
                    'code'  => $status->status_code,
                    'count' => $userCounts[$status->id] ?? 0, 
                    'desc'  => $this->getStatusDesc($status->status_code),
                    'color' => $this->getStatusColor($status->status_code)
                ];
            });

            // 5. Mapping Data Global
            $globalPipelineStats = $allStatuses->map(function($status) use ($globalCounts) {
                return [
                    'code'  => $status->status_code,
                    'count' => $globalCounts[$status->id] ?? 0,
                    'desc'  => 'Total Global',
                    'color' => 'gray'
                ];
            });
        }

        // --- 4. QUERY DATA TABEL (PAGINATION & SEARCH) ---
        $query = Prospect::with(['status', 'latestScore.user'])
            ->withCount('contactActivities as call_count') // Virtual column call_count
            ->readyForPrediction(); 

        // Filter Search ID
        if ($request->has('search_id') && $request->search_id != '') {
            $query->where('id', $request->search_id);
        }

        // Filter Status
        if ($request->has('status') && $request->status != '') {
            $query->whereHas('status', function($q) use ($request) {
                $q->where('status_code', $request->status);
            });
        }

        // Filter Priority
        if ($request->has('priority') && $request->priority != '') {
            $query->whereHas('latestScore', function($q) use ($request) {
                $q->where('priority', $request->priority);
            });
        }

        // --- [BARU] Filter Scored By (User) ---
        if ($request->has('scored_by') && $request->scored_by != '') {
            $query->whereHas('latestScore', function($q) use ($request) {
                $q->where('scored_by_user_id', $request->scored_by);
            });
        }

        // --- [BARU] Filter Scored At (Waktu) ---
        if ($request->has('scored_at') && $request->scored_at != '') {
            $query->whereHas('latestScore', function($q) use ($request) {
                $val = $request->scored_at;
                $now = Carbon::now();

                if ($val === 'today') {
                    $q->whereDate('scored_at', $now->toDateString());
                } elseif ($val === 'this_week') {
                    $start = $now->copy()->startOfWeek()->format('Y-m-d H:i:s');
                    $end   = $now->copy()->endOfWeek()->format('Y-m-d H:i:s');
                    $q->whereBetween('scored_at', [$start, $end]);
                } elseif ($val === 'this_month') {
                    $q->whereMonth('scored_at', $now->month)
                      ->whereYear('scored_at', $now->year);
                }
            });
        }

        // Sorting
        $sortField = $request->input('sort_field', 'score'); 
        $sortDirection = $request->input('sort_direction', 'desc');

        if ($sortField === 'score') {
            $query->orderBy(
                PredictionScore::select('score_value')
                    ->whereColumn('prospect_id', 'prospects.id')
                    ->latest('id')->limit(1),
                $sortDirection
            );
        } elseif ($sortField === 'priority') {
            $query->orderBy(
                PredictionScore::select('priority')
                    ->whereColumn('prospect_id', 'prospects.id')
                    ->latest('id')->limit(1),
                $sortDirection
            );
        } elseif ($sortField === 'call_count') {
            $query->orderBy('call_count', $sortDirection);
        } else {
            $query->orderBy($sortField, $sortDirection);
        }

        // Data untuk Dropdown Filter
        $statusOptions = ProspectStatus::select('status_code')
            ->distinct()
            ->orderBy('status_code')
            ->pluck('status_code');

        // [BARU] Data Dropdown Scored By (Ambil user yang pernah melakukan scoring)
        $scoringUsers = User::whereHas('predictionScores')->select('id', 'name')->get();

        $prospects = $query->paginate(10)
            ->withQueryString()
            ->through(function ($item) {
                // Hitung total durasi manual dari relasi
                $totalDuration = $item->contactActivities->sum('call_duration_sec');

                return [
                    'id'             => $item->id,
                    'status'         => $item->status ? $item->status->status_code : 'UNKNOWN',
                    'score'          => $item->latestScore ? $item->latestScore->score_value : null,
                    'priority'       => $item->latestScore ? $item->latestScore->priority : null,
                    'scored_at'      => $item->latestScore 
                                            ? Carbon::parse($item->latestScore->scored_at)->format('d M Y H:i') 
                                            : null,
                    'assigned_to'    => $item->assignedUser ? $item->assignedUser->name : '-',
                    'scored_by'      => $item->latestScore && $item->latestScore->user 
                                            ? $item->latestScore->user->name 
                                            : '-',
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
                    
                    // Tambahan Data untuk Frontend
                    'call_count'         => $item->call_count, 
                    'total_duration_sec' => $totalDuration,    
                    'last_contact_at'    => $item->latestActivity 
                                                ? Carbon::parse($item->latestActivity->contact_at)->diffForHumans() 
                                                : '-',
                    'telemarketer_name'  => $item->latestActivity && $item->latestActivity->telemarketer 
                                                ? $item->latestActivity->telemarketer->name 
                                                : '-',
                ];
            });

        return Inertia::render('Dashboard', [
            'prospects'     => $prospects,
            'statusOptions' => $statusOptions,        
            'scoringUsers'  => $scoringUsers, // [BARU] Pass ke frontend
            'filters'       => $request->only(['status', 'priority', 'sort_field', 'sort_direction', 'search_id', 'scored_by', 'scored_at']),
            'stats'         => $stats,
            'personalStats' => $personalStats, 
            'personalPipelineStats' => $personalPipelineStats, 
            'globalPipelineStats' => $globalPipelineStats,     
            'formTemplate'  => $formTemplate 
        ]);
    }

    /**
     * Helper Warna untuk Pipeline
     */
    private function getStatusColor($code) {
        return match($code) {
            'CONTACTED' => 'blue', 
            'INTERESTED' => 'purple', 
            'ACCEPTED' => 'green',
            'REFUSED' => 'red', 
            'NO_ANSWER' => 'orange', 
            'INVALID_NUMBER' => 'gray', 
            'NEW' => 'blue', // Default
            default => 'gray'
        };
    }

    /**
     * Helper Deskripsi Status (Hardcoded agar tidak error DB)
     */
    private function getStatusDesc($code) {
        return match($code) {
            'NEW' => 'Data baru, belum dihubungi',
            'CONTACTED' => 'Sudah ditelepon, belum ada keputusan',
            'INTERESTED' => 'Nasabah tertarik, butuh follow up',
            'ACCEPTED' => 'Nasabah setuju mendaftar',
            'REFUSED' => 'Nasabah menolak penawaran',
            'NO_ANSWER' => 'Telepon tidak diangkat berkali-kali',
            'INVALID_NUMBER' => 'Nomor telepon salah/tidak terdaftar',
            default => 'Status: ' . $code
        };
    }

    /**
     * Update Konfigurasi Template
     */
    public function updateConfiguration(Request $request)
    {
        $validated = $request->validate([
            'defaults.cons_price_idx' => 'required|numeric',
            'defaults.cons_conf_idx'  => 'required|numeric',
            'defaults.euribor3m'      => 'required|numeric',
            'defaults.nr_employed'    => 'required|numeric',
            'dropdowns.jobs'          => 'required|array',
            'dropdowns.education'     => 'required|array',
        ]);

        try {
            KonfigurasiDashboard::updateOrCreate(
                ['key' => 'form_template'],
                ['value' => $request->all()] 
            );
            return back()->with('success', 'Konfigurasi template berhasil disimpan.');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menyimpan konfigurasi: ' . $e->getMessage());
        }
    }

    /**
     * Tambah Manual
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'age'            => 'required|numeric|min:1',
            'job'            => 'required|string',
            'education'      => 'required|string',
            'month'          => 'required|string',
            'duration'       => 'required|numeric|min:1',
            'campaign'       => 'required|numeric|min:1',
            'poutcome'       => 'required|string',
            'cons_price_idx' => 'required|numeric|not_in:0', 
            'cons_conf_idx'  => 'required|numeric|not_in:0',
            'euribor3m'      => 'required|numeric|not_in:0',
            'nr_employed'    => 'required|numeric|min:1',
        ]);

        DB::beginTransaction();
        try {
            $defaultStatus = ProspectStatus::firstOrCreate(
                ['status_code' => 'NEW'],
                ['status_type' => 'open']
            );

            $validated['prospect_status_id'] = $defaultStatus->id;
            $validated['created_by_user_id'] = auth()->id();
            if($request->user()->role === 'sales') {
                $validated['assigned_to'] = auth()->id();
            }

            Prospect::create($validated);

            DB::commit();
            return back()->with('success', 'Data prospek berhasil ditambahkan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menyimpan: ' . $e->getMessage());
        }
    }

    /**
     * Update Data
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'age'            => 'numeric|nullable|min:1',
            'job'            => 'string|nullable',
            'education'      => 'string|nullable',
            'month'          => 'string|nullable',
            'duration'       => 'numeric|nullable|min:1',
            'campaign'       => 'numeric|nullable|min:1',
            'poutcome'       => 'string|nullable',
            'cons_price_idx' => 'numeric|nullable|not_in:0',
            'cons_conf_idx'  => 'numeric|nullable|not_in:0',
            'euribor3m'      => 'numeric|nullable|not_in:0',
            'nr_employed'    => 'numeric|nullable|min:1',
        ]);

        DB::beginTransaction();
        try {
            $prospect = Prospect::findOrFail($id);
            $prospect->update($validated);
            
            if ($prospect->scores()->exists()) {
                $prospect->scores()->delete();
            }

            DB::commit();
            return back()->with('success', 'Data diperbarui. Score di-reset agar bisa diprediksi ulang.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal update: ' . $e->getMessage());
        }
    }
    
    /**
     * Hapus Satuan
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
     * Hapus Batch
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
     * Import CSV
     */
    public function import(Request $request)
    {
        ini_set('max_execution_time', 0);
        set_time_limit(0);

        if ($request->user()->role !== 'admin') {
            abort(403, 'Akses Ditolak.');
        }

        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:10240',
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

            $nonZeroColumns = [
                'age', 'duration', 'campaign', 'nr_employed', 
                'cons_price_idx', 'cons_conf_idx', 'euribor3m'
            ];

            DB::beginTransaction();

            foreach ($csv as $rowNum => $row) {
                if (empty(array_filter($row))) continue;

                $data = [];
                foreach ($headerIndexes as $dbColumn => $csvIndex) {
                    if (array_key_exists($csvIndex, $row)) {
                        $value = trim($row[$csvIndex]);
                        
                        if ($value === '' || strtolower($value) === 'unknown') {
                            $data[$dbColumn] = null;
                        } elseif ($value == '0' && in_array($dbColumn, $nonZeroColumns)) {
                            $data[$dbColumn] = null; 
                        } else {
                            $data[$dbColumn] = $value;
                        }
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
     * Run Predictions
     */
    public function runPredictions(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Akses Ditolak.');
        }

        ini_set('max_execution_time', 0); 
        set_time_limit(0); 

        $pendingQuery = Prospect::readyForPrediction()->whereDoesntHave('scores');
        $pendingCount = $pendingQuery->count();

        if ($pendingCount === 0) {
            return back()->with('success', 'Semua data sudah diprediksi.');
        }

        $totalProcessed = 0;
        $totalFailed    = 0;

        $pendingQuery->chunkById(2000, function ($prospects) use (&$totalProcessed, &$totalFailed) {
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

                            PredictionScore::updateOrCreate(
                                ['prospect_id' => $pId],
                                [
                                    'model_version'     => 'decision_tree_v1',
                                    'score_value'       => $prob,
                                    'priority'          => $priority,
                                    'scored_by_user_id' => auth()->id() ?? null,
                                    'scored_at'         => now(),
                                ]
                            );
                            $totalProcessed++;
                        } catch (\Exception $e) {
                            \Log::error("Gagal simpan score ID {$res['id']}: " . $e->getMessage());
                        }
                    }
                } else {
                    $totalFailed += count($payload);
                }
            } catch (\Exception $e) {
                $totalFailed += count($payload);
            }
        });

        if ($totalProcessed > 0) {
            return redirect()->route('dashboard')
                ->with('success', "Proses selesai. {$totalProcessed} data berhasil diprediksi.");
        } else {
            return redirect()->route('dashboard')
                ->with('error', "Gagal memproses prediksi.");
        }
    }
}
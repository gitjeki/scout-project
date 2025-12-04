<?php

namespace App\Http\Controllers;

use App\Models\ContactActivity;
use App\Models\Prospect;
use App\Models\ProspectStatus;
use App\Models\PredictionScore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia; 
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Menampilkan Dashboard dengan Filter & Pagination
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // --- 1. STATISTIK (Dinamis Berdasarkan Role) ---
        $stats = [];
        $personalStats = null;

        if ($user->role === 'admin') {
            // LOGIKA ADMIN (Global Stats)
            $stats = [
                'total_prospects' => Prospect::count(),
                'processed'       => Prospect::has('latestScore')->count(),
                'high_priority'   => Prospect::whereHas('latestScore', function ($q) {
                                        $q->where('priority', 1);
                                    })->count(),
            ];
        } else {
            // LOGIKA SALES (Personal Stats)
            $today = now()->format('Y-m-d');
            
            // Hitung Hot Leads (New & High Priority)
            $hotLeads = Prospect::whereHas('status', fn($q) => $q->where('status_code', 'NEW'))
                ->whereHas('latestScore', fn($q) => $q->where('priority', 1))
                ->count();

            // Hitung Panggilan Hari Ini (Pakai contact_at agar tidak error)
            $callsToday = ContactActivity::where('telemarketer_id', $user->id)
                ->whereDate('contact_at', $today)
                ->count();

            // Hitung Durasi Bicara Hari Ini
            $durationSec = ContactActivity::where('telemarketer_id', $user->id)
                ->whereDate('contact_at', $today)
                ->sum('call_duration_sec');

            $personalStats = [
                'hot_leads'    => $hotLeads,
                'calls_today'  => $callsToday,
                'duration_min' => round($durationSec / 60, 1),
            ];
        }

        // --- 2. Query Data Tabel (Bawah) ---
        $query = Prospect::with(['status', 'latestScore']);

        // Filter Dropdown
        if ($request->has('status') && $request->status != '') {
            $query->whereHas('status', function($q) use ($request) {
                $q->where('status_code', $request->status);
            });
        }

        // --- 3. Opsi Filter ---
        $statusOptions = ProspectStatus::select('status_code')
            ->distinct()
            ->orderBy('status_code')
            ->pluck('status_code');

        // --- 4. Pagination ---
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
                                        ? Carbon::parse($item->latestScore->created_at)->format('d M Y H:i') 
                                        : null,
                    // Data Lengkap
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
            'stats'         => $stats,          // Terisi jika Admin
            'personalStats' => $personalStats,  // Terisi jika Sales (BARU)
            'prospects'     => $prospects,
            'statusOptions' => $statusOptions,
            'filters'       => $request->only(['status']),
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
            return back()->with('success', 'Data prospek berhasil ditambahkan secara manual.');
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
        // Tambahkan validasi assigned_to (ID User Bankir)
        $validated = $request->validate([
            'age'            => 'numeric|nullable',
            'job'            => 'string|nullable',
            'education'      => 'string|nullable',
            'assigned_to'    => 'numeric|nullable|exists:users,id', // Validasi baru
            // ... (validasi lainnya biarkan sama)
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
            
            // Cek apakah ada perubahan Assignment (Penunjukan Bankir)
            $oldAssignee = $prospect->assigned_to; // Asumsi ada kolom assigned_to di tabel prospects
            $newAssignee = $request->assigned_to ?? $oldAssignee;

            // 1. Update Data Prospek
            // Kita pisahkan assigned_to dari validated array jika kolom di DB namanya beda
            // Tapi kalau di DB nama kolomnya 'assigned_to', baris ini aman:
            $prospect->update($validated);

            // 2. LOGIKA NOTIFIKASI
            // Jika assignee berubah DAN assignee-nya bukan null
            if ($newAssignee && ($newAssignee != $oldAssignee)) {
                // OPSI A: Simpan ke tabel notifikasi (Jika ada tabel notifications)
                \App\Models\Notification::create([
                     'user_id' => $newAssignee,
                     'title'   => 'Prospek Baru',
                     'message' => 'Anda mendapatkan prospek baru untuk dihubungi.',
                     'is_read' => false
                 ]);

                // OPSI B (Sementara): Kita update status jadi NEW agar muncul di list sales
                // Ini memastikan sales "melihat" data baru ini.
                // (Tidak perlu kode tambahan jika filter sales berdasarkan assigned_to)
            }

            // 3. Reset Score jika data nasabah berubah
            // (Kita cek apakah data vital berubah, kalau cuma assign sales, jangan hapus score)
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
     * [BARU] Fitur Hapus Satuan (Single Delete)
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
     * [BARU] Fitur Hapus Batch (Selection vs All Filtered)
     */
    public function bulkDestroy(Request $request)
    {
        // 1. Set Unlimited Time agar tidak timeout jika hapus ribuan data
        ini_set('max_execution_time', 0);
        set_time_limit(0);

        // Ambil tipe hapus: 'selection' (halaman ini) atau 'all_filtered' (semua halaman)
        $type = $request->input('type'); 

        DB::beginTransaction();
        try {
            $count = 0;

            if ($type === 'selection') {
                // --- OPSI 1: Hapus ID yang dipilih (Checkbox Halaman Ini) ---
                $ids = $request->input('ids', []);
                if (empty($ids)) return back()->with('error', 'Tidak ada data yang dipilih.');
                
                Prospect::whereIn('id', $ids)->delete();
                $count = count($ids);

            } elseif ($type === 'all_filtered') {
                // --- OPSI 2: Hapus SEMUA data berdasarkan Filter (Semua Halaman) ---
                $statusFilter = $request->input('status');
                
                $query = Prospect::query();
                
                // Terapkan logika filter yang SAMA PERSIS dengan method index
                if ($statusFilter) {
                    $query->whereHas('status', function($q) use ($statusFilter) {
                        $q->where('status_code', $statusFilter);
                    });
                }
                
                // Eksekusi delete massal
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

        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt',
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

            if (empty($headerIndexes)) return back()->with('error', 'Format CSV tidak sesuai.');

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
            return back()->with('success', "Import selesai: {$imported} sukses, {$skipped} skip.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal import: ' . $e->getMessage());
        }
    }

    /**
     * Fitur Run Predictions (Batch ke Python API)
     */
    public function runPredictions(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Akses Ditolak.');
        }

        // 1. Set Konfigurasi Unlimited (Penting untuk data ribuan)
        ini_set('max_execution_time', 0); 
        ini_set('memory_limit', '-1');    
        set_time_limit(0); 

        $featureColumns = [
            'age', 'job', 'education', 'month', 'duration', 'campaign',
            'poutcome', 'cons_price_idx', 'cons_conf_idx', 'euribor3m', 'nr_employed',
        ];

        $totalProcessed = 0;
        $totalFailed    = 0;

        // Ambil prospek yang belum punya nilai score saja
        $query = Prospect::whereDoesntHave('scores');

        // 2. PERBAIKAN UTAMA: Chunk Size Diubah ke 100 (Sebelumnya 2000 terlalu berat)
        $query->chunkById(2000, function ($prospects) use (&$totalProcessed, &$totalFailed, $featureColumns) {
            
            $payload = [];

            foreach ($prospects as $prospect) {
                // Skip jika ada kolom wajib yang kosong/null
                foreach ($featureColumns as $col) {
                    if (is_null($prospect->{$col})) continue 2; 
                }

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

            // Jika payload kosong, lanjut ke chunk berikutnya
            if (empty($payload)) return;

            try {
                // 3. Timeout Dinaikkan ke 600 detik (10 Menit) per batch
                $response = Http::timeout(600)->post('http://127.0.0.1:8001/predict_batch', [
                    'data' => $payload
                ]);

                if ($response->successful()) {
                    $results = $response->json();
                    
                    foreach ($results as $res) {
                        try {
                            $prob = (float) $res['probability'];
                            
                            // Logika Prioritas
                            if ($prob >= 0.8) $priority = 1;      // High
                            elseif ($prob >= 0.5) $priority = 2;  // Medium
                            else $priority = 3;                   // Low

                            // Gunakan updateOrCreate agar aman jika dijalankan ulang
                            PredictionScore::updateOrCreate(
                                ['prospect_id' => $res['id']], 
                                [
                                    'model_version'     => 'decision_tree_v1',
                                    'score_value'       => $prob,
                                    'priority'          => $priority,
                                    'scored_by_user_id' => auth()->id() ?? null,
                                    'updated_at'        => now()
                                ]
                            );

                            $totalProcessed++;
                        } catch (\Exception $e) {
                            // Error simpan database (jarang terjadi)
                            \Log::error("Gagal simpan ID {$res['id']}: " . $e->getMessage());
                        }
                    }

                } else {
                    // Python Error (Misal data format salah)
                    \Log::error("Python API Error Batch: " . $response->body());
                    $totalFailed += count($payload);
                }

            } catch (\Exception $e) {
                // Koneksi Gagal (Python mati / Timeout)
                \Log::error("Connection Exception: " . $e->getMessage());
                $totalFailed += count($payload);
            }
        });

        $msgType = ($totalProcessed > 0) ? 'success' : 'error';
        return redirect()->route('dashboard')
            ->with($msgType, "Proses selesai. Berhasil: {$totalProcessed}, Gagal: {$totalFailed}.");
    }
}
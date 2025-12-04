<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\ProspectStatus;
use App\Models\ContactActivity;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class SalesController extends Controller
{
    // Definisi Status Master (Konstanta)
    private const PROSPECT_STATUSES = [
        ['code' => 'NEW',            'type' => 'open',            'desc' => 'Data baru, belum dihubungi'],
        ['code' => 'CONTACTED',      'type' => 'open',            'desc' => 'Sudah ditelepon, belum ada keputusan'],
        ['code' => 'INTERESTED',     'type' => 'open',            'desc' => 'Nasabah tertarik, butuh follow up'],
        ['code' => 'ACCEPTED',       'type' => 'closed_accepted', 'desc' => 'Nasabah setuju mendaftar'],
        ['code' => 'REFUSED',        'type' => 'closed_refused',  'desc' => 'Nasabah menolak penawaran'],
        ['code' => 'NO_ANSWER',      'type' => 'closed_refused',  'desc' => 'Telepon tidak diangkat berkali-kali'],
        ['code' => 'INVALID_NUMBER', 'type' => 'closed_refused',  'desc' => 'Nomor telepon salah/tidak terdaftar'],
    ];

    // Kolom yang diizinkan untuk sorting (Security - Prevent SQL Injection)
    private const ALLOWED_SORT_FIELDS = ['created_at', 'score', 'status_code'];

    // Default Sorting
    private const DEFAULT_SORT_FIELD = 'created_at';
    private const DEFAULT_SORT_DIRECTION = 'desc';

    /**
     * Halaman Utama List Prospek Sales
     * - Dengan Sorting Dinamis
     * - Pagination Preserved
     * - Optimized Query dengan Eager Loading
     */
    public function index(Request $request)
    {
        // 1. Authorization Check
        if ($request->user()->role !== 'sales') {
            abort(403, 'Akses khusus Sales.');
        }

        // === [SISIPKAN KODE INI DI SINI] ===
        // Hitung Statistik Pribadi untuk Dashboard (3 Cards)
        $userId = $request->user()->id;
        $today  = now()->format('Y-m-d');

        // Card 1: Target (High Priority & Belum Disentuh)
        $hotLeadsCount = Prospect::whereHas('status', function($q) {
                $q->where('status_code', 'NEW');
            })
            ->whereHas('latestScore', function($q) {
                $q->where('priority', 1); // High Priority
            })
            ->count();

        // Card 2: Produktivitas (Jumlah Telepon Hari Ini)
        $myCallsToday = ContactActivity::where('telemarketer_id', $userId)
            ->whereDate('contact_at', $today)
            ->count();

        // Card 3: Durasi Bicara (Total Menit Hari Ini)
        $myDurationSec = ContactActivity::where('telemarketer_id', $userId)
            ->whereDate('contact_at', $today)
            ->sum('call_duration_sec');
        $myDurationMin = round($myDurationSec / 60, 1);
        // === [AKHIR KODE SISIPAN] ===

        // 2. Ambil Parameter Sorting & Filtering
        $sortField = $request->input('sort_field', 'created_at'); 
        $sortDirection = $request->input('sort_direction', 'desc');
        
        // FITUR BARU: Filter Parameters
        $filterStatus = $request->input('filter_status', '');
        $filterPriority = $request->input('filter_priority', '');
        $filterJob = $request->input('filter_job', '');
        $filterEducation = $request->input('filter_education', '');
        $searchQuery = $request->input('search', ''); // Search by ID, Age, etc

        // 3. Whitelist Kolom Sorting
        $allowedSorts = ['created_at', 'score', 'status_code', 'priority'];
        if (!in_array($sortField, $allowedSorts)) {
            $sortField = 'created_at';
        }
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        // 4. Build Query dengan Eager Loading
        $query = Prospect::with([
            'status',
            'latestScore',
            'latestActivity.telemarketer'
        ]);

        // 5. APPLY FILTERS
        // Filter by Status
        if ($filterStatus) {
            $query->whereHas('status', function($q) use ($filterStatus) {
                $q->where('status_code', $filterStatus);
            });
        }

        // Filter by Priority
        if ($filterPriority) {
            $query->whereHas('latestScore', function($q) use ($filterPriority) {
                $q->where('priority', $filterPriority);
            });
        }

        // Filter by Job
        if ($filterJob) {
            $query->where('job', $filterJob);
        }

        // Filter by Education
        if ($filterEducation) {
            $query->where('education', $filterEducation);
        }

        // Search Query (HANYA ID PROSPEK)
        if ($searchQuery) {
            // Kita pakai 'prospects.id' secara spesifik agar database tidak bingung
            // dan kita hapus pencarian Age/Campaign sesuai permintaan Anda
            $query->where('prospects.id', 'LIKE', "{$searchQuery}");
        }

        // 6. Apply Dynamic Sorting
        switch ($sortField) {
            case 'score':
                $query->leftJoin('prediction_scores as ps', function($join) {
                        $join->on('prospects.id', '=', 'ps.prospect_id')
                            ->whereRaw('ps.id = (SELECT MAX(id) FROM prediction_scores WHERE prospect_id = prospects.id)');
                    })
                    ->orderBy('ps.score_value', $sortDirection)
                    ->select('prospects.*');
                break;

            case 'status_code':
                $query->leftJoin('prospect_statuses', 'prospects.prospect_status_id', '=', 'prospect_statuses.id')
                    ->orderBy('prospect_statuses.status_code', $sortDirection)
                    ->select('prospects.*');
                break;

            case 'priority':
                $query->leftJoin('prediction_scores as ps2', function($join) {
                        $join->on('prospects.id', '=', 'ps2.prospect_id')
                            ->whereRaw('ps2.id = (SELECT MAX(id) FROM prediction_scores WHERE prospect_id = prospects.id)');
                    })
                    ->orderBy('ps2.priority', $sortDirection)
                    ->select('prospects.*');
                break;

            default:
                $query->orderBy('prospects.' . $sortField, $sortDirection);
                break;
        }

        // 7. Pagination
        $prospects = $query->paginate(20)
            ->withQueryString()
            ->through(function ($item) {
                $latestActivity = $item->latestActivity;
                $latestScore = $item->latestScore;
                
                return [
                    'prospect_id'       => $item->id,
                    'status_code'       => $item->status ? $item->status->status_code : 'NEW',
                    'description'       => $item->description ?? '', 
                    'score'             => $latestScore ? $latestScore->score_value : null,
                    'priority'          => $latestScore ? $latestScore->priority : null,
                    'telemarketer_name' => $latestActivity && $latestActivity->telemarketer 
                                            ? $latestActivity->telemarketer->name : '-',
                    'contact_channel'   => $latestActivity ? $latestActivity->contact_channel : '-',
                    'call_duration_sec' => $latestActivity ? $latestActivity->call_duration_sec : 0,
                    'age'               => $item->age ?? null,
                    'job'               => $item->job ?? null,
                    'education'         => $item->education ?? null,
                    'month'             => $item->month ?? null,
                    'duration'          => $item->duration ?? 0,
                    'campaign'          => $item->campaign ?? null,
                    'poutcome'          => $item->poutcome ?? null,
                    'created_at'        => $item->created_at->toIso8601String(),
                    'updated_at'        => $item->updated_at->toIso8601String(),
                ];
            });

        // 8. Collect Unique Options untuk Dropdown Filter
        $jobOptions = Prospect::distinct()->pluck('job')->filter()->sort()->values();
        $educationOptions = Prospect::distinct()->pluck('education')->filter()->sort()->values();

        // 9. Return Inertia Response
        return Inertia::render('Prospects', [
            'prospects'         => $prospects,
            'statusOptions'     => $this->getStatuses(),
            'jobOptions'        => $jobOptions,
            'educationOptions'  => $educationOptions,
            'filters'           => [
                'sort_field'        => $sortField,
                'sort_direction'    => $sortDirection,
                'filter_status'     => $filterStatus,
                'filter_priority'   => $filterPriority,
                'filter_job'        => $filterJob,
                'filter_education'  => $filterEducation,
                'search'            => $searchQuery,
            ],

            // === [TAMBAHKAN BARIS INI] ===
            'personalStats'     => [
                'hot_leads'    => $hotLeadsCount,
                'calls_today'  => $myCallsToday,
                'duration_min' => $myDurationMin,
            ],
            // =============================
        ]);
    }

    /**
     * Apply Dynamic Sorting ke Query Builder
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $sortField
     * @param string $sortDirection
     * @return \Illuminate\Database\Eloquent\Builder
     */
    private function applySorting($query, string $sortField, string $sortDirection)
    {
        switch ($sortField) {
            case 'score':
                // Sorting berdasarkan relasi score (Join dengan tabel prediction_scores)
                return $query->leftJoin('prediction_scores', function($join) {
                        $join->on('prospects.id', '=', 'prediction_scores.prospect_id')
                             ->whereNull('prediction_scores.deleted_at'); // Soft delete aware
                    })
                    ->orderBy('prediction_scores.score_value', $sortDirection)
                    ->select('prospects.*'); // CRITICAL: Prevent column overwrite
                
            case 'status_code':
                // Sorting berdasarkan relasi status
                return $query->leftJoin('prospect_statuses', 'prospects.prospect_status_id', '=', 'prospect_statuses.id')
                    ->orderBy('prospect_statuses.status_code', $sortDirection)
                    ->select('prospects.*'); // CRITICAL: Prevent column overwrite
                
            case 'created_at':
            default:
                // Sorting kolom langsung di tabel prospects
                return $query->orderBy('prospects.' . $sortField, $sortDirection);
        }
    }

    /**
     * Transform Data Prospect untuk Frontend
     * - Clean & Consistent Format
     * - Handle Null Values
     * 
     * @param \App\Models\Prospect $item
     * @return array
     */
    private function transformProspectData($item): array
    {
        $latestActivity = $item->latestActivity;
        $latestScore = $item->latestScore;
        
        return [
            // Identifiers
            'prospect_id'    => $item->id,
            
            // Status Information
            'status_code'    => $item->status?->status_code ?? 'NEW',
            'description'    => $item->description ?? '',
            
            // Score & Priority
            'score'          => $latestScore?->score_value,
            'priority'       => $latestScore?->priority,
            
            // Latest Activity Info
            'telemarketer_name' => $latestActivity?->telemarketer?->name ?? '-',
            'contact_channel'   => $latestActivity?->contact_channel ?? '-',
            'call_duration_sec' => $latestActivity?->call_duration_sec ?? 0,
            
            // Prospect Personal Data (Handle Null)
            'age'            => $item->age ?? null,
            'job'            => $item->job ?? null,
            'education'      => $item->education ?? null,
            'month'          => $item->month,
            'duration'       => $item->duration,
            'campaign'       => $item->campaign,
            'poutcome'       => $item->poutcome,
            
            // Timestamps (ISO 8601 Format untuk JavaScript)
            'created_at'     => $item->created_at->toIso8601String(),
            'updated_at'     => $item->updated_at->toIso8601String(),
        ];
    }

    /**
     * Update Prospect (Tanpa Tracking Timer)
     * - Simple Update untuk Status & Description
     */
    public function update(Request $request, $id)
    {
        // 1. Validation
        $validated = $request->validate([
            'status_code' => 'required|string|max:50',
            'description' => 'nullable|string|max:1000',
        ]);

        // 2. Transaction untuk Data Consistency
        DB::beginTransaction();
        try {
            $prospect = Prospect::findOrFail($id);
            
            // Update menggunakan helper function
            $this->updateProspectData(
                $prospect, 
                $validated['status_code'], 
                $validated['description']
            );
            
            DB::commit();
            
            return back()->with('success', 'Data prospek berhasil diperbarui.');
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Update Prospect Failed', [
                'prospect_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return back()->with('error', 'Gagal memperbarui data: ' . $e->getMessage());
        }
    }

    /**
     * Log Contact Activity (Tracking Telepon dengan Timer)
     * - Save Activity Log
     * - Update Prospect Status
     * - Record Call Duration
     */
    public function logActivity(Request $request)
    {
        // 1. Validation dengan Custom Messages
        $validated = $request->validate([
            'prospect_id'       => 'required|exists:prospects,id',
            'status_code'       => 'required|string|max:50',
            'contact_notes'     => 'nullable|string|max:2000',     
            'call_duration_sec' => 'required|integer|min:0|max:86400', // Max 24 jam
            'contact_channel'   => 'required|string|in:Phone,Email,WhatsApp,SMS',
        ], [
            'prospect_id.required' => 'Data prospek tidak valid.',
            'status_code.required' => 'Status harus dipilih.',
            'call_duration_sec.max' => 'Durasi panggilan tidak valid (maksimal 24 jam).',
        ]);

        // 2. Transaction
        DB::beginTransaction();
        try {
            // Find Prospect
            $prospect = Prospect::findOrFail($validated['prospect_id']);
            
            // Update Prospect Status & Description
            $statusId = $this->updateProspectData(
                $prospect, 
                $validated['status_code'], 
                $validated['contact_notes']
            );

            // Create Activity Log
            ContactActivity::create([
                'prospect_id'        => $prospect->id,
                'telemarketer_id'    => $request->user()->id,
                'prospect_status_id' => $statusId,
                'contact_channel'    => $validated['contact_channel'],
                'contact_notes'      => $validated['contact_notes'],
                'call_duration_sec'  => $validated['call_duration_sec'],
                'contact_at'         => now(),
            ]);

            DB::commit();
            
            return back()->with('success', 'Aktivitas berhasil disimpan! Durasi: ' . $validated['call_duration_sec'] . ' detik.');

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('Log Activity Failed', [
                'prospect_id' => $validated['prospect_id'],
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->with('error', 'Gagal menyimpan log aktivitas: ' . $e->getMessage());
        }
    }

    /**
     * Helper: Update Prospect Data (Status & Description)
     * - Reusable untuk update biasa & log activity
     * - Handle Status Creation jika belum ada
     * 
     * @param \App\Models\Prospect $prospect
     * @param string $statusCode
     * @param string|null $description
     * @return int Status ID
     */
    private function updateProspectData(Prospect $prospect, string $statusCode, ?string $description): int
    {
        // Update Description
        $prospect->description = $description;
        
        // Find Status Configuration
        $statusConfig = collect(self::PROSPECT_STATUSES)->firstWhere('code', $statusCode);
        $statusId = $prospect->prospect_status_id; 

        // Update Status jika ada konfigurasi
        if ($statusConfig) {
            // FirstOrCreate: Ambil status yang ada atau buat baru
            $statusModel = ProspectStatus::firstOrCreate(
                ['status_code' => $statusCode],
                [
                    'status_type' => $statusConfig['type'],
                    'description' => $statusConfig['desc'],
                    'updated_by_user_id' => auth()->id(),
                ]
            );
            
            $prospect->prospect_status_id = $statusModel->id;
            $statusId = $statusModel->id;
        }

        // Save Prospect
        $prospect->save();
        
        return $statusId;
    }

    /**
     * BONUS: Get Prospect Statistics untuk Dashboard Sales
     * - Total Assigned
     * - Total Contacted
     * - Success Rate
     */
    public function statistics(Request $request)
    {
        $userId = $request->user()->id;

        // Cache statistics selama 5 menit
        $stats = Cache::remember("sales_stats_{$userId}", 300, function() use ($userId) {
            $totalAssigned = Prospect::count();
            
            $totalContacted = ContactActivity::where('telemarketer_id', $userId)
                ->distinct('prospect_id')
                ->count('prospect_id');
            
            $totalAccepted = ContactActivity::where('telemarketer_id', $userId)
                ->whereHas('status', fn($q) => $q->where('status_code', 'ACCEPTED'))
                ->distinct('prospect_id')
                ->count('prospect_id');

            $successRate = $totalContacted > 0 
                ? round(($totalAccepted / $totalContacted) * 100, 2) 
                : 0;

            return [
                'total_assigned' => $totalAssigned,
                'total_contacted' => $totalContacted,
                'total_accepted' => $totalAccepted,
                'success_rate' => $successRate,
            ];
        });

        return response()->json($stats);
    }
/**
     * FUNGSI TAMBAHAN (Paste di bagian paling bawah class, sebelum '}')
     * Digunakan untuk menyediakan opsi status ke dropdown filter
     */
    private function getStatuses()
    {
        // Jika Anda menggunakan konstanta di atas class:
        // return self::PROSPECT_STATUSES; 
        
        // ATAU definisikan manual disini agar aman:
        return [
            ['code' => 'NEW',            'type' => 'open',            'desc' => 'Data baru'],
            ['code' => 'CONTACTED',      'type' => 'open',            'desc' => 'Sudah ditelepon'],
            ['code' => 'INTERESTED',     'type' => 'open',            'desc' => 'Tertarik'],
            ['code' => 'ACCEPTED',       'type' => 'closed_accepted', 'desc' => 'Setuju'],
            ['code' => 'REFUSED',        'type' => 'closed_refused',  'desc' => 'Menolak'],
            ['code' => 'NO_ANSWER',      'type' => 'closed_refused',  'desc' => 'Tidak Diangkat'],
            ['code' => 'INVALID_NUMBER', 'type' => 'closed_refused',  'desc' => 'Nomor Salah'],
        ];
    }
}
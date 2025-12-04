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
        ['code' => 'NEW',           'type' => 'open',            'desc' => 'Data baru, belum dihubungi'],
        ['code' => 'CONTACTED',      'type' => 'open',            'desc' => 'Sudah ditelepon, belum ada keputusan'],
        ['code' => 'INTERESTED',     'type' => 'open',            'desc' => 'Nasabah tertarik, butuh follow up'],
        ['code' => 'ACCEPTED',       'type' => 'closed_accepted', 'desc' => 'Nasabah setuju mendaftar'],
        ['code' => 'REFUSED',        'type' => 'closed_refused',  'desc' => 'Nasabah menolak penawaran'],
        ['code' => 'NO_ANSWER',      'type' => 'closed_refused',  'desc' => 'Telepon tidak diangkat berkali-kali'],
        ['code' => 'INVALID_NUMBER', 'type' => 'closed_refused',  'desc' => 'Nomor telepon salah/tidak terdaftar'],
    ];

    // Default Sorting
    private const DEFAULT_SORT_FIELD = 'created_at';
    private const DEFAULT_SORT_DIRECTION = 'desc';

    /**
     * Halaman Utama List Prospek Sales
     */
    public function index(Request $request)
    {
        // 1. Authorization Check
        if ($request->user()->role !== 'sales') {
            abort(403, 'Akses khusus Sales.');
        }

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

        // Card 2: Produktivitas (Jumlah Telepon Hari Ini) - Diperbaiki: Menggunakan contact_at
        $myCallsToday = ContactActivity::where('telemarketer_id', $userId)
            ->whereDate('contact_at', $today)
            ->count();

        // Card 3: Durasi Bicara (Total Menit Hari Ini) - Diperbaiki: Menggunakan contact_at
        $myDurationSec = ContactActivity::where('telemarketer_id', $userId)
            ->whereDate('contact_at', $today)
            ->sum('call_duration_sec');
        $myDurationMin = round($myDurationSec / 60, 1);

        // 2. Ambil Parameter Sorting & Filtering
        $sortField = $request->input('sort_field', self::DEFAULT_SORT_FIELD); 
        $sortDirection = $request->input('sort_direction', self::DEFAULT_SORT_DIRECTION);
        
        // Filter Parameters
        $filterStatus = $request->input('filter_status', '');
        $filterPriority = $request->input('filter_priority', '');
        $filterJob = $request->input('filter_job', '');
        $filterEducation = $request->input('filter_education', '');
        $searchQuery = $request->input('search', '');

        // 3. Whitelist Kolom Sorting
        $allowedSorts = ['created_at', 'score', 'status_code', 'priority'];
        if (!in_array($sortField, $allowedSorts)) {
            $sortField = self::DEFAULT_SORT_FIELD;
        }
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = self::DEFAULT_SORT_DIRECTION;
        }

        // 4. Build Query dengan Eager Loading
        $query = Prospect::with([
            'status',
            'latestScore',
            'latestActivity.telemarketer'
        ]);
        
        // OPSI: Tambahkan filter agar sales hanya melihat prospek yang assigned ke mereka
        // $query->where('assigned_to', $userId); 

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
            $query->where('prospects.id', 'LIKE', "{$searchQuery}");
        }

        // 6. Apply Dynamic Sorting
        switch ($sortField) {
            case 'score':
                // Join ke tabel prediction_scores untuk sorting score
                $query->leftJoin('prediction_scores as ps', function($join) {
                        $join->on('prospects.id', '=', 'ps.prospect_id')
                            ->whereRaw('ps.id = (SELECT MAX(id) FROM prediction_scores WHERE prospect_id = prospects.id)');
                    })
                    ->orderBy('ps.score_value', $sortDirection)
                    ->select('prospects.*');
                break;

            case 'status_code':
                // Join ke tabel prospect_statuses untuk sorting status
                $query->leftJoin('prospect_statuses', 'prospects.prospect_status_id', '=', 'prospect_statuses.id')
                    ->orderBy('prospect_statuses.status_code', $sortDirection)
                    ->select('prospects.*');
                break;

            case 'priority':
                 // Join ke tabel prediction_scores untuk sorting priority
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
            ->through(fn ($item) => $this->transformProspectData($item));

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
            'personalStats'     => [
                'hot_leads'    => $hotLeadsCount,
                'calls_today'  => $myCallsToday,
                'duration_min' => $myDurationMin,
            ],
        ]);
    }

    /**
     * Transform Data Prospect untuk Frontend
     */
    private function transformProspectData($item): array
    {
        $latestActivity = $item->latestActivity;
        $latestScore = $item->latestScore;
        
        return [
            // Identifiers
            'prospect_id'       => $item->id,
            
            // Status Information
            'status_code'       => $item->status?->status_code ?? 'NEW',
            'description'       => $item->description ?? '',
            
            // Score & Priority
            'score'             => $latestScore?->score_value,
            'priority'          => $latestScore?->priority,
            
            // Latest Activity Info
            'telemarketer_name' => $latestActivity?->telemarketer?->name ?? '-',
            'contact_channel'   => $latestActivity?->contact_channel ?? '-',
            'call_duration_sec' => $latestActivity?->call_duration_sec ?? 0,
            
            // Prospect Personal Data (Handle Null)
            'age'               => $item->age ?? null,
            'job'               => $item->job ?? null,
            'education'         => $item->education ?? null,
            'month'             => $item->month ?? null,
            'duration'          => $item->duration ?? 0,
            'campaign'          => $item->campaign ?? null,
            'poutcome'          => $item->poutcome ?? null,
            
            // Timestamps (ISO 8601 Format untuk JavaScript)
            'created_at'        => $item->created_at->toIso8601String(),
            'updated_at'        => $item->updated_at->toIso8601String(),
        ];
    }
    
    // ... (Fungsi applySorting dihapus karena sudah di-inline ke index untuk menangani joins)

    /**
     * Update Prospect (Tanpa Tracking Timer)
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'status_code' => 'required|string|max:50',
            'description' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            $prospect = Prospect::findOrFail($id);
            
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
     */
    public function logActivity(Request $request)
    {
        // 1. Validation dengan Custom Messages
        $validated = $request->validate([
            'prospect_id'       => 'required|exists:prospects,id',
            'status_code'       => 'required|string|max:50',
            'contact_notes'     => 'nullable|string|max:2000',     
            'call_duration_sec' => 'required|integer|min:0|max:86400', 
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
                // contact_at akan menggunakan useCurrent() dari migration
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
    private function getStatuses()
    {
        return self::PROSPECT_STATUSES;
    }
}
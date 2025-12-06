<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\ProspectStatus;
use App\Models\ContactActivity;
use App\Models\User;
use App\Models\PredictionScore;
use App\Models\DailySalesStat;
use App\Models\DailyPipelineSnapshot;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SalesController extends Controller
{
    // --- KONFIGURASI STATUS ---
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
     * Halaman Utama Sales (List Prospek)
     */
    public function index(Request $request)
    {
        if ($request->user()->role !== 'sales') {
            abort(403, 'Akses khusus Sales.');
        }

        $user = $request->user();
        
        // --- 1. UPDATE & AMBIL STATISTIK DARI DATABASE ---
        $personalStats = $this->syncAndGetPersonalStats($user->id);
        $statusStats   = $this->syncAndGetPipelineStats();

        // --- 2. LOGIKA FILTER & SORTING ---
        // UPDATE: Default Sort sekarang 'score' (Highest Score First)
        $sortField = $request->input('sort_field', 'score'); 
        $sortDirection = $request->input('sort_direction', 'desc');
        $searchQuery = $request->input('search');

        // Query Utama
        $query = Prospect::query()
            ->with(['status', 'latestScore', 'latestActivity.telemarketer'])
            ->withSum('contactActivities', 'call_duration_sec')
            ->withCount('contactActivities')
            // Filter: Hanya data lengkap & sudah diprediksi
            ->readyForPrediction() 
            ->has('latestScore'); 

        // --- Filters ---
        if ($val = $request->input('filter_status')) {
            $query->whereHas('status', fn($q) => $q->where('status_code', $val));
        }
        if ($val = $request->input('filter_priority')) {
            $query->whereHas('latestScore', fn($q) => $q->where('priority', (int)$val));
        }
        if ($val = $request->input('filter_telemarketer')) {
            $query->whereHas('latestActivity', fn($q) => $q->where('telemarketer_id', $val));
        }
        if ($val = $request->input('filter_channel')) {
            $query->whereHas('latestActivity', fn($q) => $q->where('contact_channel', $val));
        }
        if ($searchQuery) {
            $query->where('id', 'LIKE', "%{$searchQuery}%");
        }

        // --- Sorting Logic ---
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
             $query->orderBy('contact_activities_count', $sortDirection);
        } else {
            // Fallback untuk kolom biasa (id, age, job, dll)
            $realField = ($sortField === 'prospect_id') ? 'id' : $sortField;
            $query->orderBy($realField, $sortDirection);
        }

        // Pagination & Transform Data
        $prospects = $query->paginate(20)->withQueryString()
            ->through(fn ($item) => $this->transformProspectData($item));

        $telemarketers = User::where('role', 'sales')->orderBy('name')->get(['id', 'name']);
        
        return Inertia::render('Prospects', [
            'prospects'       => $prospects,
            'statusOptions'   => self::PROSPECT_STATUSES,
            'telemarketers'   => $telemarketers,
            'channelOptions'  => ['Phone', 'Email', 'WhatsApp', 'SMS'],
            'filters'         => $request->all(), // Kirim balik parameter sort ke frontend
            'personalStats'   => $personalStats, 
            'statusStats'     => $statusStats    
        ]);
    }

    /**
     * Mencatat Aktivitas Sales (Log Call/Follow up)
     */
    public function logActivity(Request $request)
    {
        $validated = $request->validate([
            'prospect_id'       => 'required|exists:prospects,id',
            'status_code'       => 'required|string',
            'contact_notes'     => 'nullable|string',     
            'call_duration_sec' => 'required|integer', 
            'contact_channel'   => 'required|string',
            'current_page'      => 'nullable|integer',
        ]);

        DB::beginTransaction();
        try {
            $prospect = Prospect::findOrFail($validated['prospect_id']);
            
            // Update Status & Deskripsi
            $statusId = $this->updateProspectStatusAndDesc($prospect, $validated['status_code'], $validated['contact_notes']);

            // Buat Record Activity
            ContactActivity::create([
                'prospect_id'        => $prospect->id,
                'telemarketer_id'    => $request->user()->id,
                'prospect_status_id' => $statusId,
                'contact_channel'    => $validated['contact_channel'],
                'contact_notes'      => $validated['contact_notes'],
                'call_duration_sec'  => $validated['call_duration_sec'],
                'contact_at'         => now(),
            ]);

            // Re-sync statistik
            $this->syncAndGetPersonalStats($request->user()->id);
            $this->syncAndGetPipelineStats();

            DB::commit();
            
            return redirect()->route('sales.prospects.index', [
                'page' => $validated['current_page'] ?? 1,
                // Pastikan sort preferences tetap terjaga setelah submit
                'sort_field' => $request->input('sort_field', 'score'),
                'sort_direction' => $request->input('sort_direction', 'desc'),
            ])->with('success', "Log aktivitas #{$prospect->id} tersimpan.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    // --- HELPER FUNCTIONS ---

    private function updateProspectStatusAndDesc($prospect, $code, $desc) {
         $prospect->description = $desc;
         $statusConfig = collect(self::PROSPECT_STATUSES)->firstWhere('code', $code);
         $statusId = $prospect->prospect_status_id;
         
         if ($statusConfig) {
             $statusModel = ProspectStatus::firstOrCreate(['status_code' => $code], [
                 'status_type' => $statusConfig['type'], 
                 'description' => $statusConfig['desc'], 
                 'updated_by_user_id' => auth()->id()
             ]);
             $prospect->prospect_status_id = $statusModel->id;
             $statusId = $statusModel->id;
         }
         
         $prospect->save();
         return $statusId;
    }

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

    private function transformProspectData($item) {
        $totalDuration = (int) $item->contact_activities_sum_call_duration_sec ?? 0;
        $callCount = $item->contact_activities_count ?? 0;

        $lastContactAt = $item->latestActivity 
            ? Carbon::parse($item->latestActivity->contact_at)->format('d M H:i') 
            : '-';

        return [
            'prospect_id' => $item->id, 
            'status_code' => $item->status?->status_code ?? 'NEW',
            'description' => $item->description, 
            'score' => $item->latestScore?->score_value,
            'priority' => $item->latestScore?->priority, 
            'telemarketer_name' => $item->latestActivity?->telemarketer?->name ?? '-',
            'contact_channel' => $item->latestActivity?->contact_channel ?? '-',
            'total_duration_sec' => $totalDuration,
            'call_count' => $callCount, 
            'last_contact_at' => $lastContactAt, 
            'age' => $item->age, 
            'job' => $item->job, 
            'created_at' => $item->created_at->toIso8601String(),
        ];
    }

    // --- DATABASE STATS SYNC LOGIC ---

    private function syncAndGetPersonalStats($userId)
    {
        $today = now()->format('Y-m-d');

        $hotLeads = Prospect::whereHas('status', fn($q) => $q->where('status_code', 'NEW'))
            ->whereHas('latestScore', fn($q) => $q->where('priority', 1))
            ->count();

        $callsMade = ContactActivity::where('telemarketer_id', $userId)
            ->whereDate('contact_at', $today)->count();

        $durationSec = ContactActivity::where('telemarketer_id', $userId)
            ->whereDate('contact_at', $today)->sum('call_duration_sec');

        $stat = DailySalesStat::updateOrCreate(
            ['user_id' => $userId, 'date' => $today],
            [
                'hot_leads_target' => $hotLeads,
                'calls_made' => $callsMade,
                'total_duration_sec' => $durationSec
            ]
        );

        return [
            'hot_leads' => $stat->hot_leads_target,
            'calls_today' => $stat->calls_made,
            'duration_min' => round($stat->total_duration_sec / 60, 1),
        ];
    }

    private function syncAndGetPipelineStats()
    {
        $today = now()->format('Y-m-d');
        $allStatuses = collect(self::PROSPECT_STATUSES)->where('code', '!==', 'NEW')->values();
        $formattedStats = [];

        foreach ($allStatuses as $status) {
            $count = Prospect::whereHas('status', function($q) use ($status) {
                $q->where('status_code', $status['code']);
            })->count();

            $snapshot = DailyPipelineSnapshot::updateOrCreate(
                ['date' => $today, 'status_code' => $status['code']],
                ['count' => $count, 'status_desc' => $status['desc']]
            );

            $formattedStats[] = [
                'code' => $snapshot->status_code,
                'desc' => $snapshot->status_desc,
                'count' => $snapshot->count,
                'color' => $this->getStatusColor($snapshot->status_code)
            ];
        }

        return $formattedStats;
    }
}
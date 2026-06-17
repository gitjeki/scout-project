<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\ProspectStatus;
use App\Models\ContactActivity;
use App\Models\User;
use App\Models\PredictionScore;
use App\Models\DailySalesStat;
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

    public function index(Request $request)
    {
        if ($request->user()->role !== 'sales') {
            abort(403, 'Akses khusus Sales.');
        }

        $user = $request->user();
        
        // --- 1. UPDATE STATS ---
        $personalStats = $this->syncAndGetPersonalStats($user->id);
        $statusStats   = $this->syncAndGetPipelineStats($user->id);

        // --- 2. LOGIKA FILTER & SORTING ---
        $sortField = $request->input('sort_field', 'score'); 
        $sortDirection = $request->input('sort_direction', 'desc');
        $searchQuery = $request->input('search');

        // Query Utama
        $query = Prospect::query()
            ->select('prospects.*') // PENTING: Force select table utama agar ID tidak ambigu saat Join
            ->with(['status', 'latestScore', 'assignedAgent']) 
            ->withSum('contactActivities', 'call_duration_sec')
            ->withCount('contactActivities')
            ->readyForPrediction() 
            ->has('latestScore');

        // [OPTIMASI 1] Filter User di awal agar data yang discan sedikit
        $query->where('assigned_to', $user->id);

        // --- SEARCH LOGIC (ID Only) ---
        if ($searchQuery) {
            if (!ctype_digit((string) $searchQuery)) {
               $query->where('prospects.id', -1); 
            } else {
                $query->where('prospects.id', $searchQuery);
            }
        }

        // --- FILTER STATUS ---
        if ($val = $request->input('filter_status')) {
            $query->whereHas('status', fn($q) => $q->where('status_code', $val));
        }

        // --- [PERBAIKAN] FILTER PRIORITAS SUPER CEPAT ---
        // Mengganti whereHas dengan JOIN agar query tidak berat
        if ($val = $request->input('filter_priority')) {
            // 1. Subquery untuk mencari ID score terakhir per prospect
            $latestScoresSub = PredictionScore::select('prospect_id', DB::raw('MAX(id) as max_id'))
                ->groupBy('prospect_id');

            // 2. Join prospect -> subquery -> real score table
            $query->joinSub($latestScoresSub, 'latest_score_ids', function ($join) {
                $join->on('prospects.id', '=', 'latest_score_ids.prospect_id');
            })
            ->join('prediction_scores as ps', function ($join) {
                $join->on('latest_score_ids.max_id', '=', 'ps.id');
            })
            ->where('ps.priority', (int)$val);
        }

        // --- FILTER CHANNEL ---
        if ($val = $request->input('filter_channel')) {
            $query->whereHas('latestActivity', fn($q) => $q->where('contact_channel', $val));
        }

        // --- [PERBAIKAN] FILTER LAST CONTACT (FIX MINGGU INI) ---
        if ($val = $request->input('filter_last_contact')) {
            $query->whereHas('latestActivity', function($q) use ($val) {
                $now = Carbon::now(); // Objek waktu sekarang
                
                if ($val === 'today') {
                    $q->whereDate('contact_at', $now->toDateString());
                } 
                elseif ($val === 'this_week') {
                    // FIX: Gunakan copy() agar $now tidak berubah (mutable issue)
                    // dan format eksplisit ke database format
                    $start = $now->copy()->startOfWeek()->format('Y-m-d H:i:s');
                    $end   = $now->copy()->endOfWeek()->format('Y-m-d H:i:s');
                    $q->whereBetween('contact_at', [$start, $end]);
                } 
                elseif ($val === 'this_month') {
                    $q->whereMonth('contact_at', $now->month)
                      ->whereYear('contact_at', $now->year);
                }
            });
        }

        // --- SORTING LOGIC ---
        if ($sortField === 'score') {
            $query->orderBy(
                PredictionScore::select('score_value')
                    ->whereColumn('prospect_id', 'prospects.id')
                    ->latest('id')->limit(1),
                $sortDirection
            );
        } elseif ($sortField === 'priority') {
            // Jika filter priority aktif, kita sudah join table 'ps', jadi bisa sort langsung
            if ($request->input('filter_priority')) {
                $query->orderBy('ps.priority', $sortDirection);
            } else {
                // Jika tidak difilter, pakai subquery sort biasa
                $query->orderBy(
                    PredictionScore::select('priority')
                        ->whereColumn('prospect_id', 'prospects.id')
                        ->latest('id')->limit(1),
                    $sortDirection
                );
            }
        } elseif ($sortField === 'call_count') {
             $query->orderBy('contact_activities_count', $sortDirection);
        } else {
            $realField = ($sortField === 'prospect_id') ? 'prospects.id' : $sortField;
            $query->orderBy($realField, $sortDirection);
        }

        $prospects = $query->paginate(20)->withQueryString()
            ->through(fn ($item) => $this->transformProspectData($item));

        return Inertia::render('Prospects', [
            'prospects'       => $prospects,
            'statusOptions'   => self::PROSPECT_STATUSES,
            'channelOptions'  => ['Phone', 'Email', 'WhatsApp', 'SMS'],
            'filters'         => $request->all(),
            'personalStats'   => $personalStats, 
            'statusStats'     => $statusStats,
            'user'            => ['id' => $user->id, 'name' => $user->name]     
        ]);
    }

    // ... (Sisa fungsi logActivity, transformProspectData, syncStats SAMA DENGAN SEBELUMNYA) ...
    // Pastikan Anda menyertakan fungsi-fungsi helper tersebut di bawah ini agar controller lengkap.
    
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

        $prospectCheck = Prospect::where('id', $validated['prospect_id'])
            ->where('assigned_to', $request->user()->id)
            ->first();

        if (!$prospectCheck) {
            return back()->with('error', 'Akses ditolak: Data ini bukan milik Anda.');
        }

        DB::beginTransaction();
        try {
            $prospect = $prospectCheck; 
            $statusId = $this->updateProspectStatusAndDesc($prospect, $validated['status_code'], $validated['contact_notes']);

            ContactActivity::create([
                'prospect_id'        => $prospect->id,
                'telemarketer_id'    => $request->user()->id,
                'prospect_status_id' => $statusId,
                'contact_channel'    => $validated['contact_channel'],
                'contact_notes'      => $validated['contact_notes'],
                'call_duration_sec'  => $validated['call_duration_sec'],
                'contact_at'         => now(),
            ]);

            $this->syncAndGetPersonalStats($request->user()->id);
            $this->syncAndGetPipelineStats($request->user()->id);

            DB::commit();
            
            return redirect()->route('sales.prospects.index', [
                'page' => $validated['current_page'] ?? 1,
                'sort_field' => $request->input('sort_field', 'score'),
                'sort_direction' => $request->input('sort_direction', 'desc'),
            ])->with('success', "Log aktivitas tersimpan.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

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
            'default' => 'gray'
        };
    }

    private function transformProspectData($item) {
        $totalDuration = (int) $item->contact_activities_sum_call_duration_sec ?? 0;
        $callCount = $item->contact_activities_count ?? 0;
        $lastContactAt = $item->latestActivity ? Carbon::parse($item->latestActivity->contact_at)->format('d M H:i') : '-';

        return [
            'prospect_id' => $item->id, 
            'status_code' => $item->status?->status_code ?? 'NEW',
            'description' => $item->description, 
            'score' => $item->latestScore?->score_value,
            'priority' => $item->latestScore?->priority, 
            'telemarketer_name' => $item->assignedAgent ? $item->assignedAgent->name : '-',
            'contact_channel' => $item->latestActivity?->contact_channel ?? '-',
            'total_duration_sec' => $totalDuration,
            'call_count' => $callCount, 
            'last_contact_at' => $lastContactAt, 
            'age' => $item->age, 
            'job' => $item->job, 
            'created_at' => $item->created_at->toIso8601String(),
        ];
    }

    private function syncAndGetPersonalStats($userId)
    {
        $today = now()->format('Y-m-d');
        $hotLeads = Prospect::where('assigned_to', $userId)
            ->whereHas('status', fn($q) => $q->where('status_code', 'NEW'))
            ->whereHas('latestScore', fn($q) => $q->where('priority', 1))
            ->count();
        $callsMade = ContactActivity::where('telemarketer_id', $userId)
            ->whereDate('contact_at', $today)->count();
        $durationSec = ContactActivity::where('telemarketer_id', $userId)
            ->whereDate('contact_at', $today)->sum('call_duration_sec');

        $stat = DailySalesStat::updateOrCreate(
            ['user_id' => $userId, 'date' => $today],
            ['hot_leads_target' => $hotLeads, 'calls_made' => $callsMade, 'total_duration_sec' => $durationSec]
        );

        return [
            'hot_leads' => $stat->hot_leads_target,
            'calls_today' => $stat->calls_made,
            'duration_min' => round($stat->total_duration_sec / 60, 1),
        ];
    }

    private function syncAndGetPipelineStats($userId)
    {
        $allStatuses = collect(self::PROSPECT_STATUSES)->where('code', '!==', 'NEW')->values();
        $formattedStats = [];
        foreach ($allStatuses as $status) {
            $count = Prospect::where('assigned_to', $userId)
                ->whereHas('status', function($q) use ($status) {
                    $q->where('status_code', $status['code']);
                })->count();
            $formattedStats[] = [
                'code' => $status['code'], 'desc' => $status['desc'],
                'count' => $count, 'color' => $this->getStatusColor($status['code'])
            ];
        }
        return $formattedStats;
    }
}
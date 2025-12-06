<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\ProspectStatus;
use App\Models\ContactActivity;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

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
     * HALAMAN UTAMA SALES (Dashboard + Tabel)
     */
    public function index(Request $request)
    {
        if ($request->user()->role !== 'sales') {
            abort(403, 'Akses khusus Sales.');
        }

        $userId = $request->user()->id;
        $today  = now()->format('Y-m-d');

        // --- 1. HITUNG STATISTIK PERSONAL (Kinerja Sales yang Login) ---
        // Hot Leads: Status NEW & Prioritas 1
        $hotLeadsCount = Prospect::whereHas('status', fn($q) => $q->where('status_code', 'NEW'))
            ->whereHas('latestScore', fn($q) => $q->where('priority', 1))
            ->count();

        // Panggilan Sales Hari Ini
        $myCallsToday = ContactActivity::where('telemarketer_id', $userId)
            ->whereDate('contact_at', $today)->count();

        // Durasi Sales Hari Ini
        $myDurationSec = ContactActivity::where('telemarketer_id', $userId)
            ->whereDate('contact_at', $today)->sum('call_duration_sec');
        $myDurationMin = round($myDurationSec / 60, 1);

        // --- 2. HITUNG STATISTIK GLOBAL PIPELINE (Semua Data) ---
        $statusStats = [];
        $allStatuses = collect(self::PROSPECT_STATUSES)->where('code', '!==', 'NEW')->values();

        foreach ($allStatuses as $status) {
            $count = Prospect::whereHas('status', function($q) use ($status) {
                $q->where('status_code', $status['code']);
            })->count();

            $statusStats[] = [
                'code'  => $status['code'],
                'desc'  => $status['desc'],
                'count' => $count,
                'color' => $this->getStatusColor($status['code'])
            ];
        }

        // --- 3. LOGIKA FILTER & TABEL ---
        $sortField = $request->input('sort_field', 'created_at'); 
        $sortDirection = $request->input('sort_direction', 'desc');
        
        // Ambil input filter
        $filterStatus = $request->input('filter_status');
        $filterPriority = $request->input('filter_priority');
        $filterTelemarketer = $request->input('filter_telemarketer');
        $filterChannel = $request->input('filter_channel');
        $searchQuery = $request->input('search');

        // UPDATE: Tambahkan withSum untuk menghitung total durasi
        $query = Prospect::with(['status', 'latestScore', 'latestActivity.telemarketer'])
            ->withSum('contactActivities', 'call_duration_sec');

        // Filter Logic
        if (!empty($filterStatus)) {
            $query->whereHas('status', fn($q) => $q->where('status_code', $filterStatus));
        }

        if ($filterPriority !== null && $filterPriority !== '') {
            $query->whereHas('latestScore', fn($q) => $q->where('priority', (int)$filterPriority));
        }

        if ($filterTelemarketer !== null && $filterTelemarketer !== '') {
            $query->whereHas('latestActivity', fn($q) => $q->where('telemarketer_id', $filterTelemarketer));
        }

        if ($filterChannel !== null && $filterChannel !== '') {
            $query->whereHas('latestActivity', fn($q) => $q->where('contact_channel', $filterChannel));
        }

        if ($searchQuery) {
            $query->where('id', 'LIKE', "%{$searchQuery}%");
        }

        // Custom Sort Logic
        if ($sortField === 'score') {
            $query->leftJoin('prediction_scores as ps', function($join) {
                $join->on('prospects.id', '=', 'ps.prospect_id')->whereRaw('ps.id = (SELECT MAX(id) FROM prediction_scores WHERE prospect_id = prospects.id)');
            })->orderBy('ps.score_value', $sortDirection)->select('prospects.*');
        
        } elseif ($sortField === 'priority') {
             $query->leftJoin('prediction_scores as ps2', function($join) {
                $join->on('prospects.id', '=', 'ps2.prospect_id')->whereRaw('ps2.id = (SELECT MAX(id) FROM prediction_scores WHERE prospect_id = prospects.id)');
            })->orderBy('ps2.priority', $sortDirection)->select('prospects.*');
        
        } elseif ($sortField === 'prospect_id') {
            $query->orderBy('id', $sortDirection);
        } else {
            $query->orderBy($sortField, $sortDirection);
        }

        $prospects = $query->paginate(20)->withQueryString()
            ->through(fn ($item) => $this->transformProspectData($item));

        $telemarketers = User::where('role', 'sales')->orderBy('name')->get(['id', 'name']);
        
        return Inertia::render('Prospects', [
            'prospects'       => $prospects,
            'statusOptions'   => self::PROSPECT_STATUSES,
            'telemarketers'   => $telemarketers,
            'channelOptions'  => ['Phone', 'Email', 'WhatsApp', 'SMS'],
            'filters'         => $request->all(),
            'personalStats'   => [
                'hot_leads'    => $hotLeadsCount,
                'calls_today'  => $myCallsToday,
                'duration_min' => $myDurationMin,
            ],
            'statusStats'     => $statusStats 
        ]);
    }

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

            DB::commit();
            
            return redirect()->route('sales.prospects.index', ['page' => $validated['current_page'] ?? 1])
                ->with('success', "Log aktivitas #{$prospect->id} tersimpan.");

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
                 'status_type' => $statusConfig['type'], 'description' => $statusConfig['desc'], 'updated_by_user_id' => auth()->id()
             ]);
             $prospect->prospect_status_id = $statusModel->id;
             $statusId = $statusModel->id;
         }
         $prospect->save();
         return $statusId;
    }

    private function getStatusColor($code) {
        return match($code) {
            'CONTACTED' => 'blue', 'INTERESTED' => 'purple', 'ACCEPTED' => 'green',
            'REFUSED' => 'red', 'NO_ANSWER' => 'orange', 'INVALID_NUMBER' => 'gray', default => 'gray'
        };
    }

    private function transformProspectData($item) {
        // UPDATE: Mapping total durasi dari hasil withSum
        // Laravel secara otomatis menamai kolom sum sebagai {relation_name}_sum_{column_name}
        $totalDuration = (int) $item->contact_activities_sum_call_duration_sec ?? 0;

        return [
            'prospect_id' => $item->id, 
            'status_code' => $item->status?->status_code ?? 'NEW',
            'description' => $item->description, 
            'score' => $item->latestScore?->score_value,
            'priority' => $item->latestScore?->priority, 
            'telemarketer_name' => $item->latestActivity?->telemarketer?->name ?? '-',
            'contact_channel' => $item->latestActivity?->contact_channel ?? '-',
            // 'call_duration_sec' => $item->latestActivity?->call_duration_sec ?? 0, // Code lama
            'total_duration_sec' => $totalDuration, // Code baru (Total)
            'age' => $item->age, 
            'job' => $item->job, 
            'education' => $item->education, 
            'month' => $item->month,
            'duration' => $item->duration, 
            'campaign' => $item->campaign, 
            'poutcome' => $item->poutcome,
            'created_at' => $item->created_at->toIso8601String(),
        ];
    }
}
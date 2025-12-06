<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\ProspectStatus;
use App\Models\ContactActivity;
use App\Models\User;
use App\Models\PredictionScore; // Pastikan Model ini di-import
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

        $userId = $request->user()->id;
        $today  = now()->format('Y-m-d');

        // --- 1. STATISTIK PERSONAL ---
        $hotLeadsCount = Prospect::whereHas('status', fn($q) => $q->where('status_code', 'NEW'))
            ->whereHas('latestScore', fn($q) => $q->where('priority', 1))
            ->count();

        $myCallsToday = ContactActivity::where('telemarketer_id', $userId)
            ->whereDate('contact_at', $today)->count();

        $myDurationSec = ContactActivity::where('telemarketer_id', $userId)
            ->whereDate('contact_at', $today)->sum('call_duration_sec');
        $myDurationMin = round($myDurationSec / 60, 1);

        // --- 2. STATISTIK GLOBAL PIPELINE ---
        $statusStats = [];
        $allStatuses = collect(self::PROSPECT_STATUSES)->where('code', '!==', 'NEW')->values();

        foreach ($allStatuses as $status) {
            $count = Prospect::whereHas('status', function($q) use ($status) {
                $q->where('status_code', $status['code']);
            })->count();

            $statusStats[] = [
                'code' => $status['code'], 'desc' => $status['desc'], 'count' => $count,
                'color' => $this->getStatusColor($status['code'])
            ];
        }

        // --- 3. LOGIKA FILTER & SORTING ---
        $sortField = $request->input('sort_field', 'created_at'); 
        $sortDirection = $request->input('sort_direction', 'desc');
        $searchQuery = $request->input('search');

        // Query Utama
        $query = Prospect::query()
            ->with(['status', 'latestScore', 'latestActivity.telemarketer'])
            ->withSum('contactActivities', 'call_duration_sec')
            ->withCount('contactActivities'); // Penting untuk sort Total Call

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

        // --- OPTIMASI SORTING GLOBAL ---
        
        if ($sortField === 'score') {
            // Subquery Order: Mengurutkan berdasarkan value score terbaru
            $query->orderBy(
                PredictionScore::select('score_value')
                    ->whereColumn('prospect_id', 'prospects.id')
                    ->latest('id')
                    ->limit(1),
                $sortDirection
            );

        } elseif ($sortField === 'priority') {
            // Subquery Order: Mengurutkan berdasarkan priority terbaru
            $query->orderBy(
                PredictionScore::select('priority')
                    ->whereColumn('prospect_id', 'prospects.id')
                    ->latest('id')
                    ->limit(1),
                $sortDirection
            );
            
        } elseif ($sortField === 'call_count') {
             // Sorting berdasarkan hasil count relasi
             $query->orderBy('contact_activities_count', $sortDirection);

        } else {
            // Default: Sorting kolom tabel prospects (ID, Created_at, dll)
            // Mapping nama field FE ke nama kolom database jika beda
            $realField = ($sortField === 'prospect_id') ? 'id' : $sortField;
            $query->orderBy($realField, $sortDirection);
        }

        // Pagination & Transform
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
            
            return redirect()->route('sales.prospects.index', [
                'page' => $validated['current_page'] ?? 1,
                // Kita perlu mempertahankan filter yang ada saat redirect balik
                'sort_field' => $request->input('sort_field'),
                'sort_direction' => $request->input('sort_direction'),
            ])->with('success', "Log aktivitas #{$prospect->id} tersimpan.");

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
}
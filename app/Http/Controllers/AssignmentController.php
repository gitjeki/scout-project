<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\User;
use App\Models\ProspectStatus;
use App\Models\PredictionScore;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AssignmentController extends Controller
{
    /**
     * PRIVATE: Logic Filter Pusat (OPTIMIZED - JOIN STRATEGY)
     * Menggunakan teknik JOIN agar filter priority dan sorting score
     * berjalan cepat tanpa Subquery OrderBy yang berat.
     */
    private function getFilteredQuery(Request $request)
    {
        // 1. Siapkan Subquery untuk mendapatkan Score TERAKHIR saja per prospek
        // Ini kunci agar saat di-JOIN, data tidak duplikat (one-to-one)
        $latestScoresSub = PredictionScore::select('prospect_id', DB::raw('MAX(id) as max_score_id'))
            ->groupBy('prospect_id');

        // 2. Query Utama
        $query = Prospect::query()
            // Kita select spesifik agar ID prospect tidak tertimpa ID score saat join
            ->select('prospects.*') 
            
            // JOIN 1: Tempelkan prospek dengan ID score terbarunya
            ->joinSub($latestScoresSub, 'latest_scores_group', function ($join) {
                $join->on('prospects.id', '=', 'latest_scores_group.prospect_id');
            })
            
            // JOIN 2: Tempelkan tabel score asli berdasarkan ID terbaru tadi
            // Sekarang kita punya akses langsung ke kolom 'priority' dan 'score_value'
            ->join('prediction_scores', 'latest_scores_group.max_score_id', '=', 'prediction_scores.id')
            
            // Eager load relasi untuk kebutuhan tampilan data (kosmetik)
            ->with(['status', 'latestScore.user', 'assignedAgent']);

        // --- FILTERING (Sekarang lebih cepat karena akses kolom langsung) ---

        // 1. Filter Search ID
        if ($request->filled('search') && is_numeric($request->search)) {
            $query->where('prospects.id', $request->search);
        }

        // 2. Filter Status (Asumsi status via relasi, pakai whereHas tetap oke untuk data menengah)
        if ($request->filled('filter_status')) {
            $query->whereHas('status', function($q) use ($request) {
                $q->where('status_code', $request->filter_status);
            });
        }

        // 3. Filter Priority (OPTIMASI BESAR DISINI)
        // Dulu: whereHas (lambat). Sekarang: where biasa ke tabel hasil join.
        if ($request->filled('filter_priority')) {
            $query->where('prediction_scores.priority', $request->filter_priority);
        }

        // 4. Filter Assigned
        $assignedFilter = $request->input('filter_assigned', 'unassigned');
        if ($assignedFilter === 'unassigned') {
            $query->whereNull('prospects.assigned_to');
        } elseif ($assignedFilter === 'assigned') {
            $query->whereNotNull('prospects.assigned_to');
        } else {
            // Pastikan sebut nama tabel 'prospects.' agar tidak ambigu
            $query->where('prospects.assigned_to', $assignedFilter);
        }

        // --- SORTING (OPTIMASI TERBESAR) ---
        
        // Dulu: Subquery per baris (Sangat Lambat).
        // Sekarang: Order by kolom biasa karena tabel sudah di-JOIN.
        $query->orderBy('prediction_scores.score_value', 'desc');

        return $query;
    }

    public function index(Request $request)
    {
        // Ambil data pendukung (dropdown)
        $salesAgents = User::where('role', 'sales')->select('id', 'name')->orderBy('name')->get();
        $statuses = ProspectStatus::select('status_code')->distinct()->get();

        // Panggil logic query yang sudah dioptimasi
        $query = $this->getFilteredQuery($request);

        // Eksekusi Pagination
        $prospects = $query->paginate(50)
            ->withQueryString()
            ->through(function ($item) {
                // Mapping data untuk Frontend
                // Kita ambil data dari relation yang sudah di-eager load (with)
                $latestScore = $item->latestScore; 
                
                return [
                    'id'             => $item->id,
                    'status'         => $item->status ? $item->status->status_code : 'UNKNOWN',
                    'score'          => $latestScore ? $latestScore->score_value : null,
                    'priority'       => $latestScore ? $latestScore->priority : null,
                    'scored_at'      => $latestScore ? Carbon::parse($latestScore->scored_at)->format('d M Y H:i') : '-',
                    'scored_by'      => $latestScore && $latestScore->user ? $latestScore->user->name : '-',
                    'assigned_to'    => $item->assignedAgent ? $item->assignedAgent->name : null,
                    'assigned_to_id' => $item->assigned_to,
                ];
            });

        return Inertia::render('Assignment/Index', [
            'prospects'   => $prospects,
            'salesAgents' => $salesAgents,
            'statuses'    => $statuses,
            'filters'     => $request->only(['search', 'filter_status', 'filter_priority', 'filter_assigned']),
        ]);
    }

    /**
     * API: Ambil ID untuk "Auto Select" Frontend
     */
    public function getIds(Request $request)
    {
        $request->validate(['amount' => 'required|integer|min:1']);

        $query = $this->getFilteredQuery($request);

        // PENTING: Pluck 'prospects.id' secara spesifik
        // Karena ada join, field 'id' jadi ambigu kalau tidak spesifik.
        $ids = $query->limit($request->amount)->pluck('prospects.id');

        return response()->json($ids);
    }

    /**
     * Handle Assign Manual
     */
    public function assign(Request $request)
    {
        $request->validate([
            'sales_id' => 'required|exists:users,id',
            'ids'      => 'required|array',
            'ids.*'    => 'exists:prospects,id',
        ]);

        // Update massal sederhana (cepat)
        $count = Prospect::whereIn('id', $request->ids)
            ->update(['assigned_to' => $request->sales_id]);

        // Ambil nama sales untuk notifikasi
        $salesUser = User::find($request->sales_id);
        $salesName = $salesUser ? $salesUser->name : 'Sales';

        return back()->with('success', "Berhasil menugaskan {$count} prospek kepada {$salesName}.");
    }
}
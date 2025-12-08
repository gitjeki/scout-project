<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\User;
use App\Models\ProspectStatus;
use App\Models\PredictionScore;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AssignmentController extends Controller
{
    /**
     * Menampilkan Halaman Penugasan
     */
    public function index(Request $request)
    {
        // 1. Ambil Data Pendukung untuk Dropdown
        $salesAgents = User::where('role', 'sales')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $statuses = ProspectStatus::select('status_code')->distinct()->get();

        // 2. Query Utama
        $query = Prospect::with(['status', 'latestScore.user', 'assignedAgent'])
            ->readyForPrediction(); 

        // --- FILTER 1: SEARCH ID ---
        if ($request->filled('search')) {
            if (!is_numeric($request->search)) {
                // Redirect agar URL bersih jika input bukan angka
                return to_route('assignments.index', $request->except(['search']))
                    ->with('error', 'ID Pencarian harus berupa angka valid!');
            }
            $query->where('id', $request->search);
        }

        // --- FILTER 2: STATUS ---
        if ($request->filled('filter_status')) {
            $query->whereHas('status', function($q) use ($request) {
                $q->where('status_code', $request->filter_status);
            });
        }

        // --- FILTER 3: PRIORITY ---
        if ($request->filled('filter_priority')) {
            $query->whereHas('latestScore', function($q) use ($request) {
                $q->where('priority', $request->filter_priority);
            });
        }

        // --- FILTER 4: ASSIGNED TO ---
        // Logic default: Jika tidak ada filter, tampilkan yang 'unassigned'
        $assignedFilter = $request->input('filter_assigned', 'unassigned');

        if ($assignedFilter === 'unassigned') {
            $query->whereNull('assigned_to');
        } elseif ($assignedFilter === 'assigned') {
            $query->whereNotNull('assigned_to');
        } else {
            $query->where('assigned_to', $assignedFilter);
        }

        // 3. Sorting (Score Tertinggi ke Terendah)
        $query->orderBy(
            PredictionScore::select('score_value')
                ->whereColumn('prospect_id', 'prospects.id')
                ->latest('id')->limit(1),
            'desc' 
        );

        // 4. Pagination & Formatting Data
        $prospects = $query->paginate(50) 
            ->withQueryString()
            ->through(function ($item) {
                return [
                    'id'             => $item->id,
                    'status'         => $item->status ? $item->status->status_code : 'UNKNOWN',
                    'score'          => $item->latestScore ? $item->latestScore->score_value : null,
                    'priority'       => $item->latestScore ? $item->latestScore->priority : null,
                    'scored_at'      => $item->latestScore 
                                        ? Carbon::parse($item->latestScore->scored_at)->format('d M Y H:i') 
                                        : '-',
                    'scored_by'      => $item->latestScore && $item->latestScore->user 
                                        ? $item->latestScore->user->name 
                                        : '-',
                    'assigned_to'    => $item->assignedAgent ? $item->assignedAgent->name : null,
                    'assigned_to_id' => $item->assigned_to,
                ];
            });

        // 5. Render ke Inertia
        return Inertia::render('Assignment/Index', [
            'prospects'   => $prospects,
            'salesAgents' => $salesAgents,
            'statuses'    => $statuses,
            // Kirim balik filter yang sedang aktif ke frontend agar UI dropdown sesuai
            'filters'     => [
                'search'          => $request->search,
                'filter_status'   => $request->filter_status,
                'filter_priority' => $request->filter_priority,
                'filter_assigned' => $assignedFilter,
            ],
        ]);
    }

    /**
     * Handle Assign Sales
     */
    public function assign(Request $request)
    {
        $request->validate([
            'sales_id' => 'required|exists:users,id',
            'ids'      => 'required|array',
            'ids.*'    => 'exists:prospects,id',
        ]);

        $count = Prospect::whereIn('id', $request->ids)
            ->update(['assigned_to' => $request->sales_id]);

        $salesName = User::find($request->sales_id)->name;

        return back()->with('success', "Berhasil menugaskan {$count} prospek kepada {$salesName}.");
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\ProspectStatus;
use App\Models\ContactActivity;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    // Definisi Status Master
    private $statuses = [
        ['code' => 'NEW',            'type' => 'open',            'desc' => 'Data baru, belum dihubungi'],
        ['code' => 'CONTACTED',      'type' => 'open',            'desc' => 'Sudah ditelepon, belum ada keputusan'],
        ['code' => 'INTERESTED',     'type' => 'open',            'desc' => 'Nasabah tertarik, butuh follow up'],
        ['code' => 'ACCEPTED',       'type' => 'closed_accepted', 'desc' => 'Nasabah setuju mendaftar'],
        ['code' => 'REFUSED',        'type' => 'closed_refused',  'desc' => 'Nasabah menolak penawaran'],
        ['code' => 'NO_ANSWER',      'type' => 'closed_refused',  'desc' => 'Telepon tidak diangkat berkali-kali'],
        ['code' => 'INVALID_NUMBER', 'type' => 'closed_refused',  'desc' => 'Nomor telepon salah/tidak terdaftar'],
    ];

    /**
     * Halaman Utama List Prospek Sales
     */
    public function index(Request $request)
    {
        if ($request->user()->role !== 'sales') {
            abort(403, 'Akses khusus Sales.');
        }

        // 1. Ambil Parameter Sorting dari Frontend (Default: Created At - Descending)
        $sortField = $request->input('sort_field', 'created_at'); 
        $sortDirection = $request->input('sort_direction', 'desc');

        // 2. Daftar kolom yang BOLEH di-sort (Security)
        $allowedSorts = ['created_at', 'score', 'status_code'];

        $query = Prospect::with(['status', 'latestScore', 'latestActivity.telemarketer']);

        // 3. Logika Sorting Dinamis
        if (in_array($sortField, $allowedSorts)) {
            if ($sortField === 'score') {
                // Sorting berdasarkan relasi (agak tricky di Laravel)
                $query->leftJoin('prediction_scores', 'prospects.id', '=', 'prediction_scores.prospect_id')
                      ->orderBy('prediction_scores.score_value', $sortDirection)
                      ->select('prospects.*'); // Penting agar id tidak tertimpa
            } elseif ($sortField === 'status_code') {
                $query->leftJoin('prospect_statuses', 'prospects.prospect_status_id', '=', 'prospect_statuses.id')
                      ->orderBy('prospect_statuses.status_code', $sortDirection)
                      ->select('prospects.*');
            } else {
                // Sorting kolom biasa
                $query->orderBy($sortField, $sortDirection);
            }
        } else {
            // Default fallback
            $query->orderByDesc('created_at');
        }

        $prospects = $query->paginate(20)
            ->withQueryString() // Agar parameter sort tidak hilang saat pindah halaman
            ->through(function ($item) {
                $latestActivity = $item->latestActivity;
                
                return [
                    'prospect_id'    => $item->id,
                    'status_code'    => $item->status ? $item->status->status_code : 'NEW',
                    'description'    => $item->description, 
                    'score'          => $item->latestScore ? $item->latestScore->score_value : null,
                    'priority'       => $item->latestScore ? $item->latestScore->priority : null,
                    
                    // Data Aktivitas
                    'telemarketer_name' => $latestActivity && $latestActivity->telemarketer 
                                            ? $latestActivity->telemarketer->name 
                                            : '-',
                    'contact_channel'   => $latestActivity ? $latestActivity->contact_channel : '-',
                    'call_duration_sec' => $latestActivity ? $latestActivity->call_duration_sec : 0,
                    
                    // Data Nasabah
                    'age'            => $item->age ?? '-',
                    'job'            => $item->job ?? '-',
                    'education'      => $item->education ?? '-',
                    'month'          => $item->month,
                    'duration'       => $item->duration,
                    'campaign'       => $item->campaign,
                    'poutcome'       => $item->poutcome,
                    'created_at'     => $item->created_at->format('Y-m-d H:i'), // Tambahan untuk display tanggal
                ];
            });

        return Inertia::render('Prospects', [ // Pastikan nama file di JS/Pages/Prospects.jsx sesuai ini
            'prospects'     => $prospects,
            'statusOptions' => $this->statuses,
            // Kirim balik state sorting agar panah di tabel frontend sesuai
            'filters'       => $request->only(['sort_field', 'sort_direction']), 
        ]);
    }

    /**
     * Update Biasa (Tanpa Tracking Timer)
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'status_code' => 'required|string',
            'description' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            $prospect = Prospect::findOrFail($id);
            $this->updateProspectData($prospect, $validated['status_code'], $validated['description']);
            DB::commit();
            return back()->with('success', 'Data berhasil diupdate.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal: ' . $e->getMessage());
        }
    }

    /**
     * Log Activity (Tracking Telepon)
     */
    public function logActivity(Request $request)
    {
        $validated = $request->validate([
            'prospect_id'       => 'required|exists:prospects,id',
            'status_code'       => 'required|string',
            'contact_notes'     => 'nullable|string',     
            'call_duration_sec' => 'required|integer|min:0',
            'contact_channel'   => 'required|string',    
        ]);

        DB::beginTransaction();
        try {
            $prospect = Prospect::findOrFail($validated['prospect_id']);
            $statusId = $this->updateProspectData($prospect, $validated['status_code'], $validated['contact_notes']);

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
            return back()->with('success', 'Aktivitas Telepon berhasil disimpan & dilacak.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menyimpan log: ' . $e->getMessage());
        }
    }

    /**
     * Helper Function
     */
    private function updateProspectData($prospect, $statusCode, $description)
    {
        $prospect->description = $description;
        
        $statusConfig = collect($this->statuses)->firstWhere('code', $statusCode);
        $statusId = $prospect->prospect_status_id; 

        if ($statusConfig) {
            $statusModel = ProspectStatus::firstOrCreate(
                ['status_code' => $statusCode],
                [
                    'status_type' => $statusConfig['type'],
                    'description' => $statusConfig['desc']
                ]
            );
            $prospect->prospect_status_id = $statusModel->id;
            $statusId = $statusModel->id;
        }

        $prospect->save();
        return $statusId;
    }
}
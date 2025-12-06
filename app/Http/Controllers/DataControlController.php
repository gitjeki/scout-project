<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\ProspectStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DataControlController extends Controller
{
    public function index(Request $request)
    {
        // 1. Query Dasar: Ambil data yang "Incomplete" (ada null)
        $query = Prospect::with(['status'])
            ->incompleteData(); // Menggunakan scope dari Model

        // Filter Status (jika perlu filter status juga di sini)
        if ($request->has('status') && $request->status != '') {
            $query->whereHas('status', function($q) use ($request) {
                $q->where('status_code', $request->status);
            });
        }

        // 2. Pagination
        $prospects = $query->orderByDesc('id')
            ->paginate(50)
            ->withQueryString()
            ->through(function ($item) {
                return [
                    'id'             => $item->id,
                    'status'         => $item->status ? $item->status->status_code : 'UNKNOWN',
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

        return Inertia::render('DataControl', [
            'prospects' => $prospects,
            'filters'   => $request->only(['status']),
        ]);
    }
}
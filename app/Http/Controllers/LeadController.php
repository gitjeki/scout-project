<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
// --- TAMBAHAN BARU UNTUK PYTHON ---
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class LeadController extends Controller
{
    // --- 1. HALAMAN DAFTAR PROSPEK ---
    public function index()
    {
        // Ambil data leads dari database, urutkan dari yang terbaru
        $leads = Lead::latest()->get();

        return Inertia::render('Admin/Leads/Index', [
            'leads' => $leads
        ]);
    }

    // --- 2. HALAMAN FORM TAMBAH ---
    public function create()
    {
        return Inertia::render('Admin/Leads/Create');
    }

    // --- 3. PROSES SIMPAN DATA & PREDIKSI AI ---
    public function store(Request $request)
    {
        // A. Validasi Input Manusia
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'age' => 'required|integer|min:17|max:99',
            'job' => 'required|string',
            'education' => 'required|string',
            'marital' => 'nullable|string',
            'housing' => 'nullable|string',
            'loan' => 'nullable|string',
        ]);

        // B. Tambahkan Data "Otomatis" (System Generated)
        $monthMap = [
            'Jan' => 'jan', 'Feb' => 'feb', 'Mar' => 'mar', 'Apr' => 'apr',
            'May' => 'may', 'Jun' => 'jun', 'Jul' => 'jul', 'Aug' => 'aug',
            'Sep' => 'sep', 'Oct' => 'oct', 'Nov' => 'nov', 'Dec' => 'dec'
        ];
        
        $currentMonth = date('M'); 
        $validated['month'] = $monthMap[$currentMonth] ?? 'may'; 
        
        $validated['status'] = 'New';
        $validated['campaign'] = 1;

        // C. Simpan ke Database (Awalnya belum ada skor)
        $lead = Lead::create($validated);

        // --- D. INTEGRASI MACHINE LEARNING (PYTHON) ---
        try {
            // 1. Siapkan data gabungan (Input User + Data Ekonomi Default)
            $inputData = array_merge($validated, [
                'cons_price_idx' => 93.57,
                'cons_conf_idx' => -40.5,
                'euribor3m' => 3.62,
                'nr_employed' => 5167.0,
                'poutcome' => 'nonexistent'
            ]);

            // 2. Konversi ke JSON String untuk dikirim ke Python
            $jsonInput = json_encode($inputData);
            
            // 3. Tentukan lokasi script Python
            $scriptPath = base_path('ml_engine/predict_lead.py');
            
            // 4. Jalankan perintah terminal: python predict_lead.py '{"data":...}'
            // PENTING: Gunakan 'python' atau 'python3' tergantung settingan komputer server
            $process = new Process(['python', $scriptPath, $jsonInput]);
            $process->run();

            // 5. Cek Hasil Eksekusi
            if ($process->isSuccessful()) {
                // Ambil output yang dicetak oleh Python (print)
                $output = $process->getOutput();
                $result = json_decode($output, true);

                // 6. Update Database dengan Hasil Prediksi
                if (isset($result['score'])) {
                    $lead->update([
                        'prediction_score' => $result['score'],
                        'prediction_label' => $result['label']
                    ]);
                }
            } else {
                // Opsional: Log error jika Python gagal (bisa dicek di laravel.log)
                // \Log::error($process->getErrorOutput());
            }

        } catch (\Exception $e) {
            // Jika terjadi error sistem, biarkan aplikasi tetap jalan
            // Data lead tetap tersimpan meski tanpa prediksi
        }

        return redirect()->route('leads.index')->with('message', 'Prospek berhasil ditambah! Analisis AI Selesai.');
    }
}
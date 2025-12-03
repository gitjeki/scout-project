import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, Link, usePage } from '@inertiajs/react'; // Tambah usePage
import { FaUserPlus, FaRobot, FaWhatsapp, FaEdit } from 'react-icons/fa';

export default function LeadIndex({ leads }) {
    // 1. AMBIL DATA USER YANG SEDANG LOGIN
    const { auth } = usePage().props;
    
    // Cek apakah dia Admin?
    const isAdmin = auth.user.role === 'admin';

    return (
        <SidebarLayout header="Daftar Prospek Nasabah">
            <Head title="Leads AI" />

            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                
                {/* --- HEADER & TOMBOL --- */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-gray-800 font-bold text-lg">
                        Monitoring & Prediksi AI
                    </h3>

                    {/* 2. LOGIKA KUNCI: TOMBOL INI HANYA MUNCUL JIKA ADMIN */}
                    {isAdmin && (
                        <Link 
                            href={route('leads.create')} 
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded flex items-center gap-2 font-semibold shadow-sm transition"
                        >
                            <FaUserPlus /> Tambah Prospek
                        </Link>
                    )}
                </div>

                {/* --- TABEL DATA --- */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-orange-50 text-gray-700 uppercase text-sm leading-normal border-b border-orange-100">
                                <th className="py-3 px-6 text-left">Nasabah</th>
                                <th className="py-3 px-6 text-left">Profil Singkat</th>
                                <th className="py-3 px-6 text-center bg-orange-100 text-orange-800 border-x border-orange-200">
                                    <div className="flex justify-center items-center gap-1">
                                        <FaRobot /> Prediksi AI
                                    </div>
                                </th>
                                <th className="py-3 px-6 text-center">Status</th>
                                <th className="py-3 px-6 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {leads.map((lead) => (
                                <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    {/* ... (Bagian Nama, Profil, AI Prediksi sama seperti sebelumnya) ... */}
                                    
                                    <td className="py-3 px-6 text-left">
                                        <span className="font-bold block text-gray-800">{lead.name}</span>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                            <FaWhatsapp className="text-green-500" /> 
                                            {lead.phone_number || '-'}
                                        </div>
                                    </td>

                                    <td className="py-3 px-6 text-left">
                                        <div className="text-xs">
                                            <p><span className="font-semibold">Umur:</span> {lead.age} Th</p>
                                            <p><span className="font-semibold">Pekerjaan:</span> {lead.job}</p>
                                        </div>
                                    </td>

                                    <td className="py-3 px-6 text-center border-x border-gray-100 bg-gray-50">
                                        {lead.prediction_label ? (
                                            <div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    lead.prediction_label === 'Potensial' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {lead.prediction_label}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Menunggu...</span>
                                        )}
                                    </td>

                                    <td className="py-3 px-6 text-center">
                                        <span className={`py-1 px-3 rounded-full text-xs ${
                                            lead.status === 'New' ? 'bg-blue-100 text-blue-600' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {lead.status}
                                        </span>
                                    </td>

                                    {/* 3. LOGIKA AKSI: TOMBOL BERBEDA BUAT ADMIN vs SALES */}
                                    <td className="py-3 px-6 text-center">
                                        {isAdmin ? (
                                            // Admin cuma bisa lihat detail (atau delete nanti)
                                            <button className="text-gray-400 hover:text-orange-500 transition text-xs">
                                                Lihat Detail
                                            </button>
                                        ) : (
                                            // Sales punya tombol Update Status
                                            <button className="bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition flex items-center gap-1 mx-auto text-xs font-bold border border-blue-200">
                                                <FaEdit /> Update Status
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {/* Pesan jika tabel kosong */}
                    {leads.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-gray-400 mb-2">Belum ada data prospek real.</p>
                            {isAdmin && (
                                <p className="text-sm text-gray-500">
                                    Silakan klik tombol <b>Tambah Prospek</b> di atas untuk mencoba prediksi AI.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </SidebarLayout>
    );
}
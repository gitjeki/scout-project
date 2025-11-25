import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { FaKey, FaClock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function ResetPasswordIndex({ requests }) {
    // 1. Ambil Flash Message (Pesan Sukses/Error) dari Backend
    const { flash } = usePage().props || {}; 
    
    // 2. Pastikan data requests aman (berupa array) agar tidak error blank screen
    const safeRequests = Array.isArray(requests) ? requests : [];

    // 3. FUNGSI UTAMA: Menangani Reset Password Manual
    const handleReset = (id, name) => {
        // Tampilkan kotak input browser (Prompt)
        const newPassword = prompt(`Masukkan Password Baru untuk ${name}:`, "Bank12345");

        // Jika Admin menekan OK dan password tidak kosong
        if (newPassword !== null && newPassword.trim() !== "") {
            
            // Validasi sederhana di sisi Admin
            if (newPassword.length < 6) {
                alert("Password terlalu pendek! Minimal 6 karakter.");
                return;
            }

            // Kirim password manual ke Backend
            router.post(route('admin.reset.action', id), {
                password: newPassword
            }, {
                onSuccess: () => {
                    // Opsional: Bisa tambah notifikasi toast di sini jika mau
                }
            });
        }
    };

    return (
        <SidebarLayout header="Permintaan Reset Password">
            <Head title="Reset Password" />

            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                
                {/* --- NOTIFIKASI SUKSES (Flash Message) --- */}
                {flash?.message && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r shadow-sm flex items-start gap-3 animate-fade-in-down">
                        <FaCheckCircle className="text-green-500 mt-1" />
                        <div>
                            <p className="font-bold text-green-800">Berhasil!</p>
                            <p className="text-sm text-green-700">{flash.message}</p>
                        </div>
                    </div>
                )}

                {/* --- NOTIFIKASI ERROR (Jika ada) --- */}
                {flash?.error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start gap-3">
                        <FaExclamationCircle className="text-red-500 mt-1" />
                        <div>
                            <p className="font-bold text-red-800">Gagal!</p>
                            <p className="text-sm text-red-700">{flash.error}</p>
                        </div>
                    </div>
                )}

                {/* --- HEADER TABEL --- */}
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                    <FaKey className="text-yellow-500" />
                    Daftar Permintaan Masuk
                </h3>

                {/* --- TABEL DATA --- */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-yellow-50 text-gray-700 uppercase text-sm leading-normal border-b border-yellow-100">
                                <th className="py-3 px-6 text-left">User Pemohon</th>
                                <th className="py-3 px-6 text-left">Email</th>
                                <th className="py-3 px-6 text-left">Waktu Request</th>
                                <th className="py-3 px-6 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {safeRequests.length > 0 ? (
                                safeRequests.map((req) => (
                                    <tr key={req.id || Math.random()} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                        
                                        {/* Kolom Nama */}
                                        <td className="py-3 px-6 text-left whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="mr-3 w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold text-xs border border-yellow-200">
                                                    {req.name ? req.name.charAt(0) : '?'}
                                                </div>
                                                <span className="font-medium text-gray-800">{req.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        
                                        {/* Kolom Email */}
                                        <td className="py-3 px-6 text-left">{req.email}</td>
                                        
                                        {/* Kolom Waktu */}
                                        <td className="py-3 px-6 text-left">
                                            <div className="flex items-center gap-2 text-xs bg-gray-100 py-1 px-2 rounded w-max">
                                                <FaClock className="text-gray-400"/>
                                                {req.created_at ? new Date(req.created_at).toLocaleString('id-ID') : '-'}
                                            </div>
                                        </td>

                                        {/* Kolom Tombol Aksi */}
                                        <td className="py-3 px-6 text-center">
                                            <button 
                                                onClick={() => handleReset(req.id, req.name)}
                                                className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-full text-xs font-bold shadow-sm transition transform hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
                                                title="Klik untuk membuat password baru secara manual"
                                            >
                                                <FaKey /> Atur Password
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                // Tampilan Jika Tabel Kosong
                                <tr>
                                    <td colSpan="4" className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center">
                                            <FaCheckCircle className="h-10 w-10 text-green-400 mb-3" />
                                            <h3 className="text-lg font-medium text-gray-900">Semua Beres!</h3>
                                            <p className="text-gray-500">Tidak ada permintaan reset password yang menunggu.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </SidebarLayout>
    );
}
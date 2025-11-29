import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, usePage } from '@inertiajs/react';
import { FaUsers, FaUserTie, FaKey } from 'react-icons/fa';

export default function Dashboard({ stats, latest_users }) {
    const user = usePage().props.auth.user;

    return (
        <SidebarLayout header="Dashboard Utama">
            <Head title="Dashboard" />

            {/* --- STATISTIK CARDS (Hanya untuk Admin) --- */}
            {user.role === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600 mr-4">
                            <FaUserTie size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Total Sales</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stats.total_sales}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
                        <div className="p-3 bg-purple-100 rounded-full text-purple-600 mr-4">
                            <FaUsers size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Total Admin</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stats.total_admin}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-full text-yellow-600 mr-4">
                            <FaKey size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Permintaan Reset</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stats.pending_resets}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* --- LIST USER / WELCOME --- */}
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                
                {/* Judul dihapus/diganti dengan yang lebih relevan */}
                <div className="mb-4 pb-2 border-b border-gray-100">
                     <span className="text-gray-500 font-medium text-sm">Aktivitas Anggota Baru</span>
                </div>

                {user.role === 'admin' ? (
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 uppercase">
                            <tr>
                                <th className="px-4 py-3">Nama</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Bergabung</th>
                            </tr>
                        </thead>
                        <tbody>
                            {latest_users && latest_users.length > 0 ? latest_users.map((u) => (
                                <tr key={u.id} className="border-b">
                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {u.name.charAt(0)}
                                        </div>
                                        {u.name}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" className="px-4 py-3 text-center text-gray-500">Belum ada data.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-600 text-center py-4">
                        Halo <b>{user.name}</b>, selamat bekerja! Cek menu prospek untuk memulai.
                    </p>
                )}
            </div>
        </SidebarLayout>
    );
}
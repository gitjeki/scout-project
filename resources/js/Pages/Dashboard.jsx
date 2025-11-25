import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, usePage } from '@inertiajs/react';
import { FaUsers, FaUserTie, FaKey } from 'react-icons/fa';

export default function Dashboard({ stats, latest_users }) {
    const user = usePage().props.auth.user;

    return (
        <SidebarLayout header="Dashboard Utama">
            <Head title="Dashboard" />

            {/* --- 1. STATISTIK CARDS (Hanya untuk Admin) --- */}
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

            {/* --- 2. LIST USER TERBARU --- */}
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                    {user.role === 'admin' ? '5 Anggota Terbaru' : 'Status Akun Anda'}
                </h3>

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
                            {latest_users.map((u) => (
                                <tr key={u.id} className="border-b">
                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
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
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-600">
                        Selamat bekerja, <b>{user.name}</b>! Silakan akses menu di sebelah kiri untuk melihat prospek nasabah.
                    </p>
                )}
            </div>
        </SidebarLayout>
    );
}
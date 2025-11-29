import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import { FaKey, FaClock, FaCheckCircle, FaExclamationCircle, FaTrash } from 'react-icons/fa';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function ResetPasswordIndex({ requests }) {
    const { flash } = usePage().props || {}; 
    const safeRequests = Array.isArray(requests) ? requests : [];

    // STATE UNTUK MODAL
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    // Buka Modal Reset
    const openResetModal = (req) => {
        setSelectedRequest(req);
        setNewPassword('Bank12345'); // Default value
        setIsResetModalOpen(true);
    };

    // Submit Password Baru
    const submitReset = (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            alert('Password minimal 6 karakter');
            return;
        }

        router.post(route('admin.reset.action', selectedRequest.id), {
            password: newPassword
        }, {
            onSuccess: () => {
                setIsResetModalOpen(false);
                setNewPassword('');
            }
        });
    };

    // Fungsi Hapus / Abaikan Request
    const handleDelete = (id) => {
        if(confirm('Abaikan permintaan ini? Data permintaan akan dihapus.')) {
            router.delete(route('admin.reset.destroy', id));
        }
    }

    return (
        <SidebarLayout header="Permintaan Reset Password">
            <Head title="Reset Password" />

            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                
                {/* Notifikasi */}
                {flash?.message && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r shadow-sm flex items-start gap-3">
                        <FaCheckCircle className="text-green-500 mt-1" />
                        <div><p className="font-bold text-green-800">Berhasil!</p><p className="text-sm text-green-700">{flash.message}</p></div>
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start gap-3">
                        <FaExclamationCircle className="text-red-500 mt-1" />
                        <div><p className="font-bold text-red-800">Gagal!</p><p className="text-sm text-red-700">{flash.error}</p></div>
                    </div>
                )}

                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                    <FaKey className="text-yellow-500" /> Daftar Permintaan Masuk
                </h3>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-yellow-50 text-gray-700 uppercase text-sm leading-normal border-b border-yellow-100">
                                <th className="py-3 px-6 text-left">User Pemohon</th>
                                <th className="py-3 px-6 text-left">Email</th>
                                <th className="py-3 px-6 text-left">Waktu</th>
                                <th className="py-3 px-6 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {safeRequests.length > 0 ? (
                                safeRequests.map((req) => (
                                    <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-6 text-left font-medium">{req.name || 'Unknown'}</td>
                                        <td className="py-3 px-6 text-left">{req.email}</td>
                                        <td className="py-3 px-6 text-left text-xs">
                                            <div className="flex items-center gap-2 bg-gray-100 py-1 px-2 rounded w-max">
                                                <FaClock className="text-gray-400"/>
                                                {req.created_at ? new Date(req.created_at).toLocaleString('id-ID') : '-'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    onClick={() => openResetModal(req)}
                                                    className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded text-xs font-bold shadow flex items-center gap-2"
                                                >
                                                    <FaKey /> Atur Password
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(req.id)}
                                                    className="bg-red-100 hover:bg-red-200 text-red-600 py-2 px-3 rounded text-xs font-bold shadow flex items-center gap-2"
                                                    title="Abaikan / Hapus"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-12 text-gray-400">
                                        Tidak ada permintaan reset password.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL FORM RESET --- */}
            <Modal show={isResetModalOpen} onClose={() => setIsResetModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Atur Password Baru
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Masukkan password baru untuk user <b>{selectedRequest?.name}</b>.
                    </p>
                    
                    <form onSubmit={submitReset}>
                        <div className="mb-4">
                            <InputLabel value="Password Baru" />
                            <TextInput 
                                type="text" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="Contoh: Bank123"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <SecondaryButton onClick={() => setIsResetModalOpen(false)}>Batal</SecondaryButton>
                            <PrimaryButton className="bg-orange-500 hover:bg-orange-600">Simpan Password</PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </SidebarLayout>
    );
}
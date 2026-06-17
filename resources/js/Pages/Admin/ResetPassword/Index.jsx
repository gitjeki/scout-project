import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { FaKey, FaClock, FaCheckCircle, FaExclamationCircle, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton'; 

export default function ResetPasswordIndex({ requests }) {
    const { flash } = usePage().props || {}; 
    const safeRequests = Array.isArray(requests) ? requests : [];

    // --- STATE MODAL RESET PASSWORD ---
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    // --- BARU: STATE MODAL DELETE ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // 1. Logic Reset Password
    const openResetModal = (req) => {
        setSelectedRequest(req);
        setNewPassword('Bank12345'); 
        setIsResetModalOpen(true);
    };

    const submitReset = (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters');
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

    // 2. BARU: Logic Delete (Buka Modal)
    const openDeleteModal = (id) => {
        setDeleteId(id);
        setIsDeleteModalOpen(true);
    }

    // 3. BARU: Eksekusi Hapus setelah Konfirmasi
    const confirmDelete = () => {
        router.delete(route('admin.reset.destroy', deleteId), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setDeleteId(null);
            }
        });
    }

    return (
        <SidebarLayout header="Password Reset Request">
            <Head title="Reset Password" />

            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                
                {/* Notifikasi Flash Message */}
                {flash?.message && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r shadow-sm flex items-start gap-3">
                        <FaCheckCircle className="text-green-500 mt-1" />
                        <div><p className="font-bold text-green-800">Succeed!</p><p className="text-sm text-green-700">{flash.message}</p></div>
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start gap-3">
                        <FaExclamationCircle className="text-red-500 mt-1" />
                        <div><p className="font-bold text-red-800">Failed!</p><p className="text-sm text-red-700">{flash.error}</p></div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-yellow-50 text-gray-700 uppercase text-sm leading-normal border-b border-yellow-100">
                                <th className="py-3 px-6 text-left">Applicant User</th>
                                <th className="py-3 px-6 text-left">Email</th>
                                <th className="py-3 px-6 text-left">Time</th>
                                <th className="py-3 px-6 text-center">Action</th>
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
                                                    <FaKey /> Set Password
                                                </button>
                                                <button 
                                                    // UPDATE: Panggil openDeleteModal, bukan handleDelete lama
                                                    onClick={() => openDeleteModal(req.id)}
                                                    className="bg-red-100 hover:bg-red-200 text-red-600 py-2 px-3 rounded text-xs font-bold shadow flex items-center gap-2"
                                                    title="Ignore / Delete"
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
                                    There is no password reset request.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL 1: FORM RESET PASSWORD --- */}
            <Modal show={isResetModalOpen} onClose={() => setIsResetModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Set New Password
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Enter a new password for the user <b>{selectedRequest?.name}</b>.
                    </p>
                    
                    <form onSubmit={submitReset}>
                        <div className="mb-4">
                            <InputLabel value="New Password" />
                            <TextInput 
                                type="text" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="Example: Bank123"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <SecondaryButton onClick={() => setIsResetModalOpen(false)}>Cancel</SecondaryButton>
                            <PrimaryButton className="bg-orange-500 hover:bg-orange-600">Save Password</PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* --- MODAL 2: KONFIRMASI DELETE (Pop-up Baru) --- */}
            <Modal show={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <div className="p-6 text-center">
                    <div className="flex justify-center mb-4 text-red-500">
                        <FaExclamationTriangle size={48} />
                    </div>
                    
                    <h2 className="text-lg font-bold text-gray-900 mb-2">
                        Ignore this Request?
                    </h2>
                    
                    <p className="text-gray-500 mb-6">
                        Are you sure you want to remove this request? <br/>
                        The request data will be permanently deleted.
                    </p>

                    <div className="flex justify-center gap-3">
                        <SecondaryButton onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </SecondaryButton>
                        <DangerButton onClick={confirmDelete}>
                            Yes, Delete It
                        </DangerButton>
                    </div>
                </div>
            </Modal>

        </SidebarLayout>
    );
}
import { useState } from 'react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, useForm, router, Link, usePage } from '@inertiajs/react';
// PERBAIKAN: Tambahkan FaExclamationTriangle untuk ikon warning di modal konfirmasi
import { FaTrash, FaUserPlus, FaUndo, FaCheckCircle, FaExclamationCircle, FaExclamationTriangle } from 'react-icons/fa';

import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton'; // Pastikan komponen ini ada, atau ganti dengan button biasa class red

export default function UserIndex({ users, filters = {} }) {
    const { flash } = usePage().props;

    // --- STATE MODAL TAMBAH USER ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // --- BARU: STATE MODAL KONFIRMASI (Untuk Delete/Restore/Role) ---
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: '',       // 'archive', 'restore', 'role'
        data: null,     // data user yang dipilih
        title: '',      // Judul Modal
        message: '',    // Pesan Modal
        action: null    // Fungsi yang akan dijalankan
    });

    const isArchivedView = filters.status === 'archived';

    // --- FORM TAMBAH USER ---
    const { 
        data: dataAdd, 
        setData: setDataAdd, 
        post: postAdd, 
        processing: processingAdd, 
        errors: errorsAdd, 
        reset: resetAdd 
    } = useForm({
        name: '', username: '', email: '', password: '', password_confirmation: '',
    });

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsModalOpen(false);
        resetAdd();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        postAdd(route('users.store'), {
            onSuccess: () => closeModal(),
        });
    };

    // --- FORM DELETE (Helper untuk Inertia) ---
    const { delete: destroy } = useForm();

    // --- BARU: LOGIKA MEMBUKA POP-UP KONFIRMASI ---
    
    // 1. Pop-up Archive/Delete
    const openArchiveConfirm = (user) => {
        setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: 'Archive Account',
            message: `Are you sure you want to archive '${user.name}'? User will not be able to log in again.`,
            action: () => {
                destroy(route('users.destroy', user.id), {
                    onFinish: () => closeConfirmModal()
                });
            }
        });
    };

    // 2. Pop-up Restore
    const openRestoreConfirm = (user) => {
        setConfirmModal({
            isOpen: true,
            type: 'success',
            title: 'Restore Account',
            message: `Recover account '${user.name}'? They will be able to log back in.`,
            action: () => {
                router.put(route('users.restore', user.id), {}, {
                    onFinish: () => closeConfirmModal()
                });
            }
        });
    };

    // 3. Pop-up Change Role
    const openRoleConfirm = (user, newRole) => {
        setConfirmModal({
            isOpen: true,
            type: 'warning',
            title: 'Change User Role',
            message: `Are you sure you want to change role for '${user.name}' to '${newRole}'?`,
            action: () => {
                router.put(route('users.update', user.id), { role: newRole }, {
                    onFinish: () => closeConfirmModal()
                });
            }
        });
    };

    const closeConfirmModal = () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    return (
        <SidebarLayout header="User Management">
            <Head title="Manage Users" />

            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                
                {/* NOTIFIKASI SUKSES / ERROR (Banner Atas) */}
                {flash.message && (
                    <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center gap-2 animate-pulse">
                        <FaCheckCircle /> <span>{flash.message}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2 animate-pulse">
                        <FaExclamationCircle /> <span className="font-bold">{flash.error}</span>
                    </div>
                )}

                {/* HEADER & TAB NAVIGASI */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <Link href={route('users.index')} className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${!isArchivedView ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Active Account
                        </Link>
                        <Link href={route('users.index', { status: 'archived' })} className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${isArchivedView ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span> Archive (Deleted)
                        </Link>
                    </div>

                    {!isArchivedView && (
                        <button onClick={openModal} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded flex items-center gap-2 font-semibold transition shadow-sm">
                            <FaUserPlus /> Add Account
                        </button>
                    )}
                </div>

                {/* TABEL USER */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-orange-50 text-gray-700 uppercase text-sm leading-normal border-b border-orange-100">
                                <th className="py-3 px-6 text-left">Name</th>
                                <th className="py-3 px-6 text-left">Username</th>
                                <th className="py-3 px-6 text-left">Email</th>
                                <th className="py-3 px-6 text-center">Status / Role</th>
                                <th className="py-3 px-6 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="py-3 px-6 text-left whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="mr-3">
                                                <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm border border-orange-200">
                                                    {user.name.charAt(0)}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="font-medium block text-gray-800">{user.name}</span>
                                                {isArchivedView && <span className="text-xs text-red-500 italic">Non-aktif</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-6 text-left font-mono text-xs">{user.username}</td>
                                    <td className="py-3 px-6 text-left">{user.email}</td>

                                    {/* Kolom Role / Status */}
                                    <td className="py-3 px-6 text-center">
                                        {isArchivedView ? (
                                            <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-300">Deleted</span>
                                        ) : (
                                            <select 
                                                value={user.role}
                                                // PERBAIKAN: Gunakan Pop-up custom
                                                onChange={(e) => openRoleConfirm(user, e.target.value)} 
                                                className={`py-1 px-4 rounded-full text-xs font-bold border-none cursor-pointer focus:ring-2 focus:ring-orange-300 shadow-sm ${
                                                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                                }`}
                                            >
                                                <option value="sales">Sales</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        )}
                                    </td>

                                    {/* Kolom Aksi */}
                                    <td className="py-3 px-6 text-center">
                                        <div className="flex item-center justify-center gap-2">
                                            {isArchivedView ? (
                                                <button 
                                                    // PERBAIKAN: Gunakan Pop-up custom
                                                    onClick={() => openRestoreConfirm(user)} 
                                                    className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition shadow-sm" title="Recover Account"
                                                >
                                                    <FaUndo size={14} />
                                                </button>
                                            ) : (
                                                <button 
                                                    // PERBAIKAN: Gunakan Pop-up custom
                                                    onClick={() => openArchiveConfirm(user)}
                                                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition shadow-sm" title="Archive Account"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Empty State ... (Kode sama) */}
                    {users.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-gray-500">No data available.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL 1: TAMBAH USER (Form) --- */}
            <Modal show={isModalOpen} onClose={closeModal}>
               {/* ... (Isi Form Sama seperti sebelumnya) ... */}
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Add New Sales Account</h2>
                    <form onSubmit={handleSubmit}>
                         <div className="mb-4">
                            <InputLabel value="Full Name" />
                            <TextInput value={dataAdd.name} onChange={(e) => setDataAdd('name', e.target.value)} className="mt-1 block w-full" placeholder="Example: Budi Santoso"/>
                            <InputError message={errorsAdd.name} className="mt-2" />
                        </div>
                        <div className="mb-4">
                            <InputLabel value="Username" />
                            <TextInput value={dataAdd.username} onChange={(e) => setDataAdd('username', e.target.value)} className="mt-1 block w-full bg-gray-50" placeholder="Example: budi_sales"/>
                            <InputError message={errorsAdd.username} className="mt-2" />
                        </div>
                        <div className="mb-4">
                            <InputLabel value="Email" />
                            <TextInput type="email" value={dataAdd.email} onChange={(e) => setDataAdd('email', e.target.value)} className="mt-1 block w-full" placeholder="email@bank.com"/>
                            <InputError message={errorsAdd.email} className="mt-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <InputLabel value="Password" />
                                <TextInput type="password" value={dataAdd.password} onChange={(e) => setDataAdd('password', e.target.value)} className="mt-1 block w-full"/>
                                <InputError message={errorsAdd.password} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel value="Confirm Password" />
                                <TextInput type="password" value={dataAdd.password_confirmation} onChange={(e) => setDataAdd('password_confirmation', e.target.value)} className="mt-1 block w-full"/>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2 border-t">
                            <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                            <PrimaryButton disabled={processingAdd} className="bg-orange-500 hover:bg-orange-600">Save Account</PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* --- MODAL 2: KONFIRMASI ACTION (Pop-up Baru) --- */}
            <Modal show={confirmModal.isOpen} onClose={closeConfirmModal}>
                <div className="p-6">
                    <div className="flex items-center justify-center mb-4 text-orange-500">
                        {/* Ikon besar di tengah */}
                        <FaExclamationTriangle size={40} />
                    </div>
                    
                    <h2 className="text-lg font-bold text-center text-gray-900 mb-2">
                        {confirmModal.title}
                    </h2>
                    
                    <p className="text-center text-gray-600 mb-6">
                        {confirmModal.message}
                    </p>

                    <div className="flex justify-center gap-3">
                        <SecondaryButton onClick={closeConfirmModal}>
                            Cancel
                        </SecondaryButton>
                        
                        {/* Tombol Merah untuk Delete, Hijau/Biru untuk lainnya */}
                        {confirmModal.type === 'danger' ? (
                            <DangerButton onClick={confirmModal.action}>
                                Yes, Archive It
                            </DangerButton>
                        ) : (
                            <PrimaryButton onClick={confirmModal.action} className={confirmModal.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}>
                                Yes, Confirm
                            </PrimaryButton>
                        )}
                    </div>
                </div>
            </Modal>

        </SidebarLayout>
    );
}
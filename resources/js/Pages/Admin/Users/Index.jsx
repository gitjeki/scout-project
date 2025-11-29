import { useState } from 'react';
import SidebarLayout from '@/Layouts/SidebarLayout';
// PERBAIKAN 1: Tambahkan 'usePage' di sini
import { Head, useForm, router, Link, usePage } from '@inertiajs/react';
// PERBAIKAN 2: Tambahkan ikon alert (FaCheckCircle, FaExclamationCircle)
import { FaTrash, FaUserPlus, FaArchive, FaUndo, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function UserIndex({ users, filters = {} }) {
    // --- 1. AMBIL FLASH MESSAGE DARI BACKEND ---
    const { flash } = usePage().props;

    // --- 2. SETUP STATE & FILTER ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Cek apakah kita sedang di tab "Arsip"?
    const isArchivedView = filters.status === 'archived';

    // --- 3. FORM TAMBAH USER ---
    const { 
        data: dataAdd, 
        setData: setDataAdd, 
        post: postAdd, 
        processing: processingAdd, 
        errors: errorsAdd, 
        reset: resetAdd 
    } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    // Helper Modal
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

    // --- 4. LOGIKA AKSI (ARSIP, RESTORE, GANTI ROLE) ---
    const { delete: destroy } = useForm();

    const handleArchive = (id, name) => {
        if (confirm(`Apakah Anda yakin ingin mengarsipkan akun '${name}'? \nUser tidak akan bisa login lagi.`)) {
            destroy(route('users.destroy', id));
        }
    };

    const handleRestore = (id, name) => {
        if (confirm(`Pulihkan akun '${name}'? User akan bisa login kembali.`)) {
            router.put(route('users.restore', id));
        }
    };

    const handleRoleChange = (id, name, newRole) => {
        if(confirm(`Ubah role ${name} menjadi ${newRole}?`)) {
            router.put(route('users.update', id), { 
                role: newRole 
            });
        }
    };

    return (
        <SidebarLayout header="Pengelolaan Akun">
            <Head title="Kelola User" />

            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                
                {/* --- PERBAIKAN 3: BAGIAN NOTIFIKASI ERROR / SUKSES --- */}
                {flash.message && (
                    <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center gap-2 animate-pulse">
                        <FaCheckCircle /> 
                        <span>{flash.message}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2 animate-pulse">
                        <FaExclamationCircle /> 
                        <span className="font-bold">{flash.error}</span>
                    </div>
                )}
                {/* ----------------------------------------------------- */}
                
                {/* --- HEADER & TAB NAVIGASI --- */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    {/* Tab Switcher */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <Link 
                            href={route('users.index')} 
                            className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${
                                !isArchivedView 
                                ? 'bg-white shadow text-orange-600' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Akun Aktif
                        </Link>
                        <Link 
                            href={route('users.index', { status: 'archived' })} 
                            className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${
                                isArchivedView 
                                ? 'bg-white shadow text-orange-600' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                            Arsip (Terhapus)
                        </Link>
                    </div>

                    {/* Tombol Tambah (Hanya muncul di Tab Aktif) */}
                    {!isArchivedView && (
                        <button 
                            onClick={openModal} 
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded flex items-center gap-2 font-semibold transition shadow-sm"
                        >
                            <FaUserPlus /> Tambah Akun
                        </button>
                    )}
                </div>

                {/* --- TABEL USER --- */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-orange-50 text-gray-700 uppercase text-sm leading-normal border-b border-orange-100">
                                <th className="py-3 px-6 text-left">Nama</th>
                                <th className="py-3 px-6 text-left">Username</th>
                                <th className="py-3 px-6 text-left">Email</th>
                                <th className="py-3 px-6 text-center">Status / Role</th>
                                <th className="py-3 px-6 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    {/* Kolom Nama & Avatar */}
                                    <td className="py-3 px-6 text-left whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="mr-3">
                                                {user.profile_photo ? (
                                                    <img className="w-9 h-9 rounded-full object-cover border border-gray-200" src={`/storage/${user.profile_photo}`} alt="Avatar" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm border border-orange-200">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                )}
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
                                            <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-300">
                                                Terhapus
                                            </span>
                                        ) : (
                                            <select 
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, user.name, e.target.value)}
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
                                                    onClick={() => handleRestore(user.id, user.name)}
                                                    className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition shadow-sm"
                                                    title="Pulihkan Akun"
                                                >
                                                    <FaUndo size={14} />
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleArchive(user.id, user.name)}
                                                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition shadow-sm"
                                                    title="Arsipkan Akun"
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

                    {/* Empty State */}
                    {users.length === 0 && (
                        <div className="text-center py-10">
                            <div className="text-gray-400 text-4xl mb-3 flex justify-center">
                                {isArchivedView ? <FaTrash /> : <FaUserPlus />}
                            </div>
                            <p className="text-gray-500 text-lg">
                                {isArchivedView ? 'Tidak ada akun yang diarsipkan.' : 'Belum ada akun sales.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL TAMBAH USER --- */}
            <Modal show={isModalOpen} onClose={closeModal}>
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                        Tambah Akun Sales Baru
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <InputLabel value="Nama Lengkap" />
                            <TextInput 
                                value={dataAdd.name}
                                onChange={(e) => setDataAdd('name', e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="Contoh: Budi Santoso"
                            />
                            <InputError message={errorsAdd.name} className="mt-2" />
                        </div>
                        <div className="mb-4">
                            <InputLabel value="Username" />
                            <TextInput 
                                value={dataAdd.username}
                                onChange={(e) => setDataAdd('username', e.target.value)}
                                className="mt-1 block w-full bg-gray-50"
                                placeholder="Contoh: budi_sales"
                            />
                            <InputError message={errorsAdd.username} className="mt-2" />
                        </div>
                        <div className="mb-4">
                            <InputLabel value="Email" />
                            <TextInput 
                                type="email"
                                value={dataAdd.email}
                                onChange={(e) => setDataAdd('email', e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="email@bank.com"
                            />
                            <InputError message={errorsAdd.email} className="mt-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <InputLabel value="Password" />
                                <TextInput 
                                    type="password"
                                    value={dataAdd.password}
                                    onChange={(e) => setDataAdd('password', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={errorsAdd.password} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel value="Konfirmasi Password" />
                                <TextInput 
                                    type="password"
                                    value={dataAdd.password_confirmation}
                                    onChange={(e) => setDataAdd('password_confirmation', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-2 border-t">
                            <SecondaryButton onClick={closeModal}>Batal</SecondaryButton>
                            <PrimaryButton disabled={processingAdd} className="bg-orange-500 hover:bg-orange-600">
                                Simpan Akun
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </SidebarLayout>
    );
}
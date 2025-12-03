import React, { useState, useEffect, useRef } from 'react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { 
    FaSave, FaEdit, FaTimes, FaCheckCircle, FaExclamationCircle, 
    FaUser, FaPhone, FaStopCircle, FaPlayCircle,
    FaSort, FaSortUp, FaSortDown, FaBell // TAMBAHAN: Icon untuk sorting & notifikasi
} from 'react-icons/fa';

// --- KOMPONEN MODAL TRACKING CALL ---
const CallTrackingModal = ({ isOpen, onClose, prospect, statusOptions }) => {
    if (!isOpen || !prospect) return null;

    const [duration, setDuration] = useState(0); // Detik
    const [isActive, setIsActive] = useState(true); // Timer jalan otomatis saat buka
    const [notes, setNotes] = useState(prospect.description || '');
    const [statusCode, setStatusCode] = useState(prospect.status_code || 'NEW');
    const timerRef = useRef(null);

    // Timer Logic
    useEffect(() => {
        if (isActive) {
            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive]);

    // Format Waktu (MM:SS)
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSave = () => {
        setIsActive(false); // Stop timer
        
        router.post(route('sales.activity.log'), {
            prospect_id: prospect.prospect_id,
            status_code: statusCode,
            contact_notes: notes,
            call_duration_sec: duration, // Isi otomatis kolom call_duration_sec
            contact_channel: 'Phone' // Default Phone
        }, {
            onSuccess: () => {
                onClose();
                setDuration(0);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-orange-200">
                {/* Header Call */}
                <div className="bg-orange-600 p-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-full animate-pulse">
                            <FaPhone size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Calling #{prospect.prospect_id}</h3>
                            <p className="text-orange-100 text-xs">
                                Job: {prospect.job || '-'} | Age: {prospect.age || '-'}
                            </p>
                        </div>
                    </div>
                    <div className="text-3xl font-mono font-bold tracking-widest">
                        {formatTime(duration)}
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Status Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                        <select 
                            value={statusCode} 
                            onChange={(e) => setStatusCode(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        >
                            {statusOptions.map(opt => (
                                <option key={opt.code} value={opt.code}>{opt.code} - {opt.desc}</option>
                            ))}
                        </select>
                    </div>

                    {/* Notes Area */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Percakapan (Notes)</label>
                        <textarea 
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 h-32"
                            placeholder="Tulis hasil pembicaraan disini..."
                        ></textarea>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                         <button 
                            onClick={() => setIsActive(!isActive)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${isActive ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        >
                            {isActive ? <><FaStopCircle size={16}/> Pause Timer</> : <><FaPlayCircle size={16}/> Resume Timer</>}
                        </button>
                        
                        <div className="flex gap-2">
                            <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-lg transform active:scale-95 transition">
                                Selesai & Simpan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ROW COMPONENT ---
const SalesRow = ({ item, statusOptions, onCallClick }) => {
    return (
        <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100 group">
            {/* ACTION COLUMN */}
            <td className="px-4 py-3 text-center sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200 w-24">
                <div className="flex justify-center items-center gap-2">
                    {/* TOMBOL TRACKING UTAMA */}
                    <button 
                        onClick={() => onCallClick(item)}
                        className="bg-orange-100 text-orange-600 p-2 rounded-full hover:bg-orange-600 hover:text-white transition shadow-sm"
                        title="Mulai Telepon & Tracking"
                    >
                        <FaPhone size={14} />
                    </button>
                </div>
            </td>

            <td className="px-4 py-3 text-gray-500 text-xs font-mono">#{item.prospect_id}</td>

            {/* STATUS BADGE - Menggunakan Class Global */}
            <td className="px-4 py-3">
                <span className={`status-badge status-${item.status_code.toLowerCase()}`}>
                    {item.status_code}
                </span>
            </td>

            {/* DESKRIPSI (READ ONLY DISINI, EDIT DI MODAL) */}
            <td className="px-4 py-3">
                <div className="text-xs text-gray-600 max-w-[200px] truncate">
                    {item.description || <span className="text-gray-300 italic">-</span>}
                </div>
            </td>

            <td className="px-4 py-3">
                {item.priority === 1 && <span className="text-white bg-red-500 px-2 py-0.5 rounded text-[10px] font-bold">HIGH</span>}
                {item.priority === 2 && <span className="text-white bg-yellow-500 px-2 py-0.5 rounded text-[10px] font-bold">MED</span>}
                {item.priority === 3 && <span className="text-white bg-gray-400 px-2 py-0.5 rounded text-[10px] font-bold">LOW</span>}
            </td>
            <td className="px-4 py-3 font-bold text-blue-600">
                {item.score ? (item.score * 100).toFixed(0) + '%' : '-'}
            </td>

            <td className="px-4 py-3 text-gray-700">{item.age || '-'}</td>
            
            {/* FIX: Handle null pada Job */}
            <td className="px-4 py-3 text-gray-700 capitalize">
                {item.job ? item.job.replace('.', '') : <span className="text-gray-300">-</span>}
            </td>
            
            {/* FIX: Handle null pada Education */}
            <td className="px-4 py-3 text-gray-700 capitalize">
                {item.education ? item.education.replace(/_/g, ' ') : <span className="text-gray-300">-</span>}
            </td>
            
            <td className="px-4 py-3 text-gray-700 uppercase">{item.month || '-'}</td>
            <td className="px-4 py-3 text-gray-700">{item.duration}s</td>
            <td className="px-4 py-3 text-gray-700">{item.campaign || '-'}</td>
            <td className="px-4 py-3 text-gray-700">{item.poutcome || '-'}</td>
            
            {/* Kolom Baru: Telemarketer */}
            <td className="px-4 py-3 text-gray-600 text-xs">
                {item.telemarketer_name !== '-' ? (
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-medium">
                        {item.telemarketer_name}
                    </span>
                ) : (
                    <span className="text-gray-300">-</span>
                )}
            </td>
            
            {/* Kolom Baru: Contact Channel */}
            <td className="px-4 py-3 text-gray-600 text-xs">
                {item.contact_channel !== '-' ? (
                    <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-[10px] font-medium">
                        {item.contact_channel}
                    </span>
                ) : (
                    <span className="text-gray-300">-</span>
                )}
            </td>
            
            {/* Kolom Baru: Call Duration (Detik) */}
            <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                {item.call_duration_sec > 0 ? (
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-bold">
                        {item.call_duration_sec}s
                    </span>
                ) : (
                    <span className="text-gray-300">-</span>
                )}
            </td>
        </tr>
    );
};

// --- MAIN PAGE COMPONENT ---
// --- 1. LOGIKA SORTING (SOLUSI BUG MUTER-MUTER) ---
// --- 2. LOGIKA NOTIFIKASI MANUAL (SIMULASI) ---
export default function Prospects({ prospects, statusOptions, filters = {} }) {
    const { flash } = usePage().props;
    const [selectedProspect, setSelectedProspect] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- FITUR BARU: SORTING STATE ---
    // Ambil default dari props filters (dikirim dari Controller)
    const [sortField, setSortField] = useState(filters.sort_field || 'created_at');
    const [sortDirection, setSortDirection] = useState(filters.sort_direction || 'desc');

    // Zoom level fix
    useEffect(() => {
        document.body.style.zoom = "67%";
        return () => { document.body.style.zoom = "100%"; };
    }, []);

    // --- FITUR BARU: HANDLE SORTING ---
    const handleSort = (field) => {
        const newDirection = (field === sortField && sortDirection === 'asc') ? 'desc' : 'asc';
        
        setSortField(field);
        setSortDirection(newDirection);

        // Panggil Router GET agar server mengurutkan data
        router.get(route('sales.prospects.index'), {
            sort_field: field,
            sort_direction: newDirection
        }, { 
            preserveState: true, // Jangan refresh halaman total
            preserveScroll: true // Jangan scroll ke atas
        });
    };

    // --- FITUR BARU: RENDER SORT ICON ---
    // Helper icon sorting
    const renderSortIcon = (field) => {
        if (sortField !== field) return <FaSort className="text-gray-300 ml-1 inline" size={10} />;
        return sortDirection === 'asc' 
            ? <FaSortUp className="text-blue-600 ml-1 inline" size={10} /> 
            : <FaSortDown className="text-blue-600 ml-1 inline" size={10} />;
    };

    // --- FITUR BARU: NOTIFIKASI NEW LEADS ---
    // Hitung berapa data yang statusnya 'NEW' (belum disentuh)
    const newLeadsCount = prospects.data.filter(p => p.status_code === 'NEW').length;

    const handleCallClick = (prospect) => {
        setSelectedProspect(prospect);
        setIsModalOpen(true);
    };

    return (
        <SidebarLayout header="Sales Workspace">
            <Head title="Daftar Prospek" />
            
            {/* Modal Tracking */}
            <CallTrackingModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                prospect={selectedProspect}
                statusOptions={statusOptions}
            />

            {/* Flash Messages */}
            {flash.success && (
                <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center gap-2 text-sm animate-fade-in-down">
                    <FaCheckCircle size={16} /> {flash.success}
                </div>
            )}
            {flash.error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2 text-sm animate-fade-in-down">
                    <FaExclamationCircle size={16} /> {flash.error}
                </div>
            )}

            {/* --- FITUR BARU: NOTIFIKASI AREA --- */}
            {newLeadsCount > 0 && (
                <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <FaBell className="animate-pulse" />
                        </div>
                        <div>
                            <p className="font-bold text-blue-800">Anda memiliki {newLeadsCount} Prospek Baru!</p>
                            <p className="text-xs text-blue-600">Admin telah menugaskan data baru untuk Anda hubungi hari ini.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleSort('created_at')} 
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                    >
                        Lihat Data Baru
                    </button>
                </div>
            )}

            <div className="bg-white shadow-sm sm:rounded-xl border border-gray-200 overflow-hidden mt-4">
                <div className="p-4 border-b border-gray-200 bg-orange-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <FaUser className="text-orange-600" size={20}/> Daftar Prospek
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Klik tombol <span className="font-bold text-orange-600"><FaPhone size={10} className="inline"/> Telepon</span> untuk mulai tracking durasi & update status.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="min-w-full whitespace-nowrap text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold tracking-wider border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-center sticky left-0 bg-gray-100 z-10 border-r border-gray-200 w-24">Call</th>
                                <th className="px-4 py-3">Prospect_ID</th>
                                
                                {/* --- FITUR BARU: SORTABLE COLUMNS --- */}
                                <th 
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition select-none"
                                    onClick={() => handleSort('status_code')}
                                    title="Klik untuk mengurutkan"
                                >
                                    Status {renderSortIcon('status_code')}
                                </th>
                                
                                <th className="px-4 py-3 max-w-xs">Deskripsi</th>
                                <th className="px-4 py-3">Prio</th>
                                
                                <th 
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition select-none"
                                    onClick={() => handleSort('score')}
                                    title="Klik untuk mengurutkan"
                                >
                                    Score {renderSortIcon('score')}
                                </th>
                                
                                <th className="px-4 py-3">Age</th>
                                <th className="px-4 py-3">Job</th>
                                <th className="px-4 py-3">Education</th>
                                <th className="px-4 py-3">Month</th>
                                <th className="px-4 py-3">Dur (Prev)</th>
                                <th className="px-4 py-3">Camp</th>
                                <th className="px-4 py-3">P.Out</th>
                                <th className="px-4 py-3">Telemarketer_ID</th>
                                <th className="px-4 py-3">Channel</th>
                                <th className="px-4 py-3">Call Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {prospects.data.length > 0 ? (
                                prospects.data.map((item) => (
                                    <SalesRow 
                                        key={item.prospect_id} 
                                        item={item} 
                                        statusOptions={statusOptions}
                                        onCallClick={handleCallClick}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="16" className="px-6 py-10 text-center text-gray-500 italic">
                                        Belum ada data prospek.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-1 justify-end">
                    {prospects.links.map((link, key) => (
                        <Link
                            key={key}
                            href={link.url || '#'}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`px-3 py-1 text-xs border rounded transition ${
                                link.active
                                    ? 'bg-orange-600 text-white border-orange-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                    ))}
                </div>
            </div>
        </SidebarLayout>
    );
}
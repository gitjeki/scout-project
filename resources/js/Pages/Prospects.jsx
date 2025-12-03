import React, { useState, useEffect, useRef } from 'react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { 
    FaSave, FaEdit, FaTimes, FaCheckCircle, FaExclamationCircle, 
    FaUser, FaPhone, FaStopCircle, FaPlayCircle,
    FaSort, FaSortUp, FaSortDown, FaBell,
    FaFilter, FaSearch, FaUndo, FaTag // Icon Tambahan
} from 'react-icons/fa';

// --- KOMPONEN MODAL TRACKING CALL (SAMA SEPERTI SEBELUMNYA) ---
const CallTrackingModal = ({ isOpen, onClose, prospect, statusOptions }) => {
    if (!isOpen || !prospect) return null;

    const [duration, setDuration] = useState(0); 
    const [isActive, setIsActive] = useState(true); 
    const [notes, setNotes] = useState(prospect.description || '');
    const [statusCode, setStatusCode] = useState(prospect.status_code || 'NEW');
    const timerRef = useRef(null);

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

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSave = () => {
        setIsActive(false); 
        router.post(route('sales.activity.log'), {
            prospect_id: prospect.prospect_id,
            status_code: statusCode,
            contact_notes: notes,
            call_duration_sec: duration, 
            contact_channel: 'Phone'
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
                <div className="bg-orange-600 p-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-full animate-pulse"><FaPhone size={20} /></div>
                        <div>
                            <h3 className="font-bold text-lg">Calling #{prospect.prospect_id}</h3>
                            <p className="text-orange-100 text-xs">Job: {prospect.job || '-'} | Age: {prospect.age || '-'}</p>
                        </div>
                    </div>
                    <div className="text-3xl font-mono font-bold tracking-widest">{formatTime(duration)}</div>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                        <select value={statusCode} onChange={(e) => setStatusCode(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500">
                            {statusOptions.map(opt => (
                                <option key={opt.code} value={opt.code}>{opt.code} - {opt.desc}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Percakapan (Notes)</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 h-32" placeholder="Tulis hasil pembicaraan disini..."></textarea>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                         <button onClick={() => setIsActive(!isActive)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${isActive ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                            {isActive ? <><FaStopCircle size={16}/> Pause Timer</> : <><FaPlayCircle size={16}/> Resume Timer</>}
                        </button>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-lg transform active:scale-95 transition">Selesai & Simpan</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ROW COMPONENT (SAMA SEPERTI SEBELUMNYA) ---
const SalesRow = ({ item, statusOptions, onCallClick }) => {
    return (
        <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100 group">
            <td className="px-4 py-3 text-center sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200 w-24">
                <div className="flex justify-center items-center gap-2">
                    <button onClick={() => onCallClick(item)} className="bg-orange-100 text-orange-600 p-2 rounded-full hover:bg-orange-600 hover:text-white transition shadow-sm" title="Mulai Telepon & Tracking">
                        <FaPhone size={14} />
                    </button>
                </div>
            </td>
            <td className="px-4 py-3 text-gray-500 text-xs font-mono">#{item.prospect_id}</td>
            <td className="px-4 py-3"><span className={`status-badge status-${item.status_code.toLowerCase()}`}>{item.status_code}</span></td>
            <td className="px-4 py-3"><div className="text-xs text-gray-600 max-w-[200px] truncate">{item.description || <span className="text-gray-300 italic">-</span>}</div></td>
            <td className="px-4 py-3">
                {item.priority === 1 && <span className="text-white bg-red-500 px-2 py-0.5 rounded text-[10px] font-bold">HIGH</span>}
                {item.priority === 2 && <span className="text-white bg-yellow-500 px-2 py-0.5 rounded text-[10px] font-bold">MED</span>}
                {item.priority === 3 && <span className="text-white bg-gray-400 px-2 py-0.5 rounded text-[10px] font-bold">LOW</span>}
            </td>
            <td className="px-4 py-3 font-bold text-blue-600">{item.score ? (item.score * 100).toFixed(0) + '%' : '-'}</td>
            <td className="px-4 py-3 text-gray-700">{item.age || '-'}</td>
            <td className="px-4 py-3 text-gray-700 capitalize">{item.job ? item.job.replace('.', '') : <span className="text-gray-300">-</span>}</td>
            <td className="px-4 py-3 text-gray-700 capitalize">{item.education ? item.education.replace(/_/g, ' ') : <span className="text-gray-300">-</span>}</td>
            <td className="px-4 py-3 text-gray-700 uppercase">{item.month || '-'}</td>
            <td className="px-4 py-3 text-gray-700">{item.duration}s</td>
            <td className="px-4 py-3 text-gray-700">{item.campaign || '-'}</td>
            <td className="px-4 py-3 text-gray-700">{item.poutcome || '-'}</td>
            <td className="px-4 py-3 text-gray-600 text-xs">{item.telemarketer_name !== '-' ? <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-medium">{item.telemarketer_name}</span> : <span className="text-gray-300">-</span>}</td>
            <td className="px-4 py-3 text-gray-600 text-xs">{item.contact_channel !== '-' ? <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-[10px] font-medium">{item.contact_channel}</span> : <span className="text-gray-300">-</span>}</td>
            <td className="px-4 py-3 text-gray-700 font-mono text-xs">{item.call_duration_sec > 0 ? <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-bold">{item.call_duration_sec}s</span> : <span className="text-gray-300">-</span>}</td>
        </tr>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function Prospects({ prospects, statusOptions, jobOptions = [], educationOptions = [], filters = {} }) {
    const { flash } = usePage().props;
    const [selectedProspect, setSelectedProspect] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- STATE FOR FILTER & SORT ---
    // Mengambil nilai awal dari props filters (agar tidak reset saat refresh/pagination)
    const [queryParams, setQueryParams] = useState({
        search: filters.search || '',
        filter_status: filters.filter_status || '',
        filter_priority: filters.filter_priority || '',
        filter_job: filters.filter_job || '',
        filter_education: filters.filter_education || '',
    });

    const [sortField, setSortField] = useState(filters.sort_field || 'created_at');
    const [sortDirection, setSortDirection] = useState(filters.sort_direction || 'desc');

    // Zoom level fix
    useEffect(() => {
        document.body.style.zoom = "67%";
        return () => { document.body.style.zoom = "100%"; };
    }, []);

    // --- HANDLER: INPUT CHANGE ---
    const handleFilterInput = (e) => {
        const { name, value } = e.target;
        setQueryParams(prev => ({ ...prev, [name]: value }));
    };

    // --- HANDLER: APPLY FILTER ---
    const applyFilters = () => {
        router.get(route('sales.prospects.index'), {
            ...queryParams,
            sort_field: sortField,
            sort_direction: sortDirection
        }, { 
            preserveState: true,
            preserveScroll: true 
        });
    };

    // --- HANDLER: RESET FILTER ---
    const resetFilters = () => {
        const emptyParams = {
            search: '',
            filter_status: '',
            filter_priority: '',
            filter_job: '',
            filter_education: '',
        };
        setQueryParams(emptyParams);
        
        router.get(route('sales.prospects.index'), {
            ...emptyParams,
            sort_field: sortField,
            sort_direction: sortDirection
        }, { preserveState: true });
    };

    // --- HANDLER: SORTING ---
    const handleSort = (field) => {
        const newDirection = (field === sortField && sortDirection === 'asc') ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);

        router.get(route('sales.prospects.index'), {
            ...queryParams, // Penting: Sertakan filter saat ini agar tidak ter-reset saat sorting
            sort_field: field,
            sort_direction: newDirection
        }, { 
            preserveState: true,
            preserveScroll: true 
        });
    };

    const renderSortIcon = (field) => {
        if (sortField !== field) return <FaSort className="text-gray-300 ml-1 inline" size={10} />;
        return sortDirection === 'asc' 
            ? <FaSortUp className="text-blue-600 ml-1 inline" size={10} /> 
            : <FaSortDown className="text-blue-600 ml-1 inline" size={10} />;
    };

    // --- NOTIFICATION LOGIC ---
    const newLeadsCount = prospects.data.filter(p => p.status_code === 'NEW').length;

    const handleCallClick = (prospect) => {
        setSelectedProspect(prospect);
        setIsModalOpen(true);
    };

    // Helper untuk cek apakah ada filter aktif
    const hasActiveFilters = Object.values(queryParams).some(val => val !== '');

    return (
        <SidebarLayout header="Sales Workspace">
            <Head title="Daftar Prospek" />
            
            <CallTrackingModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                prospect={selectedProspect}
                statusOptions={statusOptions}
            />

            {/* --- FILTER BAR SECTION --- */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3 text-gray-700 font-bold text-sm border-b pb-2">
                    <FaFilter className="text-orange-500" /> Filter Data Prospek
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                    {/* 1. Search Box */}
                    <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Pencarian (ID Prospek)</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                name="search"
                                value={queryParams.search}
                                onChange={handleFilterInput}
                                placeholder="Cari ID Prospek" 
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500"
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            />
                            <FaSearch className="absolute left-2.5 top-2.5 text-gray-400" size={12} />
                        </div>
                    </div>

                    {/* 2. Status Dropdown */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
                        <select 
                            name="filter_status" 
                            value={queryParams.filter_status} 
                            onChange={handleFilterInput}
                            className="w-full py-1.5 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 bg-white"
                        >
                            <option value="">Semua Status</option>
                            {statusOptions.map(opt => <option key={opt.code} value={opt.code}>{opt.code}</option>)}
                        </select>
                    </div>

                    {/* 3. Priority Dropdown */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Prioritas</label>
                        <select 
                            name="filter_priority" 
                            value={queryParams.filter_priority} 
                            onChange={handleFilterInput}
                            className="w-full py-1.5 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 bg-white"
                        >
                            <option value="">Semua</option>
                            <option value="1">High</option>
                            <option value="2">Medium</option>
                            <option value="3">Low</option>
                        </select>
                    </div>

                    {/* 4. Job Dropdown */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Pekerjaan</label>
                        <select 
                            name="filter_job" 
                            value={queryParams.filter_job} 
                            onChange={handleFilterInput}
                            className="w-full py-1.5 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 bg-white capitalize"
                        >
                            <option value="">Semua</option>
                            {jobOptions.map(job => <option key={job} value={job}>{job.replace('.', ' ')}</option>)}
                        </select>
                    </div>

                    {/* 5. Education Dropdown */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Pendidikan</label>
                        <select 
                            name="filter_education" 
                            value={queryParams.filter_education} 
                            onChange={handleFilterInput}
                            className="w-full py-1.5 text-sm border border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 bg-white capitalize"
                        >
                            <option value="">Semua</option>
                            {educationOptions.map(edu => <option key={edu} value={edu}>{edu.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>
                </div>

                {/* Buttons Area */}
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    <div className="flex gap-2">
                        {/* Active Filter Badges */}
                        {queryParams.filter_status && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1"><FaTag/> Status: {queryParams.filter_status}</span>}
                        {queryParams.filter_priority && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded flex items-center gap-1"><FaTag/> Prio: {queryParams.filter_priority}</span>}
                        {queryParams.search && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded flex items-center gap-1"><FaSearch size={8}/> "{queryParams.search}"</span>}
                    </div>

                    <div className="flex gap-2">
                        {hasActiveFilters && (
                            <button 
                                onClick={resetFilters}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-bold hover:bg-gray-200 transition flex items-center gap-1"
                            >
                                <FaUndo size={10} /> Reset Filter
                            </button>
                        )}
                        <button 
                            onClick={applyFilters}
                            className="px-4 py-1.5 bg-orange-600 text-white rounded text-xs font-bold hover:bg-orange-700 transition flex items-center gap-2 shadow-sm"
                        >
                            <FaFilter size={10} /> Terapkan Filter
                        </button>
                    </div>
                </div>
            </div>
            {/* --- END FILTER BAR --- */}

            {/* Flash Messages */}
            {flash.success && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center gap-2 text-sm animate-fade-in-down"><FaCheckCircle size={16} /> {flash.success}</div>}
            {flash.error && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2 text-sm animate-fade-in-down"><FaExclamationCircle size={16} /> {flash.error}</div>}

            {/* Notifikasi Area */}
            {newLeadsCount > 0 && (
                <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600"><FaBell className="animate-pulse" /></div>
                        <div>
                            <p className="font-bold text-blue-800">Anda memiliki {newLeadsCount} Prospek Baru!</p>
                            <p className="text-xs text-blue-600">Admin telah menugaskan data baru untuk Anda hubungi hari ini.</p>
                        </div>
                    </div>
                    <button onClick={() => {
                        // Reset filter lalu sort by created_at desc untuk lihat data baru
                        setQueryParams({ search: '', filter_status: 'NEW', filter_priority: '', filter_job: '', filter_education: '' });
                        router.get(route('sales.prospects.index'), { filter_status: 'NEW', sort_field: 'created_at', sort_direction: 'desc' });
                    }} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">Lihat Data Baru</button>
                </div>
            )}

            {/* Table Area */}
            <div className="bg-white shadow-sm sm:rounded-xl border border-gray-200 overflow-hidden mt-4">
                <div className="p-4 border-b border-gray-200 bg-orange-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FaUser className="text-orange-600" size={20}/> Daftar Prospek</h3>
                        <p className="text-xs text-gray-500 mt-1">Klik tombol <span className="font-bold text-orange-600"><FaPhone size={10} className="inline"/> Telepon</span> untuk mulai tracking durasi & update status.</p>
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="min-w-full whitespace-nowrap text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold tracking-wider border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-center sticky left-0 bg-gray-100 z-10 border-r border-gray-200 w-24">Call</th>
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition select-none" onClick={() => handleSort('status_code')} title="Klik untuk mengurutkan">Status {renderSortIcon('status_code')}</th>
                                <th className="px-4 py-3 max-w-xs">Deskripsi</th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition select-none" onClick={() => handleSort('priority')} title="Klik untuk mengurutkan">Prio {renderSortIcon('priority')}</th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition select-none" onClick={() => handleSort('score')} title="Klik untuk mengurutkan">Score {renderSortIcon('score')}</th>
                                <th className="px-4 py-3">Age</th>
                                <th className="px-4 py-3">Job</th>
                                <th className="px-4 py-3">Education</th>
                                <th className="px-4 py-3">Month</th>
                                <th className="px-4 py-3">Dur (Prev)</th>
                                <th className="px-4 py-3">Camp</th>
                                <th className="px-4 py-3">P.Out</th>
                                <th className="px-4 py-3">Telemarketer</th>
                                <th className="px-4 py-3">Channel</th>
                                <th className="px-4 py-3">Call Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {prospects.data.length > 0 ? (
                                prospects.data.map((item) => (
                                    <SalesRow key={item.prospect_id} item={item} statusOptions={statusOptions} onCallClick={handleCallClick} />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="16" className="px-6 py-10 text-center text-gray-500 italic flex flex-col items-center justify-center gap-2">
                                        <span className="text-2xl">📭</span>
                                        <span>Data tidak ditemukan dengan filter ini.</span>
                                        <button onClick={resetFilters} className="text-blue-600 hover:underline text-xs">Reset Filter</button>
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
                            className={`px-3 py-1 text-xs border rounded transition ${link.active ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                    ))}
                </div>
            </div>
        </SidebarLayout>
    );
}
// Prospects.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, usePage, router, Link, useForm } from '@inertiajs/react';
import { 
    FaSave, FaEdit, FaTimes, FaCheckCircle, FaExclamationCircle, 
    FaUser, FaPhone, FaStopCircle, FaPlayCircle,
    FaSort, FaSortUp, FaSortDown, FaBell,
    FaFire, FaCalendarCheck, FaClock 
} from 'react-icons/fa';

// --- KOMPONEN MODAL TRACKING CALL ---
const CallTrackingModal = ({ isOpen, onClose, prospect, statusOptions }) => {
    if (!isOpen || !prospect) return null;

    const [duration, setDuration] = useState(0); // Detik
    const [isActive, setIsActive] = useState(true); // Timer jalan otomatis saat buka
    const [notes, setNotes] = useState(prospect.description || '');
    const [statusCode, setStatusCode] = useState(prospect.status_code || 'NEW');
    const [channel, setChannel] = useState('Phone');
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
    
    // Reset timer saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            setDuration(0);
            setIsActive(true);
            setNotes(prospect.description || '');
            setStatusCode(prospect.status_code || 'NEW');
            setChannel('Phone');
        }
    }, [isOpen, prospect]);

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
            contact_channel: channel 
        }, {
            onSuccess: () => {
                onClose();
            },
            preserveScroll: true
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
                            <h3 className="font-bold text-lg">Tracking Prospek #{prospect.prospect_id}</h3>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Update Status *</label>
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

                    {/* Channel Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Channel *</label>
                        <select 
                            value={channel} 
                            onChange={(e) => setChannel(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        >
                            {['Phone', 'Email', 'WhatsApp', 'SMS'].map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
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
const SalesRow = ({ item, onCallClick }) => {
    return (
        <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100 group">
            {/* ACTION COLUMN */}
            <td className="px-4 py-3 text-center sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200 w-24">
                <div className="flex justify-center items-center gap-2">
                    {/* TOMBOL TRACKING UTAMA */}
                    <button 
                        onClick={() => onCallClick(item)}
                        className="bg-orange-100 text-orange-600 p-2 rounded-full hover:bg-orange-600 hover:text-white transition shadow-md"
                        title="Mulai Telepon & Tracking"
                    >
                        <FaPhone size={14} />
                    </button>
                </div>
            </td>

            <td className="px-4 py-3 text-gray-500 text-xs font-mono">#{item.prospect_id}</td>

            {/* STATUS BADGE */}
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
                {!item.priority && <span className="text-gray-300">-</span>}
            </td>
            <td className="px-4 py-3 font-bold text-blue-600">
                {item.score ? (item.score * 100).toFixed(0) + '%' : '-'}
            </td>

            <td className="px-4 py-3 text-gray-700">{item.age || '-'}</td>
            
            {/* Job */}
            <td className="px-4 py-3 text-gray-700 capitalize">
                {item.job ? item.job.replace('.', '') : <span className="text-gray-300">-</span>}
            </td>
            
            {/* Education */}
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
export default function Prospects({ prospects, statusOptions, jobOptions, educationOptions, filters = {}, personalStats }) {
    const { flash } = usePage().props;
    const [selectedProspect, setSelectedProspect] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter State menggunakan Inertia useForm
    const { data, setData, get, processing, reset } = useForm({
        search: filters.search || '',
        filter_status: filters.filter_status || '',
        filter_priority: filters.filter_priority || '',
        filter_job: filters.filter_job || '',
        filter_education: filters.filter_education || '',
        // Sorting disimpan di state lokal untuk kontrol visual
        sort_field: filters.sort_field || 'created_at',
        sort_direction: filters.sort_direction || 'desc',
    });

    // Zoom level fix (optional, untuk tampilan development)
    useEffect(() => {
        document.body.style.zoom = "67%";
        return () => { document.body.style.zoom = "100%"; };
    }, []);
    
    // Auto submit filter saat ada perubahan pada data filter (debounce yang disederhanakan)
    const handleFilterChange = useCallback((key, value) => {
        // Mengirim GET request ke controller 
        get(route('sales.prospects.index'), {
            ...data, 
            [key]: value, // Nilai yang baru diubah
            preserveState: true,
            preserveScroll: true
        });
        setData(key, value); // Update state setelah request
    }, [data, setData, get]); 

    // Handle Reset Filter
    const handleReset = () => {
        reset(); // Reset form state
        // Panggil GET request dengan parameter kosong
        router.get(route('sales.prospects.index'), {}, {
            preserveState: false,
            preserveScroll: true
        });
    };

    // --- HANDLE SORTING ---
    const handleSort = (field) => {
        const newDirection = (field === data.sort_field && data.sort_direction === 'asc') ? 'desc' : 'asc';
        
        // Panggil Router GET agar server mengurutkan data
        get(route('sales.prospects.index'), {
            ...data, // Kirim semua filter
            sort_field: field,
            sort_direction: newDirection
        }, { 
            preserveState: true, 
            preserveScroll: true 
        });

        // Update state setelah request dikirim
        setData({
            ...data,
            sort_field: field,
            sort_direction: newDirection
        });
    };

    // --- RENDER SORT ICON ---
    const renderSortIcon = (field) => {
        if (data.sort_field !== field) return <FaSort className="text-gray-300 ml-1 inline" size={10} />;
        return data.sort_direction === 'asc' 
            ? <FaSortUp className="text-blue-600 ml-1 inline" size={10} /> 
            : <FaSortDown className="text-blue-600 ml-1 inline" size={10} />;
    };

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
            
            {/* --- PERSONAL STATS CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Card 1: Hot Leads */}
                <StatsCard 
                    icon={FaFire}
                    color="red"
                    title="Target Prioritas (NEW)"
                    value={personalStats.hot_leads}
                    unit="Prospek"
                    description="Belum dihubungi & Prioritas Tinggi (1)"
                />
                {/* Card 2: Calls Today */}
                <StatsCard 
                    icon={FaCalendarCheck}
                    color="blue"
                    title="Aktivitas Hari Ini"
                    value={personalStats.calls_today}
                    unit="Panggilan"
                    description="Total panggilan yang berhasil dicatat"
                />
                {/* Card 3: Call Duration */}
                <StatsCard 
                    icon={FaClock}
                    color="green"
                    title="Durasi Bicara Hari Ini"
                    value={personalStats.duration_min}
                    unit="Menit"
                    description="Total waktu bicara yang tercatat"
                />
            </div>
            {/* ---------------------------------- */}
            
            <div className="bg-white shadow-sm sm:rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-orange-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <FaUser className="text-orange-600" size={20}/> Daftar Prospek
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Total: {prospects.total} data. Page {prospects.current_page} dari {prospects.last_page}.
                        </p>
                    </div>
                </div>

                {/* --- FILTER & SEARCH AREA --- */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-6 gap-3 items-end">
                        {/* Search by ID */}
                        <div>
                            <label htmlFor="search" className="block text-xs font-medium text-gray-600 mb-1">Cari ID Prospek</label>
                            <input
                                id="search"
                                type="text"
                                value={data.search}
                                onChange={(e) => setData('search', e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilterChange('search', data.search)}
                                onBlur={() => handleFilterChange('search', data.search)}
                                placeholder="ID..."
                                className="w-full text-sm border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        
                        {/* Filter Status */}
                        <div>
                            <label htmlFor="filter_status" className="block text-xs font-medium text-gray-600 mb-1">Filter Status</label>
                            <select
                                id="filter_status"
                                value={data.filter_status}
                                onChange={(e) => handleFilterChange('filter_status', e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="">Semua Status</option>
                                {statusOptions.map(opt => (
                                    <option key={opt.code} value={opt.code}>{opt.code}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Filter Priority */}
                        <div>
                            <label htmlFor="filter_priority" className="block text-xs font-medium text-gray-600 mb-1">Filter Prioritas</label>
                            <select
                                id="filter_priority"
                                value={data.filter_priority}
                                onChange={(e) => handleFilterChange('filter_priority', e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="">Semua Prioritas</option>
                                <option value="1">1 - High</option>
                                <option value="2">2 - Medium</option>
                                <option value="3">3 - Low</option>
                            </select>
                        </div>

                        {/* Filter Job */}
                        <div>
                            <label htmlFor="filter_job" className="block text-xs font-medium text-gray-600 mb-1">Filter Pekerjaan</label>
                            <select
                                id="filter_job"
                                value={data.filter_job}
                                onChange={(e) => handleFilterChange('filter_job', e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-md shadow-sm capitalize"
                            >
                                <option value="">Semua Pekerjaan</option>
                                {jobOptions.map(opt => (
                                    <option key={opt} value={opt} className="capitalize">{opt.replace('.', '')}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Education */}
                        <div>
                            <label htmlFor="filter_education" className="block text-xs font-medium text-gray-600 mb-1">Filter Edukasi</label>
                            <select
                                id="filter_education"
                                value={data.filter_education}
                                onChange={(e) => handleFilterChange('filter_education', e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-md shadow-sm capitalize"
                            >
                                <option value="">Semua Edukasi</option>
                                {educationOptions.map(opt => (
                                    <option key={opt} value={opt} className="capitalize">{opt.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Reset Button */}
                        <button
                            onClick={handleReset}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition shadow-sm"
                        >
                            Reset
                        </button>
                    </div>
                </div>
                {/* --- END FILTER AREA --- */}


                <div className="overflow-x-auto w-full">
                    <table className="min-w-full whitespace-nowrap text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold tracking-wider border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-center sticky left-0 bg-gray-100 z-10 border-r border-gray-200 w-24">Call</th>
                                <th 
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition select-none"
                                    onClick={() => handleSort('created_at')} 
                                >
                                    ID {renderSortIcon('created_at')}
                                </th>
                                
                                {/* --- SORTABLE COLUMNS --- */}
                                <th 
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition select-none"
                                    onClick={() => handleSort('status_code')}
                                    title="Klik untuk mengurutkan"
                                >
                                    Status {renderSortIcon('status_code')}
                                </th>
                                
                                <th className="px-4 py-3 max-w-xs">Deskripsi</th>
                                
                                <th 
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition select-none"
                                    onClick={() => handleSort('priority')}
                                    title="Klik untuk mengurutkan"
                                >
                                    Prio {renderSortIcon('priority')}
                                </th>
                                
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
                                <th className="px-4 py-3">Telemarketer</th>
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
                                        onCallClick={handleCallClick}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="16" className="px-6 py-10 text-center text-gray-500 italic">
                                        Belum ada data prospek yang sesuai dengan filter.
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

// --- HELPER COMPONENT: Stats Card ---
const StatsCard = ({ icon: Icon, color, title, value, unit, description }) => {
    let bgColor, textColor, iconColor;

    switch (color) {
        case 'red':
            bgColor = 'bg-red-50';
            textColor = 'text-red-700';
            iconColor = 'text-red-500';
            break;
        case 'blue':
            bgColor = 'bg-blue-50';
            textColor = 'text-blue-700';
            iconColor = 'text-blue-500';
            break;
        case 'green':
            bgColor = 'bg-green-50';
            textColor = 'text-green-700';
            iconColor = 'text-green-500';
            break;
        default:
            bgColor = 'bg-gray-50';
            textColor = 'text-gray-700';
            iconColor = 'text-gray-500';
    }

    return (
        <div className={`p-4 rounded-xl shadow-lg border border-gray-200 ${bgColor}`}>
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-600">{title}</p>
                <div className={`p-2 rounded-full ${iconColor} bg-white shadow`}>
                    <Icon size={16} />
                </div>
            </div>
            <div className="mt-3">
                <span className={`text-3xl font-extrabold ${textColor}`}>{value}</span>
                <span className="text-md ml-1 font-medium text-gray-500">{unit}</span>
            </div>
            <p className="text-xs mt-1 text-gray-500 truncate">{description}</p>
        </div>
    );
};
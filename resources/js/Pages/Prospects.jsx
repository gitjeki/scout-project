    import React, { useState, useEffect, useRef, useCallback } from 'react';
    import SidebarLayout from '@/Layouts/SidebarLayout';
    import { Head, usePage, router, Link, useForm } from '@inertiajs/react';
    import { 
        FaSave, FaEdit, FaTimes, FaCheckCircle, FaExclamationCircle, 
        FaPhone, FaStopCircle, FaPlayCircle,
        FaSort, FaSortUp, FaSortDown
    } from 'react-icons/fa';

    // --- COMPONENTS HELPER ---

    const CallTrackingModal = ({ isOpen, onClose, prospect, statusOptions, currentPage }) => {
        if (!isOpen || !prospect) return null;
        const [duration, setDuration] = useState(0);
        const [isActive, setIsActive] = useState(true);
        const [notes, setNotes] = useState(prospect.description || '');
        const [statusCode, setStatusCode] = useState(prospect.status_code || 'NEW');
        const [channel, setChannel] = useState('Phone');
        const timerRef = useRef(null);

        useEffect(() => {
            if (isActive) {
                timerRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000);
            } else {
                clearInterval(timerRef.current);
            }
            return () => clearInterval(timerRef.current);
        }, [isActive]);
        
        useEffect(() => {
            if (isOpen) {
                setDuration(0); setIsActive(true); setNotes(prospect.description || '');
                setStatusCode(prospect.status_code || 'NEW'); setChannel('Phone');
            }
        }, [isOpen, prospect]);

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
                contact_channel: channel,
                current_page: currentPage,
                // Kirim parameter sorting saat ini agar tidak reset saat refresh
                sort_field: new URLSearchParams(window.location.search).get('sort_field'),
                sort_direction: new URLSearchParams(window.location.search).get('sort_direction'),
            }, {
                onSuccess: () => onClose(),
                preserveScroll: true
            });
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-orange-200">
                    <div className="bg-orange-600 p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full animate-pulse"><FaPhone size={20} /></div>
                            <div>
                                <h3 className="font-bold text-lg">Call #{prospect.prospect_id}</h3>
                            </div>
                        </div>
                        <div className="text-3xl font-mono font-bold tracking-widest">{formatTime(duration)}</div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select value={statusCode} onChange={(e) => setStatusCode(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm">
                                {statusOptions.map(opt => <option key={opt.code} value={opt.code}>{opt.code}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm">
                                {['Phone', 'Whatsapp Call', 'Telegram Call'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm h-24" placeholder="Hasil pembicaraan..."></textarea>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <button onClick={() => setIsActive(!isActive)} className={`px-4 py-2 rounded-lg text-sm font-bold ${isActive ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                {isActive ? <><FaStopCircle className="inline mr-1"/> Pause</> : <><FaPlayCircle className="inline mr-1"/> Resume</>}
                            </button>
                            <div className="flex gap-2">
                                <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                                <button onClick={handleSave} className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-lg">Simpan</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const SalesRow = ({ item, onCallClick }) => {
        const formatDuration = (seconds) => {
            if (!seconds) return '-';
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return m > 0 ? `${m}m ${s}s` : `${s}s`;
        };

        return (
            <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100 group">
                <td className="px-4 py-3 text-center sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200 w-16">
                    <button onClick={() => onCallClick(item)} className="bg-orange-100 text-orange-600 p-2 rounded-full hover:bg-orange-600 hover:text-white transition shadow-md">
                        <FaPhone size={12} />
                    </button>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono">#{item.prospect_id}</td>
                <td className="px-4 py-3"><span className={`status-badge status-${item.status_code.toLowerCase()}`}>{item.status_code}</span></td>
                <td className="px-4 py-3"><div className="text-xs text-gray-600 max-w-[150px] truncate">{item.description || '-'}</div></td>
                <td className="px-4 py-3">
                    {item.priority === 1 && <span className="bg-green-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">HIGH</span>}
                    {item.priority === 2 && <span className="bg-yellow-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">MED</span>}
                    {item.priority === 3 && <span className="bg-gray-400 text-white px-2 py-0.5 rounded text-[10px] font-bold">LOW</span>}
                </td>
                <td className="px-4 py-3 font-bold text-blue-600">{item.score ? (item.score * 100).toFixed(3) + '%' : '-'}</td>
                <td className="px-4 py-3 text-xs">{item.job || '-'}</td>
                <td className="px-4 py-3 text-xs font-medium text-gray-700">{item.age} Th</td>
                <td className="px-4 py-3 text-xs">{item.telemarketer_name !== '-' ? item.telemarketer_name : '-'}</td>
                
                {/* CLEAN BG: Warna putih sesuai request */}
                <td className="px-4 py-3 text-center text-xs font-bold text-gray-600">
                    {item.call_count > 0 ? item.call_count : <span className="text-gray-300">-</span>}
                </td>

                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                   {item.last_contact_at}
                </td>
                
                <td className="px-4 py-3 font-mono text-xs">
                    {item.total_duration_sec > 0 ? (
                        <span className="text-purple-700 font-bold bg-purple-50 px-2 py-1 rounded">
                            {formatDuration(item.total_duration_sec)}
                        </span>
                    ) : (
                        <span className="text-gray-300">-</span>
                    )}
                </td>
            </tr>
        );
    };

    // --- MAIN PAGE ---
    export default function Prospects({ prospects, statusOptions, telemarketers, channelOptions, filters = {} }) {
        const { flash } = usePage().props;
        const [selectedProspect, setSelectedProspect] = useState(null);
        const [isModalOpen, setIsModalOpen] = useState(false);

        const { data, setData, reset } = useForm({
            search: filters.search || '', 
            filter_status: filters.filter_status || '',
            filter_priority: filters.filter_priority || '', 
            filter_telemarketer: filters.filter_telemarketer || '',
            filter_channel: filters.filter_channel || '', 
            // Initial state dari server
            sort_field: filters.sort_field || 'created_at',
            sort_direction: filters.sort_direction || 'desc', 
            page: filters.page || 1,
        });

        useEffect(() => {
            setData({
                ...data,
                search: filters.search || '',
                filter_status: filters.filter_status || '',
                filter_priority: filters.filter_priority || '',
                filter_telemarketer: filters.filter_telemarketer || '',
                filter_channel: filters.filter_channel || '',
                sort_field: filters.sort_field || 'created_at',
                sort_direction: filters.sort_direction || 'desc',
                page: filters.page || 1,
            });
        }, [filters]);

        useEffect(() => { document.body.style.zoom = "75%"; return () => { document.body.style.zoom = "100%"; }; }, []);

        const handleFilterChange = useCallback((key, value) => {
            setData(key, value);
            const queryParams = { 
                ...data, 
                [key]: value, 
                page: 1 
            };
            router.get(route('sales.prospects.index'), queryParams, { 
                preserveState: true, 
                preserveScroll: true,
                replace: true 
            });
        }, [data, setData]);

        const handleReset = () => {
            const emptyState = {
                search: '', filter_status: '', filter_priority: '', 
                filter_telemarketer: '', filter_channel: '',
                sort_field: 'created_at', sort_direction: 'desc', page: 1
            };
            setData(emptyState);
            router.get(route('sales.prospects.index'), {}, { preserveState: false, preserveScroll: true });
        };

        // SERVER-SIDE SORTING HANDLER
        const handleSort = (field) => {
            let newDirection = 'desc';
            // Jika field sama dengan yang aktif sekarang, balik arahnya
            if (data.sort_field === field) {
                newDirection = data.sort_direction === 'asc' ? 'desc' : 'asc';
            }

            setData({ ...data, sort_field: field, sort_direction: newDirection });
            
            // Panggil Backend
            router.get(route('sales.prospects.index'), {
                ...data,
                sort_field: field,
                sort_direction: newDirection,
                page: 1 // Reset page ke 1
            }, { 
                preserveState: true, 
                preserveScroll: true 
            });
        };

        const handleCallClick = (prospect) => { setSelectedProspect(prospect); setIsModalOpen(true); };
        
        const renderSortIcon = (field) => {
            if (data.sort_field !== field) return <FaSort className="text-gray-300 ml-1 inline" size={10} />;
            return data.sort_direction === 'asc' ? <FaSortUp className="text-blue-600 ml-1 inline" size={10} /> : <FaSortDown className="text-blue-600 ml-1 inline" size={10} />;
        };

        return (
            <SidebarLayout header="Sales Workspace">
                <Head title="Prospek & Dashboard" />
                <CallTrackingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} prospect={selectedProspect} statusOptions={statusOptions} currentPage={prospects.current_page} />

                {/* NOTIFIKASI */}
                <div className="mb-4">
                    {flash.success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 text-sm flex items-center gap-2"><FaCheckCircle/> {flash.success}</div>}
                    {flash.error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 text-sm flex items-center gap-2"><FaExclamationCircle/> {flash.error}</div>}
                </div>
                
                {/* --- TABLE SECTION --- */}
                <div className="bg-white shadow-sm sm:rounded-xl border border-gray-200 overflow-hidden mt-6">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800">Daftar Prospek</h3>
                        <span className="text-xs text-gray-500">Total: {prospects.total} data</span>
                    </div>

                    {/* FILTERS */}
                    <div className="p-3 bg-white border-b border-gray-200 grid grid-cols-6 gap-2 items-end">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500">Search ID</label>
                            <input type="text" value={data.search} onChange={(e) => handleFilterChange('search', e.target.value)} className="w-full text-xs border-gray-300 rounded h-8" placeholder="ID..." />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500">Status</label>
                            <select value={data.filter_status} onChange={(e) => handleFilterChange('filter_status', e.target.value)} className="w-full text-xs border-gray-300 rounded h-8">
                                <option value="">Semua</option>{statusOptions.map(opt => <option key={opt.code} value={opt.code}>{opt.code}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500">Prioritas</label>
                            <select value={data.filter_priority} onChange={(e) => handleFilterChange('filter_priority', e.target.value)} className="w-full text-xs border-gray-300 rounded h-8">
                                <option value="">Semua</option><option value="1">High</option><option value="2">Medium</option><option value="3">Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500">Telemarketer</label>
                            <select value={data.filter_telemarketer} onChange={(e) => handleFilterChange('filter_telemarketer', e.target.value)} className="w-full text-xs border-gray-300 rounded h-8">
                                <option value="">Semua</option>{telemarketers.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500">Channel</label>
                            <select value={data.filter_channel} onChange={(e) => handleFilterChange('filter_channel', e.target.value)} className="w-full text-xs border-gray-300 rounded h-8">
                                <option value="">Semua</option>{channelOptions.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                            </select>
                        </div>
                        <button onClick={handleReset} className="h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-bold border border-gray-300">Reset</button>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <table className="min-w-full whitespace-nowrap text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-center sticky left-0 bg-gray-100 z-10 w-16">Call</th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('prospect_id')}>ID {renderSortIcon('prospect_id')}</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Deskripsi</th>
                                    <th className="px-4 py-3">Prio</th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('score')}>Score {renderSortIcon('score')}</th>
                                    <th className="px-4 py-3">Job</th>
                                    <th className="px-4 py-3">Age</th>
                                    <th className="px-1 py-3">Telemarketer</th>
                                    <th className="px-1 py-3 text-center cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('call_count')}>Total Call {renderSortIcon('call_count')}</th>
                                    <th className="px-4 py-3">Last Contact</th>
                                    <th className="px-1 py-3 text-purple-700">Total Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {prospects.data.length > 0 ? (
                                    prospects.data.map((item) => <SalesRow key={item.prospect_id} item={item} onCallClick={handleCallClick} />)
                                ) : (
                                    <tr><td colSpan="13" className="px-6 py-10 text-center text-gray-500 italic">Data tidak ditemukan.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-1 justify-end">
                        {prospects.links.map((link, key) => (
                            <Link key={key} href={link.url || '#'} dangerouslySetInnerHTML={{ __html: link.label }} className={`px-3 py-1 text-xs border rounded transition ${link.active ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`} />
                        ))}
                    </div>
                </div>
            </SidebarLayout>
        );
    }

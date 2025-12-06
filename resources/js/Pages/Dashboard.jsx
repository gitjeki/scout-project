import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, usePage, useForm, Link, router } from '@inertiajs/react';
import { 
    FaChartLine, FaRobot, FaCloudUploadAlt, 
    FaCheckCircle, FaExclamationCircle, FaSave, FaEdit, FaTimes, FaPlus,
    FaTrash, FaFilter, FaSpinner,
    FaDatabase, FaCalendarDay, FaChartPie, FaExclamationTriangle,
    // Icon Sales
    FaFire, FaPhoneAlt, FaStopwatch, FaRegCalendarAlt, FaProjectDiagram,
    // Icon Sort
    FaSort, FaSortUp, FaSortDown
} from 'react-icons/fa';
import { useState, useEffect } from 'react';

// --- COMPONENTS HELPER (NEW DESIGN) ---

// 1. KARTU PERFORMA (Bagian Atas - Kinerja Anda)
const PerformanceCard = ({ title, value, unit, subtext, icon: Icon, theme }) => {
    const themes = {
        red: { 
            bg: 'bg-red-50', border: 'border-red-100', 
            textTitle: 'text-gray-700', textVal: 'text-red-600', 
            iconBg: 'bg-white', iconColor: 'text-red-500' 
        },
        blue: { 
            bg: 'bg-blue-50', border: 'border-blue-100', 
            textTitle: 'text-gray-700', textVal: 'text-blue-600', 
            iconBg: 'bg-white', iconColor: 'text-blue-500' 
        },
        green: { 
            bg: 'bg-green-50', border: 'border-green-100', 
            textTitle: 'text-gray-700', textVal: 'text-green-600', 
            iconBg: 'bg-white', iconColor: 'text-green-500' 
        },
    };

    const t = themes[theme] || themes.blue;

    return (
        <div className={`p-6 rounded-xl border ${t.border} ${t.bg} shadow-sm relative overflow-hidden transition-transform hover:scale-[1.01]`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className={`text-sm font-bold ${t.textTitle}`}>{title}</h3>
                <div className={`p-2 rounded-full shadow-sm ${t.iconBg} ${t.iconColor}`}>
                    <Icon size={16} />
                </div>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-4xl font-extrabold ${t.textVal}`}>{value}</span>
                <span className="text-sm font-medium text-gray-500">{unit}</span>
            </div>
            <p className="text-xs text-gray-500 font-medium">{subtext}</p>
        </div>
    );
};

// 2. KARTU PIPELINE (Bagian Bawah - Overview)
const PipelineStatusCard = ({ title, count, description, statusType }) => {
    // Config warna berdasarkan status (meniru gambar)
    const config = {
        'CONTACTED': { 
            bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600',
            defaultDesc: 'Sudah ditelepon, belum ada keputusan'
        },
        'INTERESTED': { 
            bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600',
            defaultDesc: 'Nasabah tertarik, butuh follow up'
        },
        'ACCEPTED': { 
            bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600',
            defaultDesc: 'Nasabah setuju mendaftar'
        },
        'REFUSED': { 
            bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600',
            defaultDesc: 'Nasabah menolak penawaran'
        },
        'NO ANSWER': { 
            bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600',
            defaultDesc: 'Telepon tidak diangkat berkali-kali'
        },
        'INVALID NUMBER': { 
            bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600',
            defaultDesc: 'Nomor telepon salah/tidak terdaftar'
        }
    };

    // Fallback jika status tidak dikenali
    const style = config[title.toUpperCase()] || { 
        bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-700', defaultDesc: 'Status prospek' 
    };

    return (
        <div className={`p-4 rounded-lg border ${style.border} ${style.bg} h-full flex flex-col justify-between shadow-sm`}>
            <div>
                <h4 className={`text-[11px] font-bold uppercase tracking-wider ${style.text} mb-2`}>
                    {title}
                </h4>
                <div className="text-3xl font-extrabold text-gray-800 mb-2">
                    {count}
                </div>
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">
                {description || style.defaultDesc}
            </p>
        </div>
    );
};

// --- KOMPONEN LAMA (STATS CARD ADMIN) ---
const StatsCard = ({ icon: Icon, color, title, value, unit, description }) => {
    let colors = {
        red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
        green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-500' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-500' },
    }[color] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'text-gray-500' };

    return (
        <div className={`p-4 rounded-xl shadow-sm border border-gray-200 ${colors.bg}`}>
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{title}</p>
                <div className={`p-2 rounded-full bg-white shadow-sm ${colors.icon}`}><Icon size={14} /></div>
            </div>
            <div className="mt-3">
                <span className={`text-3xl font-extrabold ${colors.text}`}>{value}</span>
                <span className="text-xs ml-1 font-medium text-gray-500">{unit}</span>
            </div>
            <p className="text-[10px] mt-1 text-gray-500 truncate">{description}</p>
        </div>
    );
};

// --- KOMPONEN NOTIFIKASI MELAYANG ---
const FloatingToast = ({ flash, errors }) => {
    const [show, setShow] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        if (flash.success) {
            setMsg({ type: 'success', text: flash.success });
            setShow(true);
        } else if (flash.error) {
            setMsg({ type: 'error', text: flash.error });
            setShow(true);
        } else if (errors && Object.keys(errors).length > 0) {
            const firstErrorKey = Object.keys(errors)[0];
            setMsg({ type: 'error', text: errors[firstErrorKey] });
            setShow(true);
        } else {
            setShow(false);
        }
        const timer = setTimeout(() => setShow(false), 5000);
        return () => clearTimeout(timer);
    }, [flash, errors]);

    if (!show) return null;
    const styles = msg.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white';
    const icon = msg.type === 'success' ? <FaCheckCircle className="text-xl" /> : <FaExclamationCircle className="text-xl" />;

    return (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 animate-slide-in ${styles}`}>
            {icon}
            <div>
                <h4 className="font-bold text-sm uppercase">{msg.type === 'success' ? 'Berhasil' : 'Gagal'}</h4>
                <p className="text-sm font-medium">{msg.text}</p>
            </div>
            <button onClick={() => setShow(false)} className="ml-4 text-white hover:text-gray-200"><FaTimes /></button>
        </div>
    );
};

// --- LOADING OVERLAY ---
const LoadingOverlay = ({ isVisible, mode = 'predict' }) => {
    if (!isVisible) return null;
    const config = {
        predict: { icon: <FaRobot className="text-6xl text-orange-500 mb-4 animate-pulse" />, title: "AI Sedang Bekerja...", subtitle: "Menganalisis probabilitas data prospek." },
        import: { icon: <FaCloudUploadAlt className="text-6xl text-blue-500 mb-4 animate-bounce" />, title: "Mengimport Data...", subtitle: "Mohon tunggu, sedang memasukkan data ke database." },
        delete: { icon: <FaTrash className="text-6xl text-red-500 mb-4 animate-pulse" />, title: "Menghapus Data...", subtitle: "Mohon tunggu, sedang membersihkan database." }
    };
    const current = config[mode] || config.predict;
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-slow min-w-[300px]">
                {current.icon}
                <FaSpinner className="text-4xl text-gray-400 animate-spin mb-2" />
                <h2 className="text-xl font-bold text-gray-800">{current.title}</h2>
                <p className="text-gray-500 text-sm mt-2 text-center">{current.subtitle}</p>
            </div>
        </div>
    );
};

// --- MODAL KONFIRMASI HAPUS (POP UP) ---
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, type, count, statusName }) => {
    if (!isOpen) return null;

    let title = "Konfirmasi Hapus";
    let message = "";
    
    if (type === 'single') {
        message = "Apakah Anda yakin ingin menghapus data prospek ini secara permanen?";
    } else if (type === 'selection') {
        message = `Anda akan menghapus ${count} data prospek yang telah dipilih. Data yang dihapus tidak dapat dikembalikan.`;
    } else if (type === 'all_filtered') {
        title = "PERINGATAN BAHAYA!";
        message = `Anda akan menghapus SEMUA data dengan status "${statusName || 'Semua'}" di SELURUH HALAMAN (Total Database). Tindakan ini tidak dapat dibatalkan!`;
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-red-100 p-4 rounded-full mb-4">
                        <FaExclamationTriangle className="text-3xl text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">{message}</p>
                    
                    <div className="flex gap-3 w-full">
                        <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors">
                            Batal
                        </button>
                        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2">
                            <FaTrash size={14} /> Hapus
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CONSTANTS & FORM COMPONENTS ---
const OPT_JOBS = ['admin.', 'services', 'management', 'blue-collar', 'entrepreneur', 'student', 'technician', 'housemaid', 'self-employed', 'unemployed', 'retired'];
const OPT_EDUCATION = ['basic.4y', 'basic.6y', 'basic.9y', 'high.school', 'professional.course', 'university.degree', 'illiterate', 'unknown'];
const OPT_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const OPT_POUTCOME = ['nonexistent', 'failure', 'success'];

const InputGroup = ({ label, type = "text", placeholder, value, onChange, error }) => (
    <div className="flex flex-col">
        <label className="text-xs font-bold text-gray-600 mb-1 capitalize">{label}</label>
        <input type={type} value={value} onChange={onChange} className="text-sm border-gray-300 rounded focus:border-blue-500 focus:ring-blue-500 py-1.5" placeholder={placeholder} />
        {error && <span className="text-red-500 text-[10px] mt-1">{error}</span>}
    </div>
);

const SelectGroup = ({ label, options, value, onChange, error }) => (
    <div className="flex flex-col">
        <label className="text-xs font-bold text-gray-600 mb-1 capitalize">{label}</label>
        <select value={value} onChange={onChange} className="text-sm border-gray-300 rounded focus:border-blue-500 focus:ring-blue-500 py-1.5 bg-white">
            {options.map((opt) => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
        </select>
        {error && <span className="text-red-500 text-[10px] mt-1">{error}</span>}
    </div>
);

// --- MODAL TAMBAH MANUAL ---
const CreateProspectModal = ({ isOpen, onClose }) => {
    const { data, setData, post, processing, reset, errors } = useForm({
        age: '', job: 'admin.', education: 'university.degree', month: 'may', duration: '',
        campaign: '', poutcome: 'nonexistent', cons_price_idx: '', cons_conf_idx: '', euribor3m: '', nr_employed: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('dashboard.store'), { onSuccess: () => { reset(); onClose(); } });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl m-4 p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FaTimes size={18} /></button>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2"><FaPlus className="text-blue-600" /> Tambah Prospek Manual</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <InputGroup label="Age" type="number" value={data.age} onChange={e => setData('age', e.target.value)} error={errors.age} />
                        <SelectGroup label="Job" options={OPT_JOBS} value={data.job} onChange={e => setData('job', e.target.value)} error={errors.job} />
                        <SelectGroup label="Education" options={OPT_EDUCATION} value={data.education} onChange={e => setData('education', e.target.value)} error={errors.education} />
                        <SelectGroup label="Month" options={OPT_MONTHS} value={data.month} onChange={e => setData('month', e.target.value)} error={errors.month} />
                        <SelectGroup label="Poutcome" options={OPT_POUTCOME} value={data.poutcome} onChange={e => setData('poutcome', e.target.value)} error={errors.poutcome} />
                    </div>
                    <div className="space-y-3">
                        <InputGroup label="Duration" type="number" value={data.duration} onChange={e => setData('duration', e.target.value)} error={errors.duration} />
                        <InputGroup label="Campaign" type="number" value={data.campaign} onChange={e => setData('campaign', e.target.value)} error={errors.campaign} />
                        <InputGroup label="Cons. Price Idx" type="number" value={data.cons_price_idx} onChange={e => setData('cons_price_idx', e.target.value)} error={errors.cons_price_idx} />
                        <InputGroup label="Cons. Conf. Idx" type="number" value={data.cons_conf_idx} onChange={e => setData('cons_conf_idx', e.target.value)} error={errors.cons_conf_idx} />
                        <InputGroup label="Euribor 3M" type="number" value={data.euribor3m} onChange={e => setData('euribor3m', e.target.value)} error={errors.euribor3m} />
                        <InputGroup label="Nr. Employed" type="number" value={data.nr_employed} onChange={e => setData('nr_employed', e.target.value)} error={errors.nr_employed} />
                    </div>
                    <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Batal</button>
                        <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded shadow flex items-center gap-2">{processing ? 'Menyimpan...' : <><FaSave /> Simpan</>}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- KOMPONEN BARIS (ROW) ---
const ProspectRow = ({ item, isAdmin, isSelected, onToggleSelect, onDeleteRequest }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [values, setValues] = useState({ ...item });

    const handleChange = (e) => setValues({ ...values, [e.target.name]: e.target.value });

    const handleSave = () => {
        router.put(route('dashboard.update', item.id), values, {
            preserveScroll: true,
            onSuccess: () => setIsEditing(false),
        });
    };

    const handleCancel = () => {
        setValues({ ...item });
        setIsEditing(false);
    };

    const renderCell = (name, type = "text", width = "w-24", options = null) => {
        if (isEditing) {
            if (options) {
                return <select name={name} value={values[name]} onChange={handleChange} className={`text-xs border-gray-300 rounded px-1 py-1 shadow-sm ${width}`}>{options.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}</select>;
            }
            return <input type={type} name={name} value={values[name]} onChange={handleChange} className={`text-xs border-gray-300 rounded px-2 py-1 shadow-sm ${width}`} />;
        }
        return <span className="text-gray-700">{item[name]}</span>;
    };

    return (
        <tr className={`hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${isSelected ? 'bg-blue-50' : ''}`}>
            {/* CHECKBOX */}
            <td className="px-4 py-3 text-center sticky left-0 bg-white hover:bg-gray-50 z-20 border-r border-gray-100 w-10">
                <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => onToggleSelect(item.id)} 
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
            </td>

            {/* ACTION BUTTONS (Edit & Delete) */}
            <td className="px-4 py-3 text-center sticky left-10 bg-white hover:bg-gray-50 z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-24">
                {isEditing ? (
                    <div className="flex justify-center items-center gap-1">
                        <button onClick={handleSave} className="text-green-600 p-1 hover:bg-green-100 rounded"><FaSave /></button>
                        <button onClick={handleCancel} className="text-red-500 p-1 hover:bg-red-100 rounded"><FaTimes /></button>
                    </div>
                ) : (
                    <div className="flex justify-center items-center gap-1">
                        <button onClick={() => setIsEditing(true)} className="text-blue-500 p-1.5 hover:bg-blue-100 rounded" title="Edit"><FaEdit /></button>
                        {isAdmin && (
                            <button onClick={() => onDeleteRequest(item.id)} className="text-red-500 p-1.5 hover:bg-red-100 rounded" title="Hapus"><FaTrash size={12}/></button>
                        )}
                    </div>
                )}
            </td>

            <td className="px-4 py-3 text-gray-500 text-xs font-mono">#{item.id}</td>
            <td className="px-4 py-3"><span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span></td>
            <td className="px-4 py-3 font-bold text-blue-600">{item.score !== null ? (item.score * 100).toFixed(3) + '%' : '-'}</td>
            <td className="px-4 py-3">
                {item.priority === 1 && <span className="bg-green-500 text-white px-2 py-0.5 rounded text-[10px]">HIGH</span>}
                {item.priority === 2 && <span className="bg-yellow-500 text-white px-2 py-0.5 rounded text-[10px]">MED</span>}
                {item.priority === 3 && <span className="bg-gray-400 text-white px-2 py-0.5 rounded text-[10px]">LOW</span>}
            </td>
            <td className="px-4 py-3">{renderCell('age', 'number', 'w-16')}</td>
            <td className="px-4 py-3">{renderCell('job', 'text', 'w-32', OPT_JOBS)}</td>
            <td className="px-4 py-3">{renderCell('education', 'text', 'w-36', OPT_EDUCATION)}</td>
            <td className="px-4 py-3 uppercase">{renderCell('month', 'text', 'w-20', OPT_MONTHS)}</td>
            <td className="px-4 py-3">{renderCell('duration', 'number', 'w-20')}</td>
            <td className="px-4 py-3 text-center">{renderCell('campaign', 'number', 'w-16')}</td>
            <td className="px-4 py-3">{renderCell('poutcome', 'text', 'w-28', OPT_POUTCOME)}</td>
            <td className="px-4 py-3">{renderCell('cons_price_idx', 'number', 'w-20')}</td>
            <td className="px-4 py-3">{renderCell('cons_conf_idx', 'number', 'w-20')}</td>
            <td className="px-4 py-3">{renderCell('euribor3m', 'number', 'w-20')}</td>
            <td className="px-4 py-3">{renderCell('nr_employed', 'number', 'w-20')}</td>
            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{item.scored_at || '-'}</td>
        </tr>
    );
};

// --- MAIN PAGE ---
export default function Dashboard({ stats, prospects, statusOptions = [], filters = {}, personalStats, pipelineStats }) {
    const { auth, flash, errors } = usePage().props;
    const isAdmin = auth.user.role === 'admin';
    const isSales = auth.user.role === 'sales';

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    
    // STATES FOR FILTER, SORT & SELECTION
    const [filterStatus, setFilterStatus] = useState(filters.status || '');
    const [sortField, setSortField] = useState(filters.sort_field || 'id');
    const [sortDirection, setSortDirection] = useState(filters.sort_direction || 'desc');
    const [selectedIds, setSelectedIds] = useState([]);
    
    // STATE FOR DELETE MODAL
    const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, type: '', targetId: null });
    const [isDeleting, setIsDeleting] = useState(false); 

    // RESET SELECTION
    useEffect(() => { setSelectedIds([]); }, [filterStatus, sortField, sortDirection]);
    
    // Logic Filter
    const handleFilterChange = (e) => {
        const val = e.target.value;
        setFilterStatus(val);
        router.get(route('dashboard'), { 
            status: val, 
            sort_field: sortField, 
            sort_direction: sortDirection 
        }, { preserveState: true, replace: true });
    };

    // --- LOGIKA SORTING (Baru) ---
    const handleSort = (field) => {
        let newDirection = 'asc';
        if (sortField === field) {
            newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        }
        setSortField(field);
        setSortDirection(newDirection);

        router.get(route('dashboard'), {
            status: filterStatus,
            sort_field: field,
            sort_direction: newDirection
        }, { preserveState: true });
    };

    const renderSortIcon = (field) => {
        if (sortField !== field) return <FaSort className="inline ml-1 text-gray-400 text-[10px]" />;
        return sortDirection === 'asc' 
            ? <FaSortUp className="inline ml-1 text-blue-600" />
            : <FaSortDown className="inline ml-1 text-blue-600" />;
    };

    // --- LOGIKA SELEKSI HALAMAN ---
    const currentPageIds = prospects.data.map(p => p.id);
    const isAllCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.includes(id));

    const handleSelectAllCurrentPage = (e) => {
        if (e.target.checked) {
            const newSelection = [...new Set([...selectedIds, ...currentPageIds])];
            setSelectedIds(newSelection);
        } else {
            const newSelection = selectedIds.filter(id => !currentPageIds.includes(id));
            setSelectedIds(newSelection);
        }
    };

    const handleSelectRow = (id) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id));
        else setSelectedIds([...selectedIds, id]);
    };

    // --- LOGIKA TRIGGER DELETE ---
    const requestDeleteSingle = (id) => {
        setDeleteModalState({ isOpen: true, type: 'single', targetId: id });
    };

    const requestDeleteSelection = () => {
        setDeleteModalState({ isOpen: true, type: 'selection', count: selectedIds.length });
    };

    const requestDeleteAllFiltered = () => {
        setDeleteModalState({ isOpen: true, type: 'all_filtered', statusName: filterStatus });
    };

    // --- EKSEKUSI DELETE ---
    const confirmDelete = () => {
        const { type, targetId } = deleteModalState;
        setIsDeleting(true);

        if (type === 'single') {
            router.delete(route('dashboard.destroy', targetId), {
                preserveScroll: true,
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteModalState({ isOpen: false, type: '', targetId: null });
                    setSelectedIds(prev => prev.filter(id => id !== targetId));
                }
            });
        } else if (type === 'selection' || type === 'all_filtered') {
            router.post(route('dashboard.bulk-destroy'), {
                type: type,
                ids: selectedIds, 
                status: filterStatus
            }, {
                preserveScroll: true,
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteModalState({ isOpen: false, type: '', targetId: null });
                    if(type === 'selection') setSelectedIds([]); 
                }
            });
        }
    };

    // Forms Import & Predict
    const { data: dataImport, setData: setDataImport, post: postImport, processing: processingImport, reset: resetImport, errors: errorsImport } = useForm({ csv_file: null });
    const { post: postPredict, processing: processingPredict } = useForm({});
    
    const submitImport = (e) => { 
        e.preventDefault(); 
        postImport(route('dashboard.import'), { 
            forceFormData: true, 
            preserveScroll: true,
            onSuccess: () => { 
                resetImport(); 
                const fileInput = document.getElementById('file-upload');
                if(fileInput) fileInput.value = ''; 
            }
        }); 
    };
    
    const submitPredict = (e) => { 
        e.preventDefault(); 
        postPredict(route('dashboard.run-predictions'), { preserveScroll: true }); 
    };

    // Zoom Handling
    useEffect(() => { document.body.style.zoom = "60%"; return () => { document.body.style.zoom = "100%"; }; }, []);

    return (
        <SidebarLayout header={isSales ? "Sales Dashboard" : "Administrator Dashboard"}>
            <Head title="Dashboard" />
            
            <FloatingToast flash={flash} errors={errors} />

            <LoadingOverlay 
                isVisible={processingPredict || processingImport || isDeleting} 
                mode={isDeleting ? 'delete' : (processingImport ? 'import' : 'predict')} 
            />

            <CreateProspectModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
            
            <DeleteConfirmModal 
                isOpen={deleteModalState.isOpen} 
                onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })} 
                onConfirm={confirmDelete}
                type={deleteModalState.type}
                count={deleteModalState.count}
                statusName={deleteModalState.statusName}
            />

            {/* --- BAGIAN 1: STATISTIK & KINERJA SALES (REDESIGNED) --- */}
            {isSales && personalStats && pipelineStats && (
                <div className="mb-8 space-y-8 animate-fade-in-up">
                    
                    {/* SECTION: KINERJA ANDA HARI INI */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-500">
                            <FaChartLine />
                            <h3 className="text-sm font-bold uppercase tracking-wider">Kinerja Anda Hari Ini</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card 1: Target Prioritas (Red) */}
                            <PerformanceCard 
                                title="Target Prioritas"
                                value={personalStats.hot_leads}
                                unit="Prospek"
                                subtext="NEW  & High Prioritas"
                                icon={FaFire}
                                theme="red"
                            />

                            {/* Card 2: Aktivitas Anda (Blue) */}
                            <PerformanceCard 
                                title="Aktivitas Anda"
                                value={personalStats.calls_today}
                                unit="Call"
                                subtext="Log tersimpan hari ini"
                                icon={FaRegCalendarAlt}
                                theme="blue"
                            />

                            {/* Card 3: Durasi Bicara (Green) */}
                            <PerformanceCard 
                                title="Durasi Bicara"
                                value={personalStats.duration_min}
                                unit="Menit"
                                subtext="Total durasi telepon hari ini"
                                icon={FaStopwatch}
                                theme="green"
                            />
                        </div>
                    </div>

                    {/* SECTION: GLOBAL PIPELINE OVERVIEW */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-500">
                            <FaProjectDiagram />
                            <h3 className="text-sm font-bold uppercase tracking-wider">Global Pipeline Overview</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {/* Kita map pipelineStats. Jika data kosong, tampilkan placeholder */}
                            {pipelineStats.length > 0 ? (
                                pipelineStats.map((stat, idx) => (
                                    <PipelineStatusCard 
                                        key={idx}
                                        title={stat.code}
                                        count={stat.count}
                                        // Description otomatis diambil di dalam komponen berdasarkan title/code
                                        statusType={stat.code} 
                                    />
                                ))
                            ) : (
                                <div className="col-span-6 text-center text-gray-400 text-sm py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    Belum ada data pipeline hari ini.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}

            {/* TAMPILAN KHUSUS ADMIN: System Overview (Tetap style lama atau bisa disesuaikan) */}
            {isAdmin && (
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FaChartPie/> Data Summary (System)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatsCard icon={FaDatabase} color="blue" title="Total Data Input" value={stats.total_input} unit="Row" description="Gabungan Manual & Import" />
                        <StatsCard icon={FaCalendarDay} color="green" title="Input Hari Ini" value={stats.today_input} unit="Row" description="Data baru masuk hari ini" />
                        <StatsCard icon={FaRobot} color="purple" title="Total Diprediksi" value={stats.total_predicted} unit="Row" description="Total data selesai diproses AI" />
                        <StatsCard icon={FaChartLine} color="orange" title="Prediksi Hari Ini" value={stats.today_predicted} unit="Row" description="Hasil prediksi AI hari ini" />
                    </div>
                </div>
            )}

            {isAdmin && (
                <>
                {/* TOOLBAR: FILTER & ACTIONS */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Filter Section */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <FaFilter className="text-gray-400" />
                        <select value={filterStatus} onChange={handleFilterChange} className="border-gray-300 rounded text-sm w-full md:w-64">
                            <option value="">Semua Status</option>
                            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    {/* Batch Actions Section */}
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                        {selectedIds.length > 0 && (
                            <button onClick={requestDeleteSelection} className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200 transition animate-fade-in">
                                <FaTrash /> Hapus {selectedIds.length} Terpilih
                            </button>
                        )}
                        
                        <button onClick={requestDeleteAllFiltered} className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded text-xs font-bold hover:bg-gray-900 transition">
                            <FaExclamationTriangle /> Hapus Semua {filterStatus ? `(${filterStatus})` : 'Data'}
                        </button>
                    </div>
                </div>

                {/* MAIN TABLE */}
                <div className="bg-white shadow-sm sm:rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-wrap gap-2">
                        <div className="flex flex-col xl:flex-row gap-4 items-center w-full">
                            <h3 className="text-base font-bold text-gray-800 whitespace-nowrap">Daftar Prospek</h3>
                            
                            {/* Import & Predict Buttons */}
                            <div className="flex flex-col md:flex-row gap-2 w-full justify-end">
                                <button onClick={() => setCreateModalOpen(true)} className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 justify-center"><FaPlus /> Manual</button>
                                
                                <form onSubmit={submitImport} className="flex gap-2 items-center">
                                    <div className="relative">
                                        <input id="file-upload" type="file" onChange={e => setDataImport('csv_file', e.target.files[0])} accept=".csv" className="block w-full text-xs text-slate-500 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                        {errorsImport.csv_file && <div className="absolute top-full left-0 text-[10px] text-red-600 font-bold mt-1 whitespace-nowrap">{errorsImport.csv_file}</div>}
                                    </div>
                                    <button type="submit" disabled={processingImport || !dataImport.csv_file} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 disabled:opacity-50">
                                        <FaCloudUploadAlt /> Import
                                    </button>
                                </form>

                                <form onSubmit={submitPredict}>
                                    <button type="submit" disabled={processingPredict} className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 disabled:opacity-50 justify-center">
                                        <FaRobot /> {processingPredict ? 'Memproses...' : 'Prediksi'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <table className="min-w-full whitespace-nowrap text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold tracking-wider border-b border-gray-200">
                                <tr>
                                    {/* Checkbox All (Page Context) */}
                                    <th className="px-4 py-3 text-center sticky left-0 bg-gray-100 z-20 border-r border-gray-100 w-10">
                                        <input 
                                            type="checkbox" 
                                            onChange={handleSelectAllCurrentPage} 
                                            checked={isAllCurrentPageSelected} 
                                            className="rounded text-blue-600 focus:ring-blue-500" 
                                            title="Pilih semua di halaman ini"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-center sticky left-10 bg-gray-100 z-20 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-24">Action</th>
                                    
                                    {/* SORTABLE COLUMNS */}
                                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('id')}>ID {renderSortIcon('id')}</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('score')}>Score {renderSortIcon('score')}</th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('priority')}>Priority {renderSortIcon('priority')}</th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('age')}>Age {renderSortIcon('age')}</th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('job')}>Job {renderSortIcon('job')}</th>
                                    <th className="px-4 py-3">Education</th>
                                    <th className="px-4 py-3">Month</th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('duration')}>Duration {renderSortIcon('duration')}</th>
                                    <th className="px-4 py-3 text-center cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('campaign')}>Campaign {renderSortIcon('campaign')}</th>
                                    <th className="px-4 py-3">P.Out</th>
                                    <th className="px-4 py-3">C.Price</th>
                                    <th className="px-4 py-3">C.Conf</th>
                                    <th className="px-4 py-3">Euribor3m</th>
                                    <th className="px-4 py-3">N.Employed</th>
                                    <th className="px-4 py-3 text-right">Scored At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {prospects.data.length > 0 ? (
                                    prospects.data.map((item) => (
                                        <ProspectRow 
                                            key={item.id} 
                                            item={item} 
                                            isAdmin={isAdmin}
                                            isSelected={selectedIds.includes(item.id)}
                                            onToggleSelect={handleSelectRow}
                                            onDeleteRequest={requestDeleteSingle}
                                        />
                                    ))
                                ) : (
                                    <tr><td colSpan="18" className="px-6 py-10 text-center text-gray-500">Data kosong.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-between items-center bg-gray-50">
                        <span className="text-xs text-gray-500">
                            Page {prospects.current_page} of {prospects.last_page} | 
                            <span className="ml-2 font-bold text-blue-600">Total Terpilih: {selectedIds.length}</span>
                        </span>
                        <div className="flex gap-1">
                            {prospects.links.map((link, key) => (
                                <Link key={key} href={link.url || '#'} preserveState={true} dangerouslySetInnerHTML={{ __html: link.label }} className={`px-3 py-1 text-xs border rounded transition shadow-sm ${link.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`} />
                            ))}
                        </div>
                    </div>
                </div>
                </>
            )}
        </SidebarLayout>
    );
}
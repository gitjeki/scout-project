import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, usePage, useForm, Link, router } from '@inertiajs/react';
import { 
    FaUsers, FaChartLine, FaRobot, FaCloudUploadAlt, 
    FaCheckCircle, FaExclamationCircle, FaSave, FaEdit, FaTimes, FaPlus,
    FaTrash, FaFilter, FaCheckSquare, FaSpinner // <--- Icon Spinner ditambahkan
} from 'react-icons/fa';
import { useState, useEffect } from 'react';

// --- KONSTANTA PILIHAN ---
const OPT_JOBS = ['admin.', 'services', 'management', 'blue-collar', 'entrepreneur', 'student', 'technician', 'housemaid', 'self-employed', 'unemployed', 'retired'];
const OPT_EDUCATION = ['basic.4y', 'basic.6y', 'basic.9y', 'high.school', 'professional.course', 'university.degree', 'illiterate', 'unknown'];
const OPT_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const OPT_POUTCOME = ['nonexistent', 'failure', 'success'];

// --- SUB-KOMPONEN UI ---
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

// --- KOMPONEN LOADING OVERLAY ---
const LoadingOverlay = ({ isVisible, message }) => {
    if (!isVisible) return null;
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-slow max-w-sm text-center">
                <FaSpinner className="text-5xl text-blue-600 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-gray-800">{message || 'Sedang Memproses...'}</h2>
                <p className="text-gray-500 text-sm mt-2">Mohon tunggu sebentar, jangan tutup halaman ini.</p>
            </div>
        </div>
    );
};

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
const ProspectRow = ({ item, isAdmin, isSelected, onToggleSelect, onDelete }) => {
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
                            <button onClick={() => onDelete(item.id)} className="text-red-500 p-1.5 hover:bg-red-100 rounded" title="Hapus"><FaTrash size={12}/></button>
                        )}
                    </div>
                )}
            </td>

            <td className="px-4 py-3 text-gray-500 text-xs font-mono">#{item.id}</td>
            <td className="px-4 py-3"><span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span></td>
            <td className="px-4 py-3 font-bold text-blue-600">{item.score !== null ? (item.score * 100).toFixed(1) + '%' : '-'}</td>
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

// --- MAIN PAGE (REVISI) ---
export default function Dashboard({ stats, prospects, statusOptions = [], filters = {} }) {
    const { auth, flash } = usePage().props;
    const isAdmin = auth.user.role === 'admin';
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    
    // STATES FOR FILTER & BATCH DELETE
    const [filterStatus, setFilterStatus] = useState(filters.status || '');
    const [selectedIds, setSelectedIds] = useState([]);

    // Reset selection on page change or filter change
    useEffect(() => { setSelectedIds([]); }, [prospects.current_page, filterStatus]);
    
    // Logic Filter
    const handleFilterChange = (e) => {
        const val = e.target.value;
        setFilterStatus(val);
        router.get(route('dashboard'), { status: val }, { preserveState: true, replace: true });
    };

    // Logic Delete Single
    const handleDeleteSingle = (id) => {
        if(confirm('Yakin ingin menghapus data ini secara permanen?')) {
            router.delete(route('dashboard.destroy', id));
        }
    };

    // Logic Select All (Page)
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(prospects.data.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    // Logic Select Single Row
    const handleSelectRow = (id) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id));
        else setSelectedIds([...selectedIds, id]);
    };

    // Logic Batch Delete
    const handleBatchDelete = (type) => {
        let msg = '';
        if (type === 'selection') msg = `Yakin hapus ${selectedIds.length} data terpilih di HALAMAN INI saja?`;
        else msg = `PERINGATAN BAHAYA!\n\nAnda akan menghapus SEMUA data dengan status "${filterStatus || 'Semua'}" di SELURUH HALAMAN.\n\nLanjutkan?`;

        if (confirm(msg)) {
            router.post(route('dashboard.bulk-destroy'), {
                type: type,
                ids: selectedIds,
                status: filterStatus
            });
        }
    };

    // Forms
    const { data: dataImport, setData: setDataImport, post: postImport, processing: processingImport, reset: resetImport } = useForm({ csv_file: null });
    
    // INI KUNCI LOADING SCREEN: Gunakan state processingPredict
    const { post: postPredict, processing: processingPredict } = useForm({});
    
    const submitImport = (e) => { e.preventDefault(); postImport(route('dashboard.import'), { onSuccess: () => { resetImport(); document.getElementById('file-upload').value = ''; } }); };
    
    // Submit Prediksi
    const submitPredict = (e) => { 
        e.preventDefault(); 
        postPredict(route('dashboard.predict')); 
    };

    // Zoom
    useEffect(() => { document.body.style.zoom = "60%"; return () => { document.body.style.zoom = "100%"; }; }, []);

    // Tentukan pesan loading
    const isWorking = processingImport || processingPredict;
    const loadingMessage = processingImport ? 'Sedang Mengimpor Data...' : 'AI Sedang Bekerja...';

    return (
        <SidebarLayout header="Sales Analysis Dashboard">
            <Head title="Dashboard" />
            
            {/* 1. LOADING OVERLAY DISINI */}
            <LoadingOverlay isVisible={isWorking} message={loadingMessage} />
            
            <CreateProspectModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />

            {/* Flash Messages */}
            {(flash.success || flash.error) && (
                <div className={`mb-6 border px-4 py-3 rounded relative flex items-center text-sm ${flash.success ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'}`}>
                    {flash.success ? <FaCheckCircle /> : <FaExclamationCircle />} <span className="ml-2">{flash.success || flash.error}</span>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center"><div className="p-3 bg-blue-100 rounded-full text-blue-600 mr-4"><FaUsers size={20} /></div><div><p className="text-gray-500 text-xs uppercase font-bold">Total Prospek</p><h3 className="text-2xl font-bold text-gray-800">{stats?.total_prospects}</h3></div></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center"><div className="p-3 bg-green-100 rounded-full text-green-600 mr-4"><FaCheckCircle size={20} /></div><div><p className="text-gray-500 text-xs uppercase font-bold">Processed</p><h3 className="text-2xl font-bold text-gray-800">{stats?.processed}</h3></div></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center"><div className="p-3 bg-orange-100 rounded-full text-orange-600 mr-4"><FaChartLine size={20} /></div><div><p className="text-gray-500 text-xs uppercase font-bold">High Priority</p><h3 className="text-2xl font-bold text-gray-800">{stats?.high_priority}</h3></div></div>
            </div>

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
                        {/* Tombol Hapus Pilihan (Page Ini) */}
                        {selectedIds.length > 0 && (
                            <button onClick={() => handleBatchDelete('selection')} className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200 transition">
                                <FaTrash /> Hapus {selectedIds.length} Terpilih (Page Ini)
                            </button>
                        )}
                        {/* Tombol Hapus Semua (Filtered) */}
                        <button onClick={() => handleBatchDelete('all_filtered')} className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded text-xs font-bold hover:bg-gray-900 transition">
                            <FaExclamationCircle /> Hapus Semua {filterStatus ? `(${filterStatus})` : 'Data'}
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
                                    <input id="file-upload" type="file" onChange={e => setDataImport('csv_file', e.target.files[0])} accept=".csv" className="block w-full text-xs text-slate-500 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                    <button type="submit" disabled={processingImport || !dataImport.csv_file} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 disabled:opacity-50"><FaCloudUploadAlt /> Import</button>
                                </form>
                                {/* Tombol Prediksi */}
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
                                    {/* Checkbox All */}
                                    <th className="px-4 py-3 text-center sticky left-0 bg-gray-100 z-20 border-r border-gray-100 w-10">
                                        <input type="checkbox" onChange={handleSelectAll} checked={prospects.data.length > 0 && selectedIds.length === prospects.data.length} className="rounded text-blue-600 focus:ring-blue-500" />
                                    </th>
                                    <th className="px-4 py-3 text-center sticky left-10 bg-gray-100 z-20 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-24">Action</th>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Score</th>
                                    <th className="px-4 py-3">Priority</th>
                                    <th className="px-4 py-3">Age</th>
                                    <th className="px-4 py-3">Job</th>
                                    <th className="px-4 py-3">Education</th>
                                    <th className="px-4 py-3">Month</th>
                                    <th className="px-4 py-3">Duration</th>
                                    <th className="px-4 py-3 text-center">Campaign</th>
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
                                            onDelete={handleDeleteSingle}
                                        />
                                    ))
                                ) : (
                                    <tr><td colSpan="18" className="px-6 py-10 text-center text-gray-500">Data kosong.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-between items-center bg-gray-50">
                        <span className="text-xs text-gray-500">Page {prospects.current_page} of {prospects.last_page}</span>
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
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, usePage, useForm, Link, router } from '@inertiajs/react';
import { 
    FaChartLine, FaRobot, FaCloudUploadAlt, 
    FaCheckCircle, FaExclamationCircle, FaSave, FaEdit, FaTimes, FaPlus,
    FaTrash, FaFilter, FaSpinner,
    FaDatabase, FaCalendarDay, FaChartPie, FaExclamationTriangle,
    FaFire, FaPhoneAlt, FaStopwatch, FaRegCalendarAlt, FaProjectDiagram,
    FaSort, FaSortUp, FaSortDown,
    FaCog, FaListUl, FaMoneyBillWave, FaCheckDouble
} from 'react-icons/fa';
import { useState, useEffect } from 'react';

// --- COMPONENTS (Tidak Berubah) ---

const PerformanceCard = ({ title, value, unit, subtext, icon: Icon, theme }) => {
    const themes = {
        red: { bg: 'bg-red-50', border: 'border-red-100', textTitle: 'text-gray-700', textVal: 'text-red-600', iconBg: 'bg-white', iconColor: 'text-red-500' },
        blue: { bg: 'bg-blue-50', border: 'border-blue-100', textTitle: 'text-gray-700', textVal: 'text-blue-600', iconBg: 'bg-white', iconColor: 'text-blue-500' },
        green: { bg: 'bg-green-50', border: 'border-green-100', textTitle: 'text-gray-700', textVal: 'text-green-600', iconBg: 'bg-white', iconColor: 'text-green-500' },
    };
    const t = themes[theme] || themes.blue;
    return (
        <div className={`p-6 rounded-xl border ${t.border} ${t.bg} shadow-sm relative overflow-hidden transition-transform hover:scale-[1.01]`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className={`text-sm font-bold ${t.textTitle}`}>{title}</h3>
                <div className={`p-2 rounded-full shadow-sm ${t.iconBg} ${t.iconColor}`}><Icon size={16} /></div>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-4xl font-extrabold ${t.textVal}`}>{value}</span>
                <span className="text-sm font-medium text-gray-500">{unit}</span>
            </div>
            <p className="text-xs text-gray-500 font-medium">{subtext}</p>
        </div>
    );
};

const PipelineStatusCard = ({ title, count, description, statusType }) => {
    const config = {
        'CONTACTED': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', defaultDesc: 'Sudah ditelepon, belum ada keputusan' },
        'INTERESTED': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', defaultDesc: 'Nasabah tertarik, butuh follow up' },
        'ACCEPTED': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', defaultDesc: 'Nasabah setuju mendaftar' },
        'REFUSED': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', defaultDesc: 'Nasabah menolak penawaran' },
        'NO_ANSWER': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', defaultDesc: 'Telepon tidak diangkat berkali-kali' },
        'INVALID_NUMBER': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', defaultDesc: 'Nomor telepon salah/tidak terdaftar' }
    };
    const style = config[title.toUpperCase().replace(' ', '_')] || config[title.toUpperCase()] || { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-700', defaultDesc: 'Status prospek' };
    return (
        <div className={`p-4 rounded-lg border ${style.border} ${style.bg} h-full flex flex-col justify-between shadow-sm`}>
            <div>
                <h4 className={`text-[11px] font-bold uppercase tracking-wider ${style.text} mb-2`}>{title}</h4>
                <div className="text-3xl font-extrabold text-gray-800 mb-2">{count}</div>
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">{description || style.defaultDesc}</p>
        </div>
    );
};

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

const FloatingToast = ({ flash, errors }) => {
    const [show, setShow] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    useEffect(() => {
        if (flash.success) { setMsg({ type: 'success', text: flash.success }); setShow(true); } 
        else if (flash.error) { setMsg({ type: 'error', text: flash.error }); setShow(true); } 
        else if (errors && Object.keys(errors).length > 0) { const firstErrorKey = Object.keys(errors)[0]; setMsg({ type: 'error', text: errors[firstErrorKey] }); setShow(true); } 
        else { setShow(false); }
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
        message = `Anda akan menghapus SEMUA data (${count} Data) yang sesuai dengan filter "${statusName || 'Semua Status'}" & "Semua Prioritas". Tindakan ini tidak dapat dibatalkan!`;
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-red-100 p-4 rounded-full mb-4"><FaExclamationTriangle className="text-3xl text-red-600" /></div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">{message}</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors">Batal</button>
                        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2">
                            <FaTrash size={14} /> Hapus
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ConfigurationModal = ({ isOpen, onClose, template }) => {
    const { data, setData, post, processing } = useForm({ defaults: template?.defaults || {}, dropdowns: template?.dropdowns || { jobs: [], education: [] } });
    if (!isOpen) return null;
    const handleSubmit = (e) => { e.preventDefault(); post(route('dashboard.update-configuration'), { onSuccess: () => onClose(), preserveScroll: true }); };
    const handleArrayChange = (category, index, value) => { const newArray = [...data.dropdowns[category]]; newArray[index] = value; setData('dropdowns', { ...data.dropdowns, [category]: newArray }); };
    const removeArrayItem = (category, index) => { const newArray = data.dropdowns[category].filter((_, i) => i !== index); setData('dropdowns', { ...data.dropdowns, [category]: newArray }); };
    const addArrayItem = (category) => { const newArray = [...data.dropdowns[category], '']; setData('dropdowns', { ...data.dropdowns, [category]: newArray }); };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black bg-opacity-60 overflow-y-auto p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col transform transition-all scale-100">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3"><FaCog className="text-blue-600 text-3xl" /> Konfigurasi Template Form</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors bg-white p-2 rounded-full shadow-sm"><FaTimes size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10">
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                        <h4 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2 border-b border-blue-200 pb-3"><FaMoneyBillWave className="text-xl" /> Nilai Indikator Ekonomi (Default)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[{ label: 'Cons. Price Idx', key: 'cons_price_idx' }, { label: 'Cons. Conf. Idx', key: 'cons_conf_idx' }, { label: 'Euribor 3M', key: 'euribor3m' }, { label: 'Nr. Employed', key: 'nr_employed' }].map((field) => (
                                <div key={field.key}>
                                    <label className="text-sm font-bold text-gray-600 block mb-2">{field.label}</label>
                                    <input type="number" step="0.001" value={data.defaults[field.key]} onChange={e => setData('defaults', {...data.defaults, [field.key]: e.target.value})} className="w-full text-lg font-medium text-gray-800 rounded-lg border-gray-300 focus:ring-blue-500 py-3 px-4 shadow-sm" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="border border-gray-200 rounded-xl p-6 shadow-sm">
                             <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3"><FaListUl className="text-blue-600" /> Daftar Pekerjaan (Job)</h4>
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-3 custom-scrollbar">
                                {data.dropdowns.jobs.map((job, idx) => (
                                    <div key={idx} className="flex gap-3 items-center">
                                        <span className="text-gray-400 font-mono text-sm w-6">{idx+1}.</span>
                                        <input type="text" value={job} onChange={e => handleArrayChange('jobs', idx, e.target.value)} className="flex-1 text-base rounded-lg border-gray-300 py-2 px-3 focus:ring-blue-500" />
                                        <button type="button" onClick={() => removeArrayItem('jobs', idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><FaTrash size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => addArrayItem('jobs')} className="mt-5 w-full py-3 text-sm font-bold border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition">+ Tambah Job Baru</button>
                        </div>
                        <div className="border border-gray-200 rounded-xl p-6 shadow-sm">
                             <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3"><FaListUl className="text-green-600" /> Daftar Pendidikan (Education)</h4>
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-3 custom-scrollbar">
                                {data.dropdowns.education.map((edu, idx) => (
                                    <div key={idx} className="flex gap-3 items-center">
                                        <span className="text-gray-400 font-mono text-sm w-6">{idx+1}.</span>
                                        <input type="text" value={edu} onChange={e => handleArrayChange('education', idx, e.target.value)} className="flex-1 text-base rounded-lg border-gray-300 py-2 px-3 focus:ring-blue-500" />
                                        <button type="button" onClick={() => removeArrayItem('education', idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><FaTrash size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => addArrayItem('education')} className="mt-5 w-full py-3 text-sm font-bold border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition">+ Tambah Education Baru</button>
                        </div>
                    </div>
                </form>
                <div className="p-6 border-t bg-gray-50 flex justify-end gap-4 rounded-b-2xl">
                    <button onClick={onClose} className="px-6 py-3 text-base font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition">Batal</button>
                    <button onClick={handleSubmit} disabled={processing} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition flex items-center gap-3">{processing ? <FaSpinner className="animate-spin text-xl" /> : <FaSave className="text-xl" />} Simpan Konfigurasi</button>
                </div>
            </div>
        </div>
    );
};

const InputGroup = ({ label, type = "text", placeholder, value, onChange, error }) => (
    <div className="flex flex-col">
        <label className="text-sm font-bold text-gray-700 mb-1.5 capitalize">{label} <span className="text-red-500">*</span></label>
        <input type={type} value={value} onChange={onChange} className="text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 shadow-sm" placeholder={placeholder} />
        {error && <span className="text-red-500 text-xs mt-1 font-medium">{error}</span>}
    </div>
);

const SelectGroup = ({ label, options, value, onChange, error }) => (
    <div className="flex flex-col">
        <label className="text-sm font-bold text-gray-700 mb-1.5 capitalize">{label} <span className="text-red-500">*</span></label>
        <select value={value} onChange={onChange} className="text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 bg-white shadow-sm">
            {options.map((opt) => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
        </select>
        {error && <span className="text-red-500 text-xs mt-1 font-medium">{error}</span>}
    </div>
);

const OPT_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const OPT_POUTCOME = ['nonexistent', 'failure', 'success'];

const CreateProspectModal = ({ isOpen, onClose, template }) => {
    const defaults = template?.defaults || {};
    const dropdowns = template?.dropdowns || { jobs: [], education: [] };
    const { data, setData, post, processing, reset, errors } = useForm({
        age: '', job: dropdowns.jobs[0] || '', education: dropdowns.education[0] || '', month: 'may', duration: '', campaign: defaults.campaign || '', poutcome: 'nonexistent', 
        cons_price_idx: defaults.cons_price_idx || '', cons_conf_idx: defaults.cons_conf_idx || '', euribor3m: defaults.euribor3m || '', nr_employed: defaults.nr_employed || ''
    });

    useEffect(() => {
        if(isOpen) {
            setData({
                age: '', job: dropdowns.jobs[0] || '', education: dropdowns.education[0] || '', month: 'may', duration: '', campaign: defaults.campaign || '', poutcome: 'nonexistent', 
                cons_price_idx: defaults.cons_price_idx || '', cons_conf_idx: defaults.cons_conf_idx || '', euribor3m: defaults.euribor3m || '', nr_employed: defaults.nr_employed || ''
            });
        }
    }, [isOpen, template]);

    if (!isOpen) return null;
    const handleSubmit = (e) => { e.preventDefault(); post(route('dashboard.store'), { onSuccess: () => { reset(); onClose(); } }); };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 overflow-y-auto p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl m-4 p-8 relative transform transition-all">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition"><FaTimes size={20} /></button>
                <h3 className="text-2xl font-bold text-gray-800 mb-8 border-b pb-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><FaPlus size={24} /></div> Tambah Prospek Manual
                </h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-5">
                        <InputGroup label="Age (Umur)" type="number" value={data.age} onChange={e => setData('age', e.target.value)} error={errors.age} />
                        <SelectGroup label="Job (Pekerjaan)" options={dropdowns.jobs} value={data.job} onChange={e => setData('job', e.target.value)} error={errors.job} />
                        <SelectGroup label="Education (Pendidikan)" options={dropdowns.education} value={data.education} onChange={e => setData('education', e.target.value)} error={errors.education} />
                        <SelectGroup label="Month (Bulan)" options={OPT_MONTHS} value={data.month} onChange={e => setData('month', e.target.value)} error={errors.month} />
                        <SelectGroup label="Poutcome (Hasil Sebelumnya)" options={OPT_POUTCOME} value={data.poutcome} onChange={e => setData('poutcome', e.target.value)} error={errors.poutcome} />
                    </div>
                    <div className="space-y-5">
                        <InputGroup label="Duration (Durasi Detik)" type="number" value={data.duration} onChange={e => setData('duration', e.target.value)} error={errors.duration} />
                        <InputGroup label="Campaign (Jumlah Kontak)" type="number" value={data.campaign} onChange={e => setData('campaign', e.target.value)} error={errors.campaign} />
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Indikator Ekonomi</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Cons. Price Idx" type="number" value={data.cons_price_idx} onChange={e => setData('cons_price_idx', e.target.value)} error={errors.cons_price_idx} />
                                <InputGroup label="Cons. Conf. Idx" type="number" value={data.cons_conf_idx} onChange={e => setData('cons_conf_idx', e.target.value)} error={errors.cons_conf_idx} />
                                <InputGroup label="Euribor 3M" type="number" value={data.euribor3m} onChange={e => setData('euribor3m', e.target.value)} error={errors.euribor3m} />
                                <InputGroup label="Nr. Employed" type="number" value={data.nr_employed} onChange={e => setData('nr_employed', e.target.value)} error={errors.nr_employed} />
                            </div>
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 flex justify-end gap-4 mt-6 pt-6 border-t">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-base font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition">Batal</button>
                        <button type="submit" disabled={processing} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold rounded-xl shadow-lg flex items-center gap-3 transition hover:shadow-xl">
                            {processing ? 'Menyimpan...' : <><FaSave size={18} /> Simpan Data</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ProspectRow = ({ item, isAdmin, isSelected, onToggleSelect, onDeleteRequest, template }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [values, setValues] = useState({ ...item });
    const dropdowns = template?.dropdowns || { jobs: [], education: [] };
    const handleChange = (e) => setValues({ ...values, [e.target.name]: e.target.value });
    const handleSave = () => { router.put(route('dashboard.update', item.id), values, { preserveScroll: true, onSuccess: () => setIsEditing(false), }); };
    const handleCancel = () => { setValues({ ...item }); setIsEditing(false); };
    const renderCell = (name, type = "text", width = "w-24", options = null) => {
        if (isEditing) {
            if (options) return <select name={name} value={values[name]} onChange={handleChange} className={`text-xs border-gray-300 rounded px-1 py-1 shadow-sm ${width}`}>{options.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}</select>;
            return <input type={type} name={name} value={values[name]} onChange={handleChange} className={`text-xs border-gray-300 rounded px-2 py-1 shadow-sm ${width}`} />;
        }
        return <span className="text-gray-700">{item[name]}</span>;
    };

    return (
        <tr className={`hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${isSelected ? 'bg-blue-50' : ''}`}>
            <td className="px-4 py-3 text-center sticky left-0 bg-white hover:bg-gray-50 z-20 border-r border-gray-100 w-10">
                <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(item.id)} className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"/>
            </td>
            <td className="px-4 py-3 text-center sticky left-10 bg-white hover:bg-gray-50 z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-24">
                {isEditing ? (
                    <div className="flex justify-center items-center gap-1">
                        <button onClick={handleSave} className="text-green-600 p-1 hover:bg-green-100 rounded"><FaSave /></button>
                        <button onClick={handleCancel} className="text-red-500 p-1 hover:bg-red-100 rounded"><FaTimes /></button>
                    </div>
                ) : (
                    <div className="flex justify-center items-center gap-1">
                        <button onClick={() => setIsEditing(true)} className="text-blue-500 p-1.5 hover:bg-blue-100 rounded" title="Edit"><FaEdit /></button>
                        {isAdmin && <button onClick={() => onDeleteRequest(item.id)} className="text-red-500 p-1.5 hover:bg-red-100 rounded" title="Hapus"><FaTrash size={12}/></button>}
                    </div>
                )}
            </td>
            <td className="px-4 py-3 text-gray-500 text-xs font-mono">#{item.id}</td>
            <td className="px-4 py-3"><span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span></td>
            <td className="px-4 py-3 font-bold text-blue-600">{item.score !== null ? (item.score * 100).toFixed(3) + '%' : <span className="text-[10px] text-gray-400 italic">Waiting..</span>}</td>
            <td className="px-4 py-3">
                {item.priority === 1 && <span className="bg-green-500 text-white px-2 py-0.5 rounded text-[10px]">HIGH</span>}
                {item.priority === 2 && <span className="bg-yellow-500 text-white px-2 py-0.5 rounded text-[10px]">MED</span>}
                {item.priority === 3 && <span className="bg-gray-400 text-white px-2 py-0.5 rounded text-[10px]">LOW</span>}
            </td>
            <td className="px-4 py-3">{renderCell('age', 'number', 'w-16')}</td>
            <td className="px-4 py-3">{renderCell('job', 'text', 'w-32', dropdowns.jobs)}</td>
            <td className="px-4 py-3">{renderCell('education', 'text', 'w-36', dropdowns.education)}</td>
            <td className="px-4 py-3 uppercase">{renderCell('month', 'text', 'w-20', OPT_MONTHS)}</td>
            <td className="px-4 py-3">{renderCell('duration', 'number', 'w-20')}</td>
            <td className="px-4 py-3">{renderCell('campaign', 'number', 'w-16')}</td>
            <td className="px-4 py-3">{renderCell('poutcome', 'text', 'w-20', OPT_POUTCOME)}</td>
            
            <td className="px-4 py-3">{renderCell('cons_price_idx', 'number', 'w-20')}</td>
            <td className="px-4 py-3">{renderCell('cons_conf_idx', 'number', 'w-20')}</td>
            <td className="px-4 py-3">{renderCell('euribor3m', 'number', 'w-20')}</td>
            <td className="px-4 py-3">{renderCell('nr_employed', 'number', 'w-20')}</td>
            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{item.scored_at || '-'}</td>
            
            {/* UPDATE: Kolom Baru Assigned To */}
            <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{item.assigned_to}</td>

            {/* UPDATE: Kolom Baru Scored By */}
            <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{item.scored_by || '-'}</td>
        </tr>
    );
};

// --- MAIN PAGE COMPONENT ---

export default function Dashboard({ stats, prospects, statusOptions = [], filters = {}, personalStats, pipelineStats, formTemplate }) {
    const { auth, flash, errors } = usePage().props;
    const isAdmin = auth.user.role === 'admin';
    const isSales = auth.user.role === 'sales';

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isConfigModalOpen, setConfigModalOpen] = useState(false); 
    
    const [filterStatus, setFilterStatus] = useState(filters.status || '');
    const [filterPriority, setFilterPriority] = useState(filters.priority || '');

    const [sortField, setSortField] = useState(filters.sort_field || 'id');
    const [sortDirection, setSortDirection] = useState(filters.sort_direction || 'desc');
    const [selectedIds, setSelectedIds] = useState([]);
    
    // STATE BARU: Untuk Pilih Semua Data (Filtered)
    const [selectAllMatching, setSelectAllMatching] = useState(false);
    
    const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, type: '', targetId: null });
    const [isDeleting, setIsDeleting] = useState(false); 

    useEffect(() => { 
        setSelectedIds([]); 
        setSelectAllMatching(false); // Reset pilihan semua saat filter/page berubah
    }, [filterStatus, filterPriority, sortField, sortDirection, prospects.current_page]);
    
    const handleFilterChange = (key, value) => {
        let newStatus = key === 'status' ? value : filterStatus;
        let newPriority = key === 'priority' ? value : filterPriority;
        
        // LOGIC BARU: Reset sort jika priority jadi 'Semua'
        let newSortField = sortField;
        let newSortDirection = sortDirection;

        if (key === 'priority' && value === '') {
            newSortField = 'score';
            newSortDirection = 'desc';
            setSortField('score');
            setSortDirection('desc');
        }

        if (key === 'status') setFilterStatus(value);
        if (key === 'priority') setFilterPriority(value);

        router.get(route('dashboard'), { 
            status: newStatus, 
            priority: newPriority,
            sort_field: newSortField, 
            sort_direction: newSortDirection 
        }, { preserveState: true, replace: true });
    };

    const handleSort = (field) => {
        let newDirection = 'asc';
        if (sortField === field) {
            newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        }
        setSortField(field);
        setSortDirection(newDirection);

        router.get(route('dashboard'), {
            status: filterStatus,
            priority: filterPriority,
            sort_field: field,
            sort_direction: newDirection
        }, { preserveState: true });
    };

    const renderSortIcon = (field) => {
        if (sortField !== field) return <FaSort className="inline ml-1 text-gray-400 text-[10px]" />;
        return sortDirection === 'asc' ? <FaSortUp className="inline ml-1 text-blue-600" /> : <FaSortDown className="inline ml-1 text-blue-600" />;
    };

    const currentPageIds = prospects.data.map(p => p.id);
    const isAllCurrentPageSelected = !selectAllMatching && currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.includes(id));

    const handleSelectAllCurrentPage = (e) => {
        // Jika sedang mode Select All Matching, matikan dulu
        if (selectAllMatching) {
            setSelectAllMatching(false);
            setSelectedIds([]);
            return;
        }

        if (e.target.checked) {
            const newSelection = [...new Set([...selectedIds, ...currentPageIds])];
            setSelectedIds(newSelection);
        } else {
            const newSelection = selectedIds.filter(id => !currentPageIds.includes(id));
            setSelectedIds(newSelection);
        }
    };

    const toggleSelectAllMatching = () => {
        if (selectAllMatching) {
            setSelectAllMatching(false);
            setSelectedIds([]);
        } else {
            setSelectAllMatching(true);
            setSelectedIds([]); // Clear individual IDs karena kita pakai mode 'ALL'
        }
    };

    const handleSelectRow = (id) => {
        // Jika sedang Select All Matching, user mencoba uncheck satu row -> Matikan mode ALL
        if (selectAllMatching) {
            setSelectAllMatching(false);
            // Opsional: Logic kompleks untuk "Select All EXCEPT one" bisa ditambahkan disini, 
            // tapi untuk simpel, kita reset saja.
            return;
        }

        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id));
        else setSelectedIds([...selectedIds, id]);
    };

    const requestDeleteSingle = (id) => {
        setDeleteModalState({ isOpen: true, type: 'single', targetId: id });
    };

    const requestDeleteSelection = () => {
        if (selectAllMatching) {
             // Logic Hapus Semua Data (Filtered)
             setDeleteModalState({ isOpen: true, type: 'all_filtered', statusName: filterStatus, count: prospects.total });
        } else {
             // Logic Hapus Selection Biasa
             setDeleteModalState({ isOpen: true, type: 'selection', count: selectedIds.length });
        }
    };

    const confirmDelete = () => {
        const { type, targetId } = deleteModalState;
        const currentSelection = [...selectedIds]; 
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
                ids: currentSelection, 
                status: filterStatus // Kirim status agar backend tau apa yg dihapus jika type=all_filtered
            }, {
                preserveScroll: true,
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteModalState({ isOpen: false, type: '', targetId: null });
                    if(type === 'selection' || type === 'all_filtered') {
                        setSelectedIds([]);
                        setSelectAllMatching(false);
                    }
                }
            });
        }
    };

    const { data: dataImport, setData: setDataImport, post: postImport, processing: processingImport, reset: resetImport, errors: errorsImport } = useForm({ csv_file: null });
    const { post: postPredict, processing: processingPredict } = useForm({});
    
    const submitImport = (e) => { 
        e.preventDefault(); 
        postImport(route('dashboard.import'), { 
            forceFormData: true, preserveScroll: true,
            onSuccess: () => { resetImport(); const fileInput = document.getElementById('file-upload'); if(fileInput) fileInput.value = ''; }
        }); 
    };
    
    const submitPredict = (e) => { e.preventDefault(); postPredict(route('dashboard.run-predictions'), { preserveScroll: true }); };

    useEffect(() => { document.body.style.zoom = "67%"; return () => { document.body.style.zoom = "100%"; }; }, []);

    return (
        <SidebarLayout header={isSales ? "Sales Dashboard" : "Administrator Dashboard"}>
            <Head title="Dashboard" />
            
            <FloatingToast flash={flash} errors={errors} />

            <LoadingOverlay 
                isVisible={processingPredict || processingImport || isDeleting} 
                mode={isDeleting ? 'delete' : (processingImport ? 'import' : 'predict')} 
            />

            <CreateProspectModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} template={formTemplate} />
            <ConfigurationModal isOpen={isConfigModalOpen} onClose={() => setConfigModalOpen(false)} template={formTemplate} />
            
            <DeleteConfirmModal 
                isOpen={deleteModalState.isOpen} 
                onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })} 
                onConfirm={confirmDelete}
                type={deleteModalState.type}
                count={deleteModalState.count}
                statusName={deleteModalState.statusName}
            />

            {isSales && personalStats && pipelineStats && (
                <div className="mb-8 space-y-8 animate-fade-in-up">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-500"><FaChartLine /><h3 className="text-sm font-bold uppercase tracking-wider">Kinerja Anda Hari Ini</h3></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <PerformanceCard title="Target Prioritas" value={personalStats.hot_leads} unit="Prospek" subtext="NEW  & High Prioritas" icon={FaFire} theme="red" />
                            <PerformanceCard title="Aktivitas Anda" value={personalStats.calls_today} unit="Call" subtext="Log tersimpan hari ini" icon={FaRegCalendarAlt} theme="blue" />
                            <PerformanceCard title="Durasi Bicara" value={personalStats.duration_min} unit="Menit" subtext="Total durasi telepon hari ini" icon={FaStopwatch} theme="green" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-500"><FaProjectDiagram /><h3 className="text-sm font-bold uppercase tracking-wider">Global Pipeline Overview</h3></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {pipelineStats.length > 0 ? (
                                pipelineStats.map((stat, idx) => ( <PipelineStatusCard key={idx} title={stat.code} count={stat.count} statusType={stat.code} /> ))
                            ) : (
                                <div className="col-span-6 text-center text-gray-400 text-sm py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">Belum ada data pipeline hari ini.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isAdmin && (
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><FaChartPie/> Data Summary (System)</h3>
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
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <FaFilter className="text-gray-400" />
                            <select value={filterStatus} onChange={(e) => handleFilterChange('status', e.target.value)} className="border-gray-300 rounded text-sm w-full md:w-48 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Semua Status</option>
                                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <FaFire className="text-gray-400" />
                            <select value={filterPriority} onChange={(e) => handleFilterChange('priority', e.target.value)} className="border-gray-300 rounded text-sm w-full md:w-40 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Semua Prioritas</option>
                                <option value="1">High (1)</option>
                                <option value="2">Medium (2)</option>
                                <option value="3">Low (3)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto justify-end">
                        {/* TOMBOL PILIH SEMUA (FILTERED) */}
                        <button 
                            onClick={toggleSelectAllMatching}
                            className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-bold transition border
                                ${selectAllMatching 
                                    ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' 
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <FaCheckDouble /> {selectAllMatching ? 'Batalkan Pilih Semua' : `Pilih Semua ${prospects.total} Data`}
                        </button>

                        {/* TOMBOL HAPUS (DINAMIS) */}
                        <button 
                            onClick={requestDeleteSelection} 
                            disabled={selectedIds.length === 0 && !selectAllMatching}
                            className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-bold transition
                                ${selectedIds.length > 0 || selectAllMatching
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200 animate-fade-in' 
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <FaTrash /> 
                            {selectAllMatching 
                                ? `Hapus Semua (${prospects.total} Data)` 
                                : `Hapus ${selectedIds.length > 0 ? `${selectedIds.length} Terpilih` : 'Terpilih'}`
                            }
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow-sm sm:rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-wrap gap-2">
                        <div className="flex flex-col xl:flex-row gap-4 items-center w-full">
                            <h3 className="text-base font-bold text-gray-800 whitespace-nowrap">Daftar Prospek</h3>
                            
                            <div className="flex flex-col md:flex-row gap-2 w-full justify-end">
                                <button onClick={() => setConfigModalOpen(true)} className="bg-white border border-gray-400 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 justify-center">
                                    <FaCog /> Config
                                </button>
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
                                    <th className="px-4 py-3 text-center sticky left-0 bg-gray-100 z-20 border-r border-gray-100 w-10">
                                        <input 
                                            type="checkbox" 
                                            onChange={handleSelectAllCurrentPage} 
                                            checked={isAllCurrentPageSelected || selectAllMatching} 
                                            disabled={selectAllMatching}
                                            className={`rounded focus:ring-blue-500 ${selectAllMatching ? 'text-blue-400 cursor-not-allowed opacity-70' : 'text-blue-600 cursor-pointer'}`}
                                            title="Pilih semua di halaman ini"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-center sticky left-10 bg-gray-100 z-20 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-24">Action</th>
                                    
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
                                    
                                    {/* UPDATE: Header Baru Assigned To */}
                                    <th className="px-4 py-3">Assigned To</th>

                                    {/* UPDATE: Header Baru Scored By */}
                                    <th className="px-4 py-3">Scored By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {prospects.data.length > 0 ? (
                                    prospects.data.map((item) => (
                                        <ProspectRow 
                                            key={item.id} 
                                            item={item} 
                                            isAdmin={isAdmin}
                                            isSelected={selectedIds.includes(item.id) || selectAllMatching}
                                            onToggleSelect={handleSelectRow}
                                            onDeleteRequest={requestDeleteSingle}
                                            template={formTemplate} 
                                        />
                                    ))
                                ) : (
                                    <tr><td colSpan="20" className="px-6 py-10 text-center text-gray-500">Data kosong.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-between items-center bg-gray-50">
                        <span className="text-xs text-gray-500">
                            Page {prospects.current_page} of {prospects.last_page} | 
                            <span className="ml-2 font-bold text-blue-600">
                                Total Terpilih: {selectAllMatching ? prospects.total : selectedIds.length}
                            </span>
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
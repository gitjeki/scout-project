import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router, Link } from '@inertiajs/react';
import { FaEdit, FaSave, FaTimes, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { useState, useEffect } from 'react';

// --- OPTIONS CONSTANTS (Sama dengan Dashboard) ---
const OPT_JOBS = ['admin.', 'services', 'management', 'blue-collar', 'entrepreneur', 'student', 'technician', 'housemaid', 'self-employed', 'unemployed', 'retired'];
const OPT_EDUCATION = ['basic.4y', 'basic.6y', 'basic.9y', 'high.school', 'professional.course', 'university.degree', 'illiterate', 'unknown'];
const OPT_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const OPT_POUTCOME = ['nonexistent', 'failure', 'success'];

// --- ROW COMPONENT KHUSUS DATA CONTROL ---
const ControlRow = ({ item }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [values, setValues] = useState({ ...item });

    const handleChange = (e) => setValues({ ...values, [e.target.name]: e.target.value });

    const handleSave = () => {
        router.put(route('dashboard.update', item.id), values, {
            preserveScroll: true,
            onSuccess: () => setIsEditing(false),
        });
    };

    const handleDelete = () => {
        if(confirm('Hapus data ini permanen?')) {
            router.delete(route('dashboard.destroy', item.id));
        }
    };

    const renderCell = (name, type = "text", width = "w-24", options = null) => {
        const isNull = item[name] === null || item[name] === '';
        
        if (isEditing) {
            if (options) {
                return <select name={name} value={values[name] || ''} onChange={handleChange} className={`text-xs border-gray-300 rounded px-1 py-1 shadow-sm ${width} ${isNull ? 'border-red-500 bg-red-50' : ''}`}>
                    <option value="">-- Pilih --</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                </select>;
            }
            return <input type={type} name={name} value={values[name] || ''} onChange={handleChange} className={`text-xs border-gray-300 rounded px-2 py-1 shadow-sm ${width} ${isNull ? 'border-red-500 bg-red-50' : ''}`} />;
        }
        
        if (isNull) {
            return <span className="text-red-500 font-bold text-[10px] bg-red-100 px-2 py-1 rounded flex items-center gap-1 justify-center border border-red-200"><FaExclamationTriangle/> NULL</span>;
        }
        return <span className="text-gray-700">{item[name]}</span>;
    };

    return (
        <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
            <td className="px-4 py-3 text-center sticky left-0 bg-white shadow-sm z-10 w-24 border-r border-gray-100">
                {isEditing ? (
                    <div className="flex justify-center items-center gap-2">
                        <button onClick={handleSave} className="text-green-600 p-1 hover:bg-green-100 rounded" title="Simpan"><FaSave /></button>
                        <button onClick={() => { setIsEditing(false); setValues({...item}); }} className="text-red-500 p-1 hover:bg-red-100 rounded" title="Batal"><FaTimes /></button>
                    </div>
                ) : (
                    <div className="flex justify-center items-center gap-2">
                        <button onClick={() => setIsEditing(true)} className="text-blue-500 p-1.5 hover:bg-blue-100 rounded" title="Edit Data"><FaEdit /></button>
                        <button onClick={handleDelete} className="text-red-500 p-1.5 hover:bg-red-100 rounded" title="Hapus"><FaTrash size={12}/></button>
                    </div>
                )}
            </td>
            <td className="px-4 py-3 text-gray-500 text-xs font-mono">#{item.id}</td>
            <td className="px-4 py-3 text-center">{renderCell('age', 'number', 'w-16')}</td>
            <td className="px-4 py-3 text-center">{renderCell('job', 'text', 'w-32', OPT_JOBS)}</td>
            <td className="px-4 py-3 text-center">{renderCell('education', 'text', 'w-36', OPT_EDUCATION)}</td>
            <td className="px-4 py-3 text-center uppercase">{renderCell('month', 'text', 'w-20', OPT_MONTHS)}</td>
            <td className="px-4 py-3 text-center">{renderCell('duration', 'number', 'w-20')}</td>
            <td className="px-4 py-3 text-center">{renderCell('campaign', 'number', 'w-16')}</td>
            <td className="px-4 py-3 text-center">{renderCell('poutcome', 'text', 'w-28', OPT_POUTCOME)}</td>
            <td className="px-4 py-3 text-center">{renderCell('cons_price_idx', 'number', 'w-20')}</td>
            <td className="px-4 py-3 text-center">{renderCell('cons_conf_idx', 'number', 'w-20')}</td>
            <td className="px-4 py-3 text-center">{renderCell('euribor3m', 'number', 'w-20')}</td>
            <td className="px-4 py-3 text-center">{renderCell('nr_employed', 'number', 'w-20')}</td>
        </tr>
    );
};

// --- MAIN PAGE ---
export default function DataControl({ prospects }) {
    
    // Zoom Otomatis 60%
    useEffect(() => { 
        document.body.style.zoom = "60%"; 
        return () => { 
            document.body.style.zoom = "100%"; 
        }; 
    }, []);

    return (
        <SidebarLayout header="Data Control (Fix Missing Values)">
            <Head title="Data Control" />

            {/* --- ALERT BOX SESUAI REQUEST (FONT DIPERBESAR) --- */}
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r shadow-sm">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <FaExclamationTriangle className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div className="ml-4">
                        {/* Mengubah text-sm menjadi text-base agar lebih besar */}
                        <p className="text-base text-yellow-800 leading-relaxed">
                            Halaman ini menampilkan data yang <b>tidak lengkap (NULL)</b>. 
                            Data di bawah ini <b>TIDAK AKAN</b> masuk proses prediksi AI sampai Anda melengkapi kolom yang kosong (bertanda merah).
                            Setelah dilengkapi, data otomatis pindah ke Dashboard utama.
                        </p>
                    </div>
                </div>
            </div>
            {/* -------------------------------- */}

            <div className="bg-white shadow-sm sm:rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                        <FaExclamationTriangle className="text-orange-500"/> 
                        Daftar Incomplete Data <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{prospects.total}</span>
                    </h3>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="min-w-full whitespace-nowrap text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold tracking-wider border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-center sticky left-0 bg-gray-100 z-10 w-24 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Action</th>
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3 text-center">Age</th>
                                <th className="px-4 py-3 text-center">Job</th>
                                <th className="px-4 py-3 text-center">Education</th>
                                <th className="px-4 py-3 text-center">Month</th>
                                <th className="px-4 py-3 text-center">Duration</th>
                                <th className="px-4 py-3 text-center">Campaign</th>
                                <th className="px-4 py-3 text-center">P.Out</th>
                                <th className="px-4 py-3 text-center">C.Price</th>
                                <th className="px-4 py-3 text-center">C.Conf</th>
                                <th className="px-4 py-3 text-center">Euribor3m</th>
                                <th className="px-4 py-3 text-center">N.Emp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {prospects.data.length > 0 ? (
                                prospects.data.map((item) => (
                                    <ControlRow key={item.id} item={item} />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="13" className="px-6 py-10 text-center text-green-600 font-bold bg-green-50">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <span>Semua data bersih! Tidak ada data kosong.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap justify-between items-center bg-gray-50">
                    <span className="text-xs text-gray-500">Page {prospects.current_page} of {prospects.last_page}</span>
                    <div className="flex gap-1">
                        {prospects.links.map((link, key) => (
                            <Link 
                                key={key} 
                                href={link.url || '#'} 
                                dangerouslySetInnerHTML={{ __html: link.label }} 
                                className={`px-3 py-1 text-xs border rounded transition shadow-sm ${link.active ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`} 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
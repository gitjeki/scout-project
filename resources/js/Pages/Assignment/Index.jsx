import React, { useState, useEffect } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/SidebarLayout';
import Modal from '@/Components/Modal'; 
import { FaPaperPlane, FaCheck, FaTimes, FaSearch, FaRedo } from 'react-icons/fa'; 

export default function AssignmentIndex({ prospects, salesAgents, statuses, filters, flash }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- STATE FILTER ---
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.filter_status || '');
    const [priorityFilter, setPriorityFilter] = useState(filters.filter_priority || ''); 
    const [assignedFilter, setAssignedFilter] = useState(filters.filter_assigned || 'unassigned');
    
    // --- IMPLEMENTASI ZOOM BODY & ANTI-F5 RESET (DIPERBAIKI) ---
    useEffect(() => {
        const navEntries = performance.getEntriesByType("navigation");
        if (navEntries.length > 0 && navEntries[0].type === "reload" && window.location.search) {
        }
    }, []);

    const { data, setData, post, processing, reset, errors } = useForm({
        sales_id: '',
        ids: []
    });

    // --- HANDLE FILTER CHANGE ---
    const handleFilter = () => {
        router.get(route('assignments.index'), { 
            search: search,
            filter_status: statusFilter,
            filter_priority: priorityFilter,
            filter_assigned: assignedFilter
        }, { 
            preserveState: true, 
            replace: true 
        });
    };

    // --- HANDLE RESET / REFRESH MANUAL ---
    const handleReset = () => {
        setSearch('');
        setStatusFilter('');
        setPriorityFilter('');
        setAssignedFilter('unassigned');
        router.get(route('assignments.index'));
    };

    // Trigger filter saat dropdown berubah
    useEffect(() => {
        if (
            statusFilter !== (filters.filter_status || '') || 
            assignedFilter !== (filters.filter_assigned || 'unassigned') ||
            priorityFilter !== (filters.filter_priority || '')
        ) {
            handleFilter();
        }
    }, [statusFilter, assignedFilter, priorityFilter]);

    // Handle Search Submit
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        handleFilter();
    };

    // --- HANDLE CHECKBOX ---
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = prospects.data.map(p => p.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // --- MODAL ACTION ---
    const openAssignModal = () => {
        if (selectedIds.length === 0) {
            alert('Select data first.!');
            return;
        }
        setData('ids', selectedIds);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const submitAssignment = (e) => {
        e.preventDefault();
        post(route('assignments.assign'), {
            onSuccess: () => {
                closeModal();
                setSelectedIds([]); 
            }
        });
    };

    // --- HELPER UI ---
    const getPriorityBadge = (priority) => {
        if (priority === 1) return <span className="px-2 py-1 text-xs font-bold text-white bg-green-500 rounded">High (1)</span>;
        if (priority === 2) return <span className="px-2 py-1 text-xs font-bold text-white bg-yellow-500 rounded">Medium (2)</span>;
        if (priority === 3) return <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded">Low (3)</span>;
        return <span className="px-2 py-1 text-xs text-gray-500 bg-gray-200 rounded">-</span>;
    };

    return (
        <SidebarLayout header="Prospect Assignment">
            <Head title="Assignment" />

            <div className="w-full">
                
                {/* Flash Message */}
                {flash.success && (
                    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
                        <FaCheck className="mr-2" /> {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
                        <FaTimes className="mr-2" /> {flash.error}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow p-6">
                    
                    {/* Toolbar & Filters */}
                    <div className="flex flex-col xl:flex-row justify-between items-center mb-6 gap-4">
                        
                        <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto flex-wrap">
                            {/* Search */}
                            <form onSubmit={handleSearchSubmit} className="flex gap-2">
                                <input 
                                    type="text"
                                    placeholder="Search ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-full md:w-32"
                                />
                                <button type="submit" className="bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-3 text-gray-600">
                                    <FaSearch />
                                </button>
                            </form>

                            {/* Filter Status */}
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer w-full md:w-auto"
                            >
                                <option value="">All Status</option>
                                {statuses.map((s, idx) => (
                                    <option key={idx} value={s.status_code}>{s.status_code}</option>
                                ))}
                            </select>

                            {/* Filter Priority */}
                            <select 
                                value={priorityFilter} 
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer w-full md:w-auto"
                            >
                                <option value="">All Priority</option>
                                <option value="1">High (1)</option>
                                <option value="2">Medium (2)</option>
                                <option value="3">Low (3)</option>
                            </select>

                            {/* Filter Assigned To */}
                            <select 
                                value={assignedFilter} 
                                onChange={(e) => setAssignedFilter(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer w-full md:w-auto"
                            >
                                <option value="unassigned">-- Unassigned --</option>
                                <option value="assigned">All Telemarketer</option>
                                {salesAgents.map((agent) => (
                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                ))}
                            </select>

                            {/* Reset Button */}
                            <button 
                                onClick={handleReset}
                                title="Reset Filter"
                                className="bg-white border border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-orange-600 px-3 py-2 rounded text-sm transition flex items-center justify-center gap-1"
                            >
                                <FaRedo /> <span className="hidden md:inline">Reset</span>
                            </button>
                        </div>
                        
                        {/* Action Buttons & Info */}
                        <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-end">
                            <div className="text-gray-600 text-sm">
                                Total: {prospects.total} | 
                                <span className="ml-1 font-bold text-orange-600">
                                    {selectedIds.length} chosen
                                </span>
                            </div>
                            
                            <button
                                onClick={openAssignModal}
                                disabled={selectedIds.length === 0}
                                className={`flex items-center px-4 py-2 rounded shadow text-white font-medium transition
                                    ${selectedIds.length > 0 
                                        ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer' 
                                        : 'bg-gray-300 cursor-not-allowed'}`}
                            >
                                <FaPaperPlane className="mr-2" />
                                Assign
                            </button>
                        </div>
                    </div>

                    {/* Tabel */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 border border-gray-200">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                                <tr>
                                    <th scope="col" className="p-4 w-4">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                                            onChange={handleSelectAll}
                                            checked={prospects.data.length > 0 && selectedIds.length === prospects.data.length}
                                        />
                                    </th>
                                    <th className="px-6 py-3">ID</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Score (Desc)</th>
                                    <th className="px-6 py-3">Priority</th>
                                    <th className="px-6 py-3">Scored At</th>
                                    <th className="px-6 py-3">Scored By</th>
                                    <th className="px-6 py-3">Assign Info</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prospects.data.length > 0 ? (
                                    prospects.data.map((item) => (
                                        <tr key={item.id} className={`bg-white border-b hover:bg-orange-50 ${selectedIds.includes(item.id) ? 'bg-orange-50' : ''}`}>
                                            <td className="w-4 p-4">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => handleSelectOne(item.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.id}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-lg text-gray-800">
                                                {item.score ? (item.score * 100).toFixed(3) + '%' : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getPriorityBadge(item.priority)}
                                            </td>
                                            <td className="px-6 py-4">{item.scored_at}</td>
                                            <td className="px-6 py-4">{item.scored_by}</td>
                                            <td className="px-6 py-4">
                                                {item.assigned_to ? (
                                                    <span className="text-green-600 font-medium">{item.assigned_to}</span>
                                                ) : (
                                                    <span className="text-gray-400">Unassigned</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-4 text-center">No data.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex justify-center">
                        {prospects.links.map((link, k) => (
                            <div key={k}>
                                {link.url ? (
                                    <Link
                                        as="button"
                                        href={link.url}
                                        className={`px-3 py-1 mx-1 border rounded text-sm ${
                                            link.active 
                                                ? 'bg-orange-500 text-white border-orange-500' 
                                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span
                                        className="px-3 py-1 mx-1 border rounded text-sm text-gray-400 bg-gray-100"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- MODAL PILIH SALES --- */}
                <Modal show={isModalOpen} onClose={closeModal} maxWidth="md">
                    <form onSubmit={submitAssignment} className="p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">
                            Select Sales Agent
                        </h2>
                        
                        <p className="text-sm text-gray-600 mb-4">
                            You will be assigned <span className="font-bold">{selectedIds.length}</span> selected prospects to the following sales:
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sales Name</label>
                            <select
                                value={data.sales_id}
                                onChange={(e) => setData('sales_id', e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-200"
                                required
                            >
                                <option value="">-- Select Sales --</option>
                                {salesAgents.map((agent) => (
                                    <option key={agent.id} value={agent.id}>
                                        {agent.name}
                                    </option>
                                ))}
                            </select>
                            {errors.sales_id && <div className="text-red-500 text-sm mt-1">{errors.sales_id}</div>}
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition flex items-center"
                            >
                                {processing ? 'Saving...' : 'Save Assignment'}
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </SidebarLayout>
    );
}
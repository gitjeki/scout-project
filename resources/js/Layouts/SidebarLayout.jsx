import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { FaUsers, FaChartLine, FaKey, FaSignOutAlt, FaTasks, FaAngleDown } from 'react-icons/fa'; // Tambah FaAngleDown
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown'; // IMPORT INI WAJIB

export default function SidebarLayout({ children, header }) {
    const user = usePage().props.auth.user;
    
    // Tentukan Menu berdasarkan Role
    const menus = user.role === 'admin' ? [
        { name: 'Dashboard', route: 'dashboard', icon: <FaChartLine /> },
        { name: 'Pengelolaan Akun', route: 'users.index', icon: <FaUsers /> },
        { name: 'Reset Password', route: 'admin.reset.index', icon: <FaKey /> },
    ] : [
        { name: 'Dashboard', route: 'dashboard', icon: <FaChartLine /> },
        { name: 'Daftar Prospek', route: 'dashboard', icon: <FaTasks /> },
        { name: 'Update Status', route: 'dashboard', icon: <FaUsers /> },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* --- SIDEBAR KIRI --- */}
            <div className="w-64 bg-[#FDF3E7] border-r border-gray-200 flex flex-col fixed h-full z-10">
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-[#FAE5D3]">
                    <span className="text-xl font-bold text-orange-600">SALES ANALYSIS</span>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 px-2 py-4 space-y-2">
                    {menus.map((item, index) => (
                        <Link
                            key={index}
                            href={route(item.route)}
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-orange-200 hover:text-orange-800 rounded-md transition-colors font-medium"
                        >
                            <span className="mr-3 text-lg">{item.icon}</span>
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Tombol Logout di Bawah */}
                <div className="p-4 border-t border-gray-200">
                     <Link
                        method="post"
                        href={route('logout')}
                        as="button"
                        className="flex items-center w-full px-4 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded-md transition"
                    >
                        <FaSignOutAlt className="mr-2" />
                        Logout
                    </Link>
                </div>
            </div>

            {/* --- KONTEN KANAN --- */}
            <div className="flex-1 ml-64 flex flex-col">
                {/* Top Header (User Profile + Dropdown) */}
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-20">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        {header}
                    </h2>
                    
                    {/* BAGIAN INI YANG KITA PERBAIKI AGAR BISA DIKLIK */}
                    <div className="flex items-center">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center gap-3 focus:outline-none transition duration-150 ease-in-out">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-sm font-bold text-gray-700">{user.name}</div>
                                        <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                                    </div>
                                    
                                    {/* Avatar Bulat */}
                                    <div className="h-9 w-9 rounded-full bg-orange-500 overflow-hidden border-2 border-orange-200 flex items-center justify-center text-white font-bold">
                                        {user.profile_photo ? (
                                            <img 
                                                src={`/storage/${user.profile_photo}`} 
                                                alt={user.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <span>{user.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    
                                    <FaAngleDown className="text-gray-400" />
                                </button>
                            </Dropdown.Trigger>

                            <Dropdown.Content>
                                <Dropdown.Link href={route('profile.edit')}>
                                    Profile
                                </Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">
                                    Log Out
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
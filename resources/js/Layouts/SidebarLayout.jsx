import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    FaUsers, FaChartLine, FaKey, FaSignOutAlt, 
    FaTasks, FaAngleDown, FaUserTag, FaExclamationTriangle 
} from 'react-icons/fa';
import Dropdown from '@/Components/Dropdown';

export default function SidebarLayout({ children, header }) {
    const { auth } = usePage().props;
    const user = auth.user;
    
    // --- DEFINISI MENU ---
    // Pastikan nama 'route' di sini SAMA PERSIS dengan ->name('...') di web.php
    const adminMenus = [
        { name: 'Dashboard', route: 'dashboard', icon: <FaChartLine /> },
        
        // --- MENU BARU: DATA CONTROL ---
        { name: 'Data Control', route: 'data-control.index', icon: <FaExclamationTriangle /> },
        
        // Pastikan route 'users.index' ada di web.php
        { name: 'Pengelolaan Akun', route: 'users.index', icon: <FaUsers /> },
        // Pastikan route 'admin.reset.index' ada di web.php
        { name: 'Reset Password', route: 'admin.reset.index', icon: <FaKey /> },
    ];

    const salesMenus = [
        { name: 'Dashboard', route: 'dashboard', icon: <FaChartLine /> },
        // Mengarah ke tabel khusus sales
        { name: 'Daftar Prospek', route: 'sales.prospects.index', icon: <FaTasks /> },
    ];

    // Pilih menu berdasarkan role
    const menus = user.role === 'admin' ? adminMenus : salesMenus;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* --- SIDEBAR KIRI --- */}
            <div className="w-64 bg-[#FDF3E7] border-r border-gray-200 flex flex-col fixed h-full z-10 transition-all duration-300">
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-[#FAE5D3]">
                    <span className="text-xl font-bold text-orange-600 tracking-wider">SALES APP</span>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                    {menus.map((item, index) => (
                        <Link
                            key={index}
                            href={route(item.route)}
                            className={`flex items-center px-4 py-3 rounded-md transition-colors font-medium group ${
                                route().current(item.route)
                                    ? 'bg-orange-200 text-orange-900' // Style Active
                                    : 'text-gray-700 hover:bg-orange-100 hover:text-orange-800' // Style Inactive
                            }`}
                        >
                            <span className={`mr-3 text-lg ${route().current(item.route) ? 'text-orange-700' : 'text-gray-500 group-hover:text-orange-600'}`}>
                                {item.icon}
                            </span>
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Tombol Logout di Bawah Sidebar */}
                <div className="p-4 border-t border-gray-200 bg-[#FDF3E7]">
                     <Link
                        method="post"
                        href={route('logout')}
                        as="button"
                        className="flex items-center justify-center w-full px-4 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded-md transition shadow-sm font-medium"
                    >
                        <FaSignOutAlt className="mr-2" />
                        Logout
                    </Link>
                </div>
            </div>

            {/* --- KONTEN KANAN --- */}
            <div className="flex-1 ml-64 flex flex-col min-w-0">
                {/* Top Header (User Profile + Dropdown) */}
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-20 w-full">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight truncate">
                        {header}
                    </h2>
                    
                    {/* User Dropdown */}
                    <div className="flex items-center ml-4">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center gap-3 focus:outline-none transition duration-150 ease-in-out group">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-sm font-bold text-gray-700 group-hover:text-orange-600 transition">
                                            {user.name}
                                        </div>
                                        <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                                    </div>
                                    
                                    {/* Avatar */}
                                    <div className="h-9 w-9 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center text-orange-600 font-bold overflow-hidden">
                                        {user.profile_photo_url ? (
                                            <img src={user.profile_photo_url} alt={user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <FaUserTag />
                                        )}
                                    </div>
                                    
                                    <FaAngleDown className="text-gray-400 group-hover:text-orange-500 transition" />
                                </button>
                            </Dropdown.Trigger>

                            <Dropdown.Content align="right" width="48">
                                <Dropdown.Link href={route('profile.edit')}>
                                    Profile
                                </Dropdown.Link>
                                <div className="border-t border-gray-100" />
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
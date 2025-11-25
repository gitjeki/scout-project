import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function Guest({ children }) {
    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100">
            {/* --- BAGIAN HEADER (LOGO & NAMA WEB) --- */}
            <div className="w-full max-w-md text-center mb-6">
                <Link href="/" className="flex flex-col items-center gap-2">
                    {/* Ganti src dengan lokasi logomu */}
                    <img 
                        src="/images/logo.png" 
                        alt="Logo Web" 
                        className="w-20 h-20 object-contain" 
                    />
                    <h1 className="text-2xl font-bold text-gray-800">
                        Portal Lead Scoring
                    </h1>
                </Link>
            </div>

            {/* --- BAGIAN KOTAK FORM (Login/Forgot Pass) --- */}
            <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-white shadow-md overflow-hidden sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}
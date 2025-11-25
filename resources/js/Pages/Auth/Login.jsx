import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

            <form onSubmit={submit}>
                <h2 className="text-center text-2xl font-bold mb-6 text-gray-800">Login</h2>

                {/* --- Input Email --- */}
                <div>
                    <InputLabel htmlFor="email" value="Email" className="font-bold text-gray-700"/>
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full border-2 border-gray-300 rounded-md"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                {/* --- Input Password --- */}
                <div className="mt-4 relative">
                    <InputLabel htmlFor="password" value="Password" className="font-bold text-gray-700" />
                    <TextInput
                        id="password"
                        type="password" // Nanti kita bisa tambah fitur "show password" (mata)
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full border-2 border-gray-300 rounded-md"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                {/* --- Link Lupa Password --- */}
                {canResetPassword && (
                    <div className="mt-2">
                        <Link
                            href={route('password.request')}
                            className="text-sm text-yellow-600 hover:text-yellow-800 font-bold"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                )}

                {/* --- Tombol Login (Warna Kuning/Orange) --- */}
                <div className="mt-6">
                    <PrimaryButton 
                        className="w-full justify-center bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 text-lg border-none" 
                        disabled={processing}
                    >
                        Login
                    </PrimaryButton>
                </div>

                {/* --- HAPUS LINK REGISTER --- */}
                {/* Karena pendaftaran diurus Admin, kita hapus link "Don't have account?" */}
                
            </form>
        </GuestLayout>
    );
}
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
// PERBAIKAN 1: Tambahkan 'router' di import
import { Head, useForm, router } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        
        // PERBAIKAN 2: Tambahkan logika onSuccess untuk redirect
        post(route('password.email'), {
            onSuccess: () => {
                // Opsional: Tampilkan alert kecil agar user tahu request berhasil
                // alert('Permintaan reset password telah dikirim.'); 
                
                // Redirect ke halaman login
                router.get(route('login'));
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Lupa Password" />

            <div className="mb-4 text-sm text-gray-600 text-center">
                Forgot your password? Enter your account email address below.
                A reset request will be sent to the Administrator.
            </div>

            {status && <div className="mb-4 font-medium text-sm text-green-600 text-center">{status}</div>}

            <form onSubmit={submit}>
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="mt-1 block w-full border-2 border-gray-300"
                    isFocused={true}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="Enter your email"
                />

                <InputError message={errors.email} className="mt-2" />

                <div className="flex items-center justify-end mt-4">
                    <PrimaryButton 
                        className="w-full justify-center bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 border-none" 
                        disabled={processing}
                    >
                       Send Request to Admin
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
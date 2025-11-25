import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Lupa Password" />

            <div className="mb-4 text-sm text-gray-600 text-center">
                Lupa password Anda? Masukkan email akun Anda di bawah ini. 
                Permintaan reset akan dikirim ke <b>Administrator</b>.
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
                    placeholder="Masukkan Email Anda"
                />

                <InputError message={errors.email} className="mt-2" />

                <div className="flex items-center justify-end mt-4">
                    <PrimaryButton 
                        className="w-full justify-center bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 border-none" 
                        disabled={processing}
                    >
                        Kirim Permintaan ke Admin
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
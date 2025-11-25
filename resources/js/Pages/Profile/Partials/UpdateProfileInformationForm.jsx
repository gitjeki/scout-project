import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { useState } from 'react';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
    const user = usePage().props.auth.user;

    const { data, setData, post, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        username: user.username || '',
        email: user.email,
        photo: null, // Untuk file upload
        _method: 'PATCH', // Trik agar Laravel bisa baca file upload di method PUT/PATCH
    });

    const [preview, setPreview] = useState(user.profile_photo ? `/storage/${user.profile_photo}` : null);

    const submit = (e) => {
        e.preventDefault();
        // Kita pakai post (dengan _method PATCH) karena Inertia upload file butuh POST form-data
        post(route('profile.update'));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        setData('photo', file);
        setPreview(URL.createObjectURL(file)); // Preview gambar sebelum disimpan
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">Informasi Profil</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Update foto, username, dan nama akun Anda.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6" encType="multipart/form-data">
                
                {/* --- FOTO PROFIL --- */}
                <div>
                    <InputLabel value="Foto Profil" />
                    <div className="flex items-center gap-4 mt-2">
                        {/* Preview Bulat */}
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border border-gray-300">
                            {preview ? (
                                <img src={preview} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <input 
                            type="file" 
                            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                            onChange={handlePhotoChange}
                            accept="image/*"
                        />
                    </div>
                    <InputError className="mt-2" message={errors.photo} />
                </div>

                {/* --- NAMA --- */}
                <div>
                    <InputLabel htmlFor="name" value="Nama Lengkap" />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />
                    <InputError className="mt-2" message={errors.name} />
                </div>

                 {/* --- USERNAME (Baru) --- */}
                 <div>
                    <InputLabel htmlFor="username" value="Username" />
                    <TextInput
                        id="username"
                        className="mt-1 block w-full bg-gray-50"
                        value={data.username}
                        onChange={(e) => setData('username', e.target.value)}
                        required
                    />
                    <InputError className="mt-2" message={errors.username} />
                </div>

                {/* --- EMAIL --- */}
                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full bg-gray-100 cursor-not-allowed"
                        value={data.email}
                        disabled // Email sebaiknya tidak diubah sembarangan
                    />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Simpan Perubahan</PrimaryButton>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">Tersimpan.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
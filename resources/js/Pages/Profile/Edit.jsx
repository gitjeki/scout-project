// GANTI IMPORT INI:
// import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'; 
// MENJADI:
import SidebarLayout from '@/Layouts/SidebarLayout'; // <--- Gunakan Layout Kita

import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Head } from '@inertiajs/react';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        // GANTI WRAPPER DI SINI:
        <SidebarLayout header="My Profile">
            <Head title="Profile" />

            <div className="py-6 space-y-6">
                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>
            </div>
        </SidebarLayout>
    );
}
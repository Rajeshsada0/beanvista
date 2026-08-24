import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
                <div className="text-center mb-6">
                    <ApplicationLogo className="h-16 w-auto max-w-[240px] object-contain mx-auto mb-4 text-gray-700" />
                    <h2 className="text-2xl font-bold text-gray-900">Verify Email</h2>
                    <p className="mt-2 text-sm text-gray-600">Please verify your email address</p>
                </div>

                <div className="mb-6 text-sm text-gray-600 leading-relaxed">
                    Thanks for signing up! Before getting started, could you verify
                    your email address by clicking on the link we just emailed to
                    you? If you didn't receive the email, we will gladly send you
                    another.
                </div>

                {status === 'verification-link-sent' && (
                    <div className="mb-6 p-4 text-sm font-medium text-green-700 bg-green-50 rounded-lg border border-green-200">
                        A new verification link has been sent to the email address
                        you provided during registration.
                    </div>
                )}

                <form onSubmit={submit}>
                    <div className="flex items-center justify-between pt-2">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-sm text-gray-600 hover:text-gray-900 underline font-semibold transition-colors focus:outline-none"
                        >
                            Log Out
                        </Link>
                        <PrimaryButton disabled={processing}>
                            Resend Email
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}

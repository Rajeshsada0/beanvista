import { useState } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import ApplicationLogo from '@/Components/ApplicationLogo';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const [isCustomCode, setIsCustomCode] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone_code: '+977',
        phone: '',
        password: '',
        password_confirmation: '',
        cafe_name: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
                <div className="text-center mb-8">
                    <ApplicationLogo className="h-16 w-16 mx-auto mb-4 text-gray-700" />
                    <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                    <p className="mt-2 text-sm text-gray-600">Join us and start your journey</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <InputLabel htmlFor="cafe_name" value="Business/Cafe Name" className="text-sm font-medium text-gray-700" />

                        <TextInput
                            id="cafe_name"
                            name="cafe_name"
                            value={data.cafe_name}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            autoComplete="organization"
                            isFocused={true}
                            onChange={(e) => setData('cafe_name', e.target.value)}
                            placeholder="Enter your cafe name"
                            required
                        />

                        <InputError message={errors.cafe_name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="name" value="Your Full Name" className="text-sm font-medium text-gray-700" />

                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            autoComplete="name"
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Enter your full name"
                            required
                        />

                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="Email Address" className="text-sm font-medium text-gray-700" />

                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Enter your email address"
                            required
                        />

                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="phone" value="Phone Number" className="text-sm font-medium text-gray-700" />

                        <div className="flex gap-2 mt-1">
                            {!isCustomCode ? (
                                <select
                                    id="phone_code"
                                    name="phone_code"
                                    value={data.phone_code}
                                    className="block px-3 py-3 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm font-medium text-gray-700"
                                    onChange={(e) => {
                                        if (e.target.value === 'Other') {
                                            setIsCustomCode(true);
                                            setData('phone_code', '');
                                        } else {
                                            setData('phone_code', e.target.value);
                                        }
                                    }}
                                    required
                                >
                                    <option value="+977">+977 (NP)</option>
                                    <option value="+91">+91 (IN)</option>
                                    <option value="+92">+92 (PK)</option>
                                    <option value="+1">+1 (US/CA)</option>
                                    <option value="+44">+44 (UK)</option>
                                    <option value="+61">+61 (AU)</option>
                                    <option value="+49">+49 (DE)</option>
                                    <option value="+33">+33 (FR)</option>
                                    <option value="+86">+86 (CN)</option>
                                    <option value="+81">+81 (JP)</option>
                                    <option value="+966">+966 (SA)</option>
                                    <option value="+971">+971 (AE)</option>
                                    <option value="+880">+880 (BD)</option>
                                    <option value="+55">+55 (BR)</option>
                                    <option value="+7">+7 (RU)</option>
                                    <option value="+27">+27 (ZA)</option>
                                    <option value="+39">+39 (IT)</option>
                                    <option value="+34">+34 (ES)</option>
                                    <option value="+65">+65 (SG)</option>
                                    <option value="+60">+60 (MY)</option>
                                    <option value="Other">Other</option>
                                </select>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <TextInput
                                        id="phone_code_custom"
                                        type="text"
                                        value={data.phone_code}
                                        className="block w-20 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        onChange={(e) => setData('phone_code', e.target.value)}
                                        placeholder="+Code"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCustomCode(false);
                                            setData('phone_code', '+977');
                                        }}
                                        className="px-2 py-2 text-red-500 hover:text-red-700 text-lg font-bold"
                                        title="Choose from list"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            <TextInput
                                id="phone"
                                type="tel"
                                name="phone"
                                value={data.phone}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="Enter phone number"
                                required
                            />
                        </div>

                        <InputError message={errors.phone || errors.phone_code} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value="Password" className="text-sm font-medium text-gray-700" />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Create a strong password"
                            required
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirm Password"
                            className="text-sm font-medium text-gray-700"
                        />

                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            placeholder="Confirm your password"
                            required
                        />

                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>

                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-600">
                                Already have an account?
                            </span>
                            <Link
                                href={route('login')}
                                className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                        </div>

                        <PrimaryButton 
                            className="w-full justify-center py-3 text-base font-medium bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200" 
                            disabled={processing}
                        >
                            {processing ? 'Creating account...' : 'Create Account'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}

import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 relative">
            {/* Background Image with Overlay */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/images/bg.jpg')" }}
            >
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            </div>
            
            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md">
                {children}
            </div>
        </div>
    );
}

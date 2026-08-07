import { usePage } from '@inertiajs/react';

export default function ApplicationLogo({ className = "h-8 w-8" }) {
    const { settings } = usePage().props;

    if (settings?.site_logo) {
        return (
            <img 
                src={settings.site_logo} 
                alt={settings.site_name || 'Logo'} 
                className={className}
            />
        );
    }

    return (
        <img
            src="/images/coffee.png"
            alt="Café Logo"
            className={className}
        />
    );
}

import { usePage } from '@inertiajs/react';
import React, { useState } from 'react';

export default function ApplicationLogo({ className = "h-8 w-8" }) {
    const { settings } = usePage().props;
    const [hasError, setHasError] = useState(false);

    if (settings?.site_logo && !hasError) {
        const logoSrc = typeof settings.site_logo === 'string'
            ? settings.site_logo.replace('/storage/', '/img/')
            : settings.site_logo;

        return (
            <img 
                src={logoSrc} 
                alt={settings.site_name || 'Logo'} 
                className={className}
                onError={(e) => {
                    if (e.target.src.includes('/storage/')) {
                        e.target.src = e.target.src.replace('/storage/', '/img/');
                    } else {
                        setHasError(true);
                    }
                }}
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

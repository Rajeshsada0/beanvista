import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MediaGallery from '@/Components/Media/MediaGallery';
import { Head } from '@inertiajs/react';

export default function Index() {
    const handleClose = () => {
        // Redirect back to dashboard on close
        window.location.href = route('dashboard');
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-black text-2xl text-slate-800 tracking-tight">Media Library</h2>}
        >
            <Head title="Media Library" />

            <div className="py-12 bg-slate-50/50 min-h-[calc(100vh-65px)]">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-[2rem] border border-slate-100 p-12 min-h-[500px] flex flex-col items-center justify-center relative">
                        <div className="text-center max-w-md">
                            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Cafe Media Assets</h3>
                            <p className="text-sm text-slate-500 font-medium mb-8">
                                Upload, rename, delete, search and organize product photos and icons across all branches.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest rounded-xl transition shadow-lg hover:shadow-xl active:scale-95"
                            >
                                Open Media Explorer
                            </button>
                        </div>

                        {/* Mount the media explorer dialog directly */}
                        <MediaGallery 
                            isOpen={true} 
                            onClose={handleClose}
                            onSelect={() => {}}
                            title="Media Library Explorer"
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

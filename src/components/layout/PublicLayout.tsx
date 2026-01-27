import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-brand-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-brand-900 tracking-tight">
                        All U Moves
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Kinesiología Pélvica Integral
                    </p>
                </div>

                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <Outlet />
                </div>

                <div className="text-center text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} All U Moves App
                </div>
            </div>
        </div>
    );
};

export default PublicLayout;

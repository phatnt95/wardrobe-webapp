import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shirt, Loader2 } from 'lucide-react';

export const Register = () => {
    const [isLoading, setIsLoading] = React.useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            navigate('/login');
        }, 800);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-surface p-8 rounded-3xl shadow-soft-lg border border-gray-100">
                <div className="text-center mb-10">
                    <div className="mx-auto h-16 w-16 bg-primary-50 rounded-full flex items-center justify-center mb-4 text-primary-600 shadow-inner">
                        <Shirt className="h-8 w-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                    <p className="text-sm text-gray-500">Join to organize your wardrobe smartly</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">
                                First Name
                            </label>
                            <input
                                id="firstName"
                                type="text"
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                placeholder="John"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastName">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="lastName"
                                type="text"
                                required
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
                            Username <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="username"
                            type="text"
                            required
                            className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="johndoe123"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="Create a password"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none ring-2 ring-primary-500 ring-offset-2 transition-all shadow-md mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                            {isLoading ? "Signing up..." : "Sign Up"}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center text-sm">
                    <span className="text-gray-500">Already have an account? </span>
                    <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};

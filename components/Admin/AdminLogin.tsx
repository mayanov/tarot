
import React, { useState } from 'react';

interface AdminLoginProps {
    onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Local fallback vs Relative path for Prod
            const baseUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';
            const response = await fetch(`${baseUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store JWT token locally for usage in API calls
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                }
                onLogin();
            } else {
                setError(data.error || 'Invalid credentials');
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Failed to connect to server');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
            <div className="bg-surface-1 border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md backdrop-blur-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-lilac to-teal-accent mb-2">
                        Mayanov Admin
                    </h1>
                    <p className="text-text-subtle text-sm">Sign in to view analytics</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-text-subtle mb-2">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-bg-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:border-lilac focus:ring-1 focus:ring-lilac outline-none transition-all"
                            placeholder="admin@mayanov.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-text-subtle mb-2">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-bg-deep border border-white/10 rounded-lg px-4 py-3 text-white focus:border-lilac focus:ring-1 focus:ring-lilac outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-xs text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-lilac text-bg-dark font-bold rounded-lg hover:bg-white transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 shadow-lg shadow-lilac/20"
                    >
                        {isLoading ? 'Signing In...' : 'Access Dashboard'}
                    </button>

                    <div className="text-center pt-4">
                        <a href="/" className="text-xs text-text-subtle hover:text-white transition-colors">
                            ← Back to Website
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;

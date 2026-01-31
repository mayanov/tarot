import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Users, Globe, Smartphone, Clock, Calendar, RefreshCcw, ChevronDown, BarChart2, Zap, Lock, LogIn, LogOut, Trash2, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { getMockAnalyticsData, DailyVisit, UserLocation, UserDevice, AnalyticsSummary, ServicePerformance } from '../../services/mockAnalytics';
import { initGoogleAPI, loginToGoogle, fetchGA4Data } from '../../services/ga4';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { format, parseISO } from 'date-fns';

type DateRangePreset = '7D' | '30D' | 'THIS_MONTH' | 'CUSTOM';

interface AnalyticsDashboardProps {
    onLogout?: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onLogout }) => {
    // State
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [activePreset, setActivePreset] = useState<DateRangePreset>('7D');
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [serviceTab, setServiceTab] = useState<'ID' | 'Global'>('ID');

    // Real Data State
    const [useRealData, setUseRealData] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthorizing, setIsAuthorizing] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const [data, setData] = useState<{
        dailyVisits: DailyVisit[];
        locations: UserLocation[];
        devices: UserDevice[];
        summary: AnalyticsSummary;
        topServicesID: ServicePerformance[];
        topServicesGlobal: ServicePerformance[];
    } | null>(null);

    // Helper: Apply Presets
    const applyPreset = (preset: DateRangePreset) => {
        setActivePreset(preset);
        const end = new Date();
        const start = new Date();

        if (preset === '7D') {
            start.setDate(end.getDate() - 6);
        } else if (preset === '30D') {
            start.setDate(end.getDate() - 29);
        } else if (preset === 'THIS_MONTH') {
            start.setDate(1); // 1st of current month
        }

        if (preset !== 'CUSTOM') {
            const endStr = end.toISOString().split('T')[0];
            const startStr = start.toISOString().split('T')[0];
            setStartDate(startStr);
            setEndDate(endStr);
            setShowCustomPicker(false);
        } else {
            setShowCustomPicker(true);
        }
    };

    const [clientId, setClientId] = useState('1053786819507-t7aalq26e9djq7lkf3q6jge02jf36qdr.apps.googleusercontent.com');
    const [propertyId, setPropertyId] = useState('386315459');

    // Init Logic
    // Init Logic
    useEffect(() => {
        applyPreset('7D');
        // Initialize Google API scripts but DO NOT auto-login/popup
        if (clientId) {
            initGoogleAPI(clientId).catch(console.error);
        }
        // Attempt to load data using default mode (Real if possible via backend)
        setUseRealData(true);
        setTimeout(() => loadData(true), 100);
    }, []);

    // Handle Connection
    const handleConnect = async () => {
        if (!clientId || !propertyId) return;
        setIsAuthorizing(true);
        setApiError(null);
        try {
            await initGoogleAPI(clientId);
            // check if already signed in or silent login possible
            // For now, we call loginToGoogle which checks token presence

            // Note: If user is not signed in to Google in browser context, this might popup.
            // Ideally we want this to happen "after admin login". 
            // Since this component is now "Admin Dashboard", we assume the user is ready.

            await loginToGoogle();
            setIsConnected(true);
            setUseRealData(true);
            loadData(true);
        } catch (e: any) {
            console.error(e);

            // Try to extract detailed error message from different Google API error formats
            let errorMessage = e.message || "Failed to connect.";

            if (e.result && e.result.error) {
                errorMessage = `${e.result.error.message} (Code: ${e.result.error.code})`;
            } else if (e.error && e.error.message) {
                errorMessage = e.error.message;
            }

            setApiError(errorMessage);
            setIsConnected(false);
        } finally {
            setIsAuthorizing(false);
        }
    };

    // Data Fetch
    const loadData = async (forceReal = false) => {
        if (!startDate || !endDate) return;

        setData(null);

        if (useRealData || forceReal) {
            try {
                // Determine if we need client-side auth
                // fetchGA4Data tries backend first. 
                const realData = await fetchGA4Data(propertyId, startDate, endDate);
                setData(realData);
                setApiError(null);
            } catch (e: any) {
                console.error("Dashboard Load Error:", e);

                let msg = e.message || "Unknown error";
                // Show friendly error encouraging manual auth ONLY if backend failed
                setApiError("Data unavailable. Please authorize Google access or check backend connection.");
                setData(null);
            }
        } else {
            // Mock Data Flow
            setTimeout(() => {
                setData(getMockAnalyticsData(startDate, endDate));
            }, 400);
        }
    };

    useEffect(() => {
        loadData();
    }, [startDate, endDate, useRealData, isConnected]);

    // Loading State wrapper
    const isLoading = !data && !apiError;

    // User Management State
    // User Management State
    // View State
    const [activeView, setActiveView] = useState<'analytics' | 'users'>('analytics');
    const [showAddUserModal, setShowAddUserModal] = useState(false); // New state for Add User Popup
    const [userList, setUserList] = useState<string[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [currentUserEmail, setCurrentUserEmail] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Helper to show toast
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Fetch Users when switching to users view
    useEffect(() => {
        if (activeView === 'users') {
            fetchUsers();
            // Decode current user from token
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    setCurrentUserEmail(payload.email);
                } catch (e) {
                    console.error("Failed to decode token");
                }
            }
        }
    }, [activeView]);

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('http://localhost:3001/api/users', {
                cache: 'no-store',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const users = await res.json();
                setUserList(users);
            }
        } catch (e) {
            console.error("Failed to fetch users");
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleDeleteUser = async (emailToDelete: string) => {
        if (!confirm(`Are you sure you want to revoke access for ${emailToDelete}?`)) return;

        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('http://localhost:3001/api/users', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: emailToDelete })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('User removed successfully.', 'success');
                // Optimistic update
                setUserList(prev => prev.filter(email => email !== emailToDelete));
            } else {
                showToast(data.error || 'Failed to remove user', 'error');
            }
        } catch (e) {
            showToast('Network error on delete', 'error');
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('http://localhost:3001/api/users/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: newUserEmail, password: newUserPassword })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('User added successfully!', 'success');
                setNewUserEmail('');
                setNewUserPassword('');
                fetchUsers();
                setShowAddUserModal(false);
            } else {
                showToast(data.error || 'Failed to add user', 'error');
            }
        } catch (err) {
            showToast('Network error occurred', 'error');
        }
    };

    // We do NOT return null here anymore, we render the skeleton structure
    return (
        <div className="flex h-screen bg-bg-deep text-text-light font-sans overflow-hidden">
            {/* SIDEBAR */}
            {/* SIDEBAR */}
            <aside className="w-72 bg-surface-1 border-r border-white/5 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-lilac to-teal-accent">
                        Mayanov Admin
                    </h2>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {/* Active Menu */}
                    <button
                        onClick={() => setActiveView('analytics')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${activeView === 'analytics' ? 'bg-lilac/10 text-lilac border border-lilac/20' : 'text-text-subtle hover:text-white hover:bg-white/5'}`}>
                        <BarChart2 size={18} />
                        <span>Analytics</span>
                    </button>

                    <button
                        onClick={() => setActiveView('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${activeView === 'users' ? 'bg-lilac/10 text-lilac border border-lilac/20' : 'text-text-subtle hover:text-white hover:bg-white/5'}`}>
                        <Users size={18} />
                        <span>Manage Users</span>
                    </button>

                    {/* Disabled Menu */}
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-text-subtle/50 cursor-not-allowed rounded-xl font-medium text-sm">
                        <RefreshCcw size={18} />
                        <span>Content Updates</span>
                        <span className="ml-auto text-[10px] uppercase bg-white/5 text-text-subtle px-1.5 py-0.5 rounded">Soon</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-white/5">
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-text-subtle hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    )}
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto relative bg-bg-deep">
                {/* Mobile Header (Hamburger would go here if we were doing mobile fully, keeping simple for now) */}
                {/* MAIN CONTENT SWITCHER */}
                {activeView === 'users' ? (
                    /* USER MANAGEMENT VIEW (Full Page) */
                    <div className="space-y-6 pt-24 md:pt-12 p-6 md:p-12 max-w-5xl mx-auto">
                        <div className="pb-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-white mb-2">User Management</h1>
                                <p className="text-text-subtle text-sm">Control who has access to the admin dashboard.</p>
                            </div>
                            <button
                                onClick={() => setShowAddUserModal(true)}
                                className="px-4 py-2 bg-lilac text-bg-dark font-bold rounded-xl hover:bg-white hover:scale-105 transition-all text-sm flex items-center gap-2 shadow-lg shadow-lilac/20"
                            >
                                <Plus size={18} />
                                <span>Add Access</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {/* LIST SECTION */}
                            <div className="space-y-4">
                                <div className="bg-surface-1 border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                            <Users size={16} className="text-lilac" /> Current Admins
                                        </h3>
                                        <span className="text-xs text-text-subtle font-mono">{userList.length} users</span>
                                    </div>

                                    <div className="divide-y divide-white/5">
                                        {isLoadingUsers ? (
                                            <div className="p-8 flex justify-center">
                                                <RefreshCcw className="animate-spin text-lilac" size={24} />
                                            </div>
                                        ) : userList.length > 0 ? (
                                            userList.map((u) => (
                                                <div key={u} className="flex justify-between items-center p-4 hover:bg-white/5 transition-colors group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lilac/20 to-teal-accent/20 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                                                            {u.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">{u}</p>
                                                            {u === currentUserEmail && <span className="text-[10px] text-teal-accent uppercase font-bold tracking-wider">It's You</span>}
                                                        </div>
                                                    </div>

                                                    {u !== currentUserEmail && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u)}
                                                            className="p-2 text-text-subtle hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                            title="Revoke Access"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="p-8 text-text-subtle text-sm italic text-center">No users found.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ADD USER MODAL */}
                        {showAddUserModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                                <div className="bg-surface-1 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 relative">
                                    <button
                                        onClick={() => setShowAddUserModal(false)}
                                        className="absolute top-4 right-4 text-text-subtle hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>

                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <Users size={20} className="text-lilac" /> Grant New Access
                                    </h3>

                                    <form onSubmit={handleAddUser} className="space-y-4">
                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-text-subtle mb-1.5 font-bold">Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                value={newUserEmail}
                                                onChange={(e) => setNewUserEmail(e.target.value)}
                                                className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-lilac focus:ring-1 focus:ring-lilac outline-none transition-all"
                                                placeholder="new.admin@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-text-subtle mb-1.5 font-bold">Password</label>
                                            <input
                                                type="text"
                                                required
                                                value={newUserPassword}
                                                onChange={(e) => setNewUserPassword(e.target.value)}
                                                className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-lilac focus:ring-1 focus:ring-lilac outline-none transition-all"
                                                placeholder="Create specific password"
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowAddUserModal(false)}
                                                className="flex-1 py-3 text-text-subtle hover:text-white transition-colors text-sm font-bold"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 py-3 bg-lilac text-bg-dark font-bold rounded-xl hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all text-sm shadow-lg shadow-lilac/20"
                                            >
                                                Add Admin
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ANALYTICS VIEW (Default) */
                    <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto pt-24 md:pt-12">
                        {/* Configuration Panel (Only show if error or explicit disconnected state) */}
                        {(!isConnected && !isAuthorizing && apiError) && (
                            <div className="bg-surface-1 border border-lilac/30 p-4 rounded-xl mb-6 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 rounded-lg text-red-300">
                                        <Lock size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Google Authorization Required</h3>
                                        <p className="text-xs text-text-subtle">
                                            {apiError.includes('popup_closed')
                                                ? "Pop-up was closed. Please authorize to view data."
                                                : "Please sign in to Google to view real analytics data."}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleConnect}
                                    className="px-4 py-2 bg-lilac text-bg-dark text-xs font-bold rounded-lg hover:bg-white transition-colors flex items-center gap-2"
                                >
                                    <LogIn size={14} />
                                    Authorize Access
                                </button>
                            </div>
                        )}

                        {/* Header Area */}
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-white/5">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-serif font-bold text-white">
                                        Analytics Overview
                                    </h1>
                                    {isConnected && (
                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] uppercase font-bold tracking-wider rounded border border-green-500/20">
                                            LIVE DATA
                                        </span>
                                    )}
                                </div>
                                <p className="text-text-subtle mt-1 text-sm">
                                    Performance metrics for <span className="text-white font-medium">{startDate}</span> to <span className="text-white font-medium">{endDate}</span>
                                </p>
                            </div>

                            {/* Enhanced Controls Toolbar */}
                            <div className="flex flex-col sm:flex-row gap-3 bg-surface-1 p-1.5 rounded-xl border border-white/10 shadow-lg">
                                {/* Quick Filters */}
                                <div className="flex bg-bg-dark/50 rounded-lg p-1">
                                    {(['7D', '30D', 'THIS_MONTH'] as DateRangePreset[]).map((preset) => (
                                        <button
                                            key={preset}
                                            onClick={() => applyPreset(preset)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activePreset === preset
                                                ? 'bg-lilac text-bg-dark shadow-md'
                                                : 'text-text-subtle hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            {preset === '7D' ? 'Last 7 Days' : preset === '30D' ? 'Last 30 Days' : 'This Month'}
                                        </button>
                                    ))}
                                </div>

                                <div className="w-[1px] bg-white/10 hidden sm:block my-1" />

                                {/* Custom Range Trigger */}
                                <div className="flex items-center gap-2 relative">
                                    <button
                                        onClick={() => applyPreset('CUSTOM')}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${activePreset === 'CUSTOM'
                                            ? 'bg-surface-2 border-lilac text-lilac'
                                            : 'bg-transparent border-transparent text-text-subtle hover:bg-white/5'
                                            }`}
                                    >
                                        <Calendar size={14} />
                                        <span>Custom Range</span>
                                        <ChevronDown size={12} className={`transition-transformDuration-300 ${showCustomPicker ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Popover Date Inputs */}
                                    {showCustomPicker && (
                                        <div className="absolute top-full right-0 mt-3 p-3 bg-surface-1 border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 min-w-max date-picker-popup">
                                            <div className="rdp-custom-wrapper">
                                                <DayPicker
                                                    mode="range"
                                                    selected={{
                                                        from: startDate ? parseISO(startDate) : undefined,
                                                        to: endDate ? parseISO(endDate) : undefined
                                                    }}
                                                    onSelect={(range) => {
                                                        if (range?.from) {
                                                            setStartDate(format(range.from, 'yyyy-MM-dd'));
                                                            // Note: range.to might be undefined if only one day selected so far
                                                            setEndDate(range?.to ? format(range.to, 'yyyy-MM-dd') : '');
                                                        } else {
                                                            setStartDate('');
                                                            setEndDate('');
                                                        }
                                                    }}
                                                    defaultMonth={startDate ? parseISO(startDate) : new Date()}
                                                />
                                            </div>
                                            <div className="pt-2 border-t border-white/5 flex justify-between items-center px-2">
                                                <button
                                                    onClick={() => setShowCustomPicker(false)}
                                                    className="text-xs text-text-subtle hover:text-white transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (startDate && endDate) setShowCustomPicker(false);
                                                    }}
                                                    disabled={!startDate || !endDate}
                                                    className="px-3 py-1.5 bg-lilac text-bg-dark text-xs font-bold rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Apply Range
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => loadData()}
                                    className="p-2 bg-lilac/10 text-lilac hover:bg-lilac hover:text-bg-dark rounded-lg transition-colors flex items-center justify-center"
                                    title="Refresh Data"
                                >
                                    <RefreshCcw size={16} className={`${isLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* ERROR STATE */}
                        {apiError && !data ? (
                            <div className="flex flex-col items-center justify-center p-12 border border-white/10 rounded-xl bg-surface-1">
                                <Lock className="w-12 h-12 text-red-400 mb-4" />
                                <h3 className="text-xl font-bold mb-2">Access Denied / Error</h3>
                                <p className="text-text-subtle text-center max-w-md">{apiError}</p>
                                <button onClick={() => { setUseRealData(false); setIsConnected(false); setApiError(null); loadData(); }} className="mt-6 text-lilac hover:underline">Return to Demo Mode</button>
                            </div>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                    <SummaryCard
                                        icon={<Users className="text-lilac" />}
                                        label="Total Visits"
                                        value={data?.summary?.totalVisits.toLocaleString()}
                                        trend={!useRealData ? "+12%" : undefined}
                                        loading={isLoading}
                                    />
                                    <SummaryCard
                                        icon={<Clock className="text-teal-accent" />}
                                        label="Avg. Duration"
                                        value={data?.summary?.avgDuration}
                                        trend={!useRealData ? "-5%" : undefined}
                                        isNegative
                                        loading={isLoading}
                                    />
                                    <SummaryCard
                                        icon={<Globe className="text-gold-accent" />}
                                        label="Top Location"
                                        value={data?.locations[0]?.country || 'N/A'}
                                        loading={isLoading}
                                    />
                                    <SummaryCard
                                        icon={<Smartphone className="text-pink-400" />}
                                        label="Top Device"
                                        value={data?.devices[0]?.device || 'N/A'}
                                        loading={isLoading}
                                    />
                                </div>

                                {/* Main Charts Area */}
                                {/* Main Charts Area */}
                                <div className="flex flex-col gap-6">

                                    {/* 1. Visual Traffic Trend */}
                                    <div className="bg-surface-1 p-6 rounded-2xl border border-white/5 shadow-xl relative min-h-[400px]">
                                        <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                                            <Calendar size={20} className="text-lilac" />
                                            Visual Traffic Trend
                                        </h3>

                                        {isLoading ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-surface-1/50 backdrop-blur-sm rounded-2xl z-10 border border-white/5">
                                                <RefreshCcw className="animate-spin text-lilac" size={32} />
                                            </div>
                                        ) : (
                                            <div className="h-[250px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={data?.dailyVisits} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="colorID" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#C0A0FF" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#C0A0FF" stopOpacity={0} />
                                                            </linearGradient>
                                                            <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#81F4FF" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#81F4FF" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                        <XAxis
                                                            dataKey="date"
                                                            stroke="#B4B4C5"
                                                            tick={{ fill: '#B4B4C5', fontSize: 10 }}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            interval="preserveStartEnd"
                                                            dy={10}
                                                        />
                                                        <YAxis
                                                            stroke="#B4B4C5"
                                                            tick={{ fill: '#B4B4C5', fontSize: 10 }}
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="visitsID"
                                                            name="Indonesia"
                                                            stroke="#C0A0FF"
                                                            strokeWidth={3}
                                                            fillOpacity={1}
                                                            fill="url(#colorID)"
                                                            animationDuration={1500}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="visitsGlobal"
                                                            name="Global (Others)"
                                                            stroke="#81F4FF"
                                                            strokeWidth={3}
                                                            fillOpacity={1}
                                                            fill="url(#colorGlobal)"
                                                            animationDuration={1500}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. Service Engagement Section */}
                                    <div className="bg-surface-1 rounded-2xl border border-white/5 shadow-xl overflow-hidden relative min-h-[300px]">
                                        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <h3 className="text-xl font-serif flex items-center gap-2">
                                                <BarChart2 size={20} className="text-gold-accent" />
                                                Service Engagement
                                            </h3>
                                            <div className="flex bg-bg-dark rounded-lg p-1 border border-white/10">
                                                <button
                                                    onClick={() => setServiceTab('ID')}
                                                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${serviceTab === 'ID'
                                                        ? 'bg-lilac text-bg-dark shadow'
                                                        : 'text-text-subtle hover:text-white'
                                                        }`}
                                                >
                                                    Indonesia (IDR)
                                                </button>
                                                <button
                                                    onClick={() => setServiceTab('Global')}
                                                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${serviceTab === 'Global'
                                                        ? 'bg-lilac text-bg-dark shadow'
                                                        : 'text-text-subtle hover:text-white'
                                                        }`}
                                                >
                                                    Global (USD)
                                                </button>
                                            </div>
                                        </div>

                                        {isLoading ? (
                                            <div className="absolute inset-0 top-[80px] flex items-center justify-center bg-surface-1/50 backdrop-blur-sm z-10 border-t border-white/5">
                                                <RefreshCcw className="animate-spin text-gold-accent" size={32} />
                                            </div>
                                        ) : (
                                            <div className="p-6 overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="text-xs text-text-subtle uppercase border-b border-white/5">
                                                            <th className="py-3 font-semibold pb-4">Service Name</th>
                                                            <th className="py-3 font-semibold pb-4 text-right">Click Count</th>
                                                            <th className="py-3 font-semibold pb-4 text-right">Est. Revenue Potential</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-sm">
                                                        {(serviceTab === 'ID' ? data?.topServicesID : data?.topServicesGlobal)?.map((service, idx) => (
                                                            <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                                                                <td className="py-4 font-medium text-text-light group-hover:text-lilac transition-colors">
                                                                    {service.name}
                                                                </td>
                                                                <td className="py-4 text-right font-mono text-text-subtle">
                                                                    {service.clicks}
                                                                </td>
                                                                <td className="py-4 text-right font-mono text-gold-accent">
                                                                    {serviceTab === 'Global' ? '$' : 'Rp '}
                                                                    {service.revenuePotential.toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Geography Breakdown (Moved Bottom) */}
                                    <div className="bg-surface-1 p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col relative min-h-[400px]">
                                        <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                                            <Globe size={20} className="text-teal-accent" />
                                            Geography
                                        </h3>

                                        {isLoading ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-surface-1/50 backdrop-blur-sm rounded-2xl z-10 border border-white/5">
                                                <RefreshCcw className="animate-spin text-teal-accent" size={32} />
                                            </div>
                                        ) : (
                                            <div className="space-y-5 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                                                {data?.locations.map((loc, idx) => (
                                                    <div key={idx} className="group cursor-pointer">
                                                        <div className="flex justify-between text-sm mb-2">
                                                            <span className="text-text-light font-medium group-hover:text-teal-accent transition-colors">{loc.city}, {loc.country}</span>
                                                            <span className="text-text-subtle font-mono text-xs">{loc.count}</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-teal-accent to-teal-dark rounded-full transition-all duration-1000 ease-out"
                                                                style={{ width: `${(loc.count / (data.locations[0]?.count || 1)) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>

            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 fade-in duration-300 z-50 border ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="font-bold text-sm">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

const SummaryCard = ({ icon, label, value, trend, isNegative, loading }: any) => (
    <div className="bg-surface-1 p-5 rounded-xl border border-white/5 flex flex-col gap-2 hover:border-lilac/30 transition-all group min-h-[140px] relative overflow-hidden">
        {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-1 z-10">
                <div className="flex flex-col gap-3 w-full px-5">
                    <div className="w-8 h-8 bg-white/5 rounded-lg animate-pulse" />
                    <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
                    <div className="h-8 w-32 bg-white/5 rounded animate-pulse" />
                </div>
            </div>
        ) : (
            <>
                <div className="flex justify-between items-start">
                    <div className="p-2 rounded-lg bg-surface-2 group-hover:bg-white/5 transition-colors">
                        {icon}
                    </div>
                    {trend && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isNegative ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                            {trend}
                        </span>
                    )}
                </div>
                <div>
                    <h4 className="text-text-subtle text-xs uppercase tracking-wider font-bold mb-1">{label}</h4>
                    <p className="text-2xl font-bold font-serif text-white">{value}</p>
                </div>
            </>
        )}
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // Calculate Total
        const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

        return (
            <div className="bg-[#20202A] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                <p className="text-gray-400 text-xs font-bold mb-3 uppercase tracking-wider">{label}</p>
                <div className="space-y-2">
                    {payload.slice(0).reverse().map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-gray-300">{entry.name}</span>
                            </div>
                            <span className="font-bold text-white font-mono">{entry.value}</span>
                        </div>
                    ))}
                    <div className="pt-2 border-t border-white/10 flex justify-between items-center gap-6 mt-2">
                        <span className="text-lilac font-bold text-xs uppercase">Total Visits</span>
                        <span className="text-lilac font-bold text-base font-mono">{total}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default AnalyticsDashboard;

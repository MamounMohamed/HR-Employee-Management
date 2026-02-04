import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRoleEnum } from '../enums/UserRoleEnum';

const Sidebar = ({ isOpen, onToggle, activeView, onViewChange }) => {
    const { user } = useAuth();
    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div 
                    className="sidebar-overlay"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
                {/* Sidebar Header with Branding */}
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="navbar-logo">HR</div>
                        <div className="sidebar-brand-text">
                            <span className="sidebar-brand-title">HR Management</span>
                            <span className="sidebar-brand-subtitle">Navigation</span>
                        </div>
                    </div>
                    <button 
                        className="sidebar-toggle-btn"
                        onClick={onToggle}
                        aria-label="Toggle sidebar"
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Sidebar Navigation */}
                <nav className="sidebar-nav">
                    <button
                        className={`sidebar-nav-btn ${activeView === 'home' ? 'active' : ''}`}
                        onClick={() => {
                            onViewChange('home');
                            if (window.innerWidth < 768) {
                                onToggle();
                            }
                        }}
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                        <span>Home</span>
                    </button>

                    <button
                        className={`sidebar-nav-btn ${activeView === 'reports' ? 'active' : ''}`}
                        onClick={() => {
                            onViewChange('reports');
                            if (window.innerWidth < 768) {
                                onToggle();
                            }
                        }}
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        <span>Reports</span>
                    </button>

                    {user && user.role === UserRoleEnum.HR && (
                        <button
                            className={`sidebar-nav-btn ${activeView === 'employees' ? 'active' : ''}`}
                            onClick={() => {
                                onViewChange('employees');
                                if (window.innerWidth < 768) {
                                    onToggle();
                                }
                            }}
                        >
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            <span>Employees</span>
                        </button>
                    )}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;

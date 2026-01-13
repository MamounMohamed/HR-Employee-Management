import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        addToast('Successfully logged out. See you soon!', 'success');
        navigate('/login');
    };

    const getUserInitials = () => {
        if (!user) return '?';
        return user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    if (!user) return null;

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <a href="#/dashboard" className="navbar-brand">
                    <div className="navbar-logo">HR</div>
                    <span>HR Management</span>
                </a>
                <div className="navbar-menu">
                    <div className="navbar-user">
                        <div className="user-avatar">{getUserInitials()}</div>
                        <div className="user-info">
                            <div className="user-name">{user.name}</div>
                            <div className="user-role">{user.role}</div>
                        </div>
                    </div>
                    <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('auth_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await API.login(email, password);

        if (response.role !== 'hr') {
            throw { message: 'Access denied. Only HR users can access this system.' };
        }

        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setToken(response.token);
        setUser(response.user);
        return response;
    };

    const logout = async () => {
        try {
            await API.logout();
        } catch (error) {
            console.error('Logout error', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
        }
    };

    const isHR = () => {
        return user?.role === 'hr';
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, isHR }}>
            {loading ? (
                <div className="loading-overlay" style={{ background: 'var(--color-bg-primary)' }}>
                    <div className="loading-spinner"></div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

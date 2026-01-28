import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { WorkLogProvider } from './context/WorkLogContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import '../css/app.css';
import './bootstrap';

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <WorkLogProvider>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </WorkLogProvider>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />);

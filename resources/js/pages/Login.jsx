import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

const Login = () => {
    const { login, token } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    // Setup form hook
    const { register, handleSubmit, formState: { errors, isSubmitting, isValid }, setError: setFormError } = useForm({
        mode: 'onChange'
    });

    if (token) {
        return <Navigate to="/dashboard" replace />;
    }

    const onSubmit = async (data) => {
        try {
            await login(data.email, data.password);
            addToast('Successfully signed in! Welcome back.', 'success');
            navigate('/dashboard');
        } catch (err) {
            if (err.errors) {
                // Map backend validation errors (e.g. { email: ['error'] }) to form fields
                Object.keys(err.errors).forEach(key => {
                    setFormError(key, {
                        type: 'manual',
                        message: err.errors[key][0]
                    });
                });
                addToast(err?.message || 'Please check the form for errors.', 'error');
            } else {
                addToast(err.message || 'Login failed. Please try again.', 'error');
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">HR</div>
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Sign in to access the HR Management System</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            placeholder="hr@example.com"
                            autoComplete="email"
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: "Please enter a valid email address"
                                }
                            })}
                        />
                        {errors.email && <span className="form-error">{errors.email.message}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className={`form-input ${errors.password ? 'error' : ''}`}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            {...register("password", { required: "Password is required" })}
                        />
                        {errors.password && <span className="form-error">{errors.password.message}</span>}
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting || !isValid}>
                        <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
                        {isSubmitting && <span className="spinner"></span>}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Test Credentials:</p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                        <strong>HR:</strong> hr@example.com / password123<br />
                        <strong>Employee:</strong> john@example.com / password123
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

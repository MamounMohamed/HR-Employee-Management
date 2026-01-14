import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="auth-container">
            <div className="auth-card text-center">
                <div className="auth-header">
                    <div className="auth-logo">404</div>
                    <h1 className="auth-title">Page Not Found</h1>
                    <p className="auth-subtitle">
                        The page you are looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div style={{ marginTop: 'var(--spacing-xl)' }}>
                    <Link to="/dashboard" className="btn btn-primary btn-full">
                        Back to Dashboard
                    </Link>
                </div>

                <p style={{
                    marginTop: 'var(--spacing-lg)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-tertiary)'
                }}>
                    Error Code: 404
                </p>
            </div>
        </div>
    );
};

export default NotFound;

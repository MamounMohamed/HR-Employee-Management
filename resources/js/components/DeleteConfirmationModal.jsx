import React, { useState } from 'react';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';

const DeleteConfirmationModal = ({ employee, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();

    if (user && user.id === employee.id) {
        // This should technically be prevented by the UI logic before opening modal,
        // but good as a safety check
        return null;
    }

    const handleDelete = async () => {
        setLoading(true);
        setError('');
        try {
            await API.deactivateEmployee(employee.id);
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to deactivate employee');
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay active" onClick={(e) => { if (e.target.className.includes('modal-overlay')) onClose(); }}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Confirm Deactivation</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', background: 'hsla(0, 84%, 60%, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="32" height="32" fill="none" stroke="var(--color-error)" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Deactivate Employee?</h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                            Are you sure you want to deactivate <strong>{employee.name}</strong>? This action will mark the employee as inactive and soft delete their record.
                        </p>

                        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary btn-full" onClick={onClose}>Cancel</button>
                            <button className="btn btn-danger btn-full" onClick={handleDelete} disabled={loading}>
                                <span>{loading ? 'Deactivating...' : 'Deactivate'}</span>
                                {loading && <span className="spinner"></span>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;

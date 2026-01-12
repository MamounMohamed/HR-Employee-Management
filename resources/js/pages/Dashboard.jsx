import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import EmployeeModal from '../components/EmployeeModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const Dashboard = () => {
    const { user } = useAuth();

    // Active Employees State
    const [employees, setEmployees] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    // Inactive Employees State
    const [inactiveEmployees, setInactiveEmployees] = useState([]);
    const [inactiveMeta, setInactiveMeta] = useState({});
    const [inactiveLoading, setInactiveLoading] = useState(true);
    const [inactivePage, setInactivePage] = useState(1);

    // Shared State
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [error, setError] = useState('');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
            setInactivePage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const loadEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, per_page: 15, search: debouncedSearch };
            const response = await API.getEmployees(params);
            setEmployees(response.data);
            setMeta(response.meta);
        } catch (err) {
            console.error(err);
            setError('Failed to load employees');
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    const loadInactiveEmployees = useCallback(async () => {
        setInactiveLoading(true);
        try {
            const params = { page: inactivePage, per_page: 5, search: debouncedSearch, only_inactive: 1 };
            const response = await API.getEmployees(params);
            setInactiveEmployees(response.data);
            setInactiveMeta(response.meta);
        } catch (err) {
            console.error(err);
        } finally {
            setInactiveLoading(false);
        }
    }, [inactivePage, debouncedSearch]);

    useEffect(() => {
        loadEmployees();
    }, [loadEmployees]);

    useEffect(() => {
        loadInactiveEmployees();
    }, [loadInactiveEmployees]);

    const refreshData = () => {
        loadEmployees();
        loadInactiveEmployees();
    };

    const handleEdit = (employee) => {
        setSelectedEmployee(employee);
        setShowModal(true);
    };

    const handleDeleteClick = (employee) => {
        setEmployeeToDelete(employee);
        setShowDeleteModal(true);
    };

    const handleCreate = () => {
        setSelectedEmployee(null);
        setShowModal(true);
    };

    const Pagination = ({ meta, onPageChange }) => {
        if (!meta.last_page) return null;

        const range = (start, end) => {
            return [...Array(end - start + 1).keys()].map(i => i + start);
        };

        return (
            <div className="pagination" style={{ flexDirection: 'column', gap: '1rem' }}>
                <span className="pagination-info">
                    Showing {meta.from || 0}-{meta.to || 0} of {meta.total} results
                </span>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        className="pagination-btn"
                        disabled={meta.current_page === 1}
                        onClick={() => onPageChange(meta.current_page - 1)}
                    >
                        Previous
                    </button>

                    {range(1, meta.last_page).map((page) => (
                        <button
                            key={page}
                            className={`pagination-btn ${meta.current_page === page ? 'active' : ''}`}
                            onClick={() => onPageChange(page)}
                            style={{ minWidth: '40px' }}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        className="pagination-btn"
                        disabled={meta.current_page === meta.last_page}
                        onClick={() => onPageChange(meta.current_page + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
            <Navbar />

            <div className="page-wrapper">
                <div className="dashboard">
                    <div className="container">
                        <div className="dashboard-header">
                            <h1 className="dashboard-title">Employee Management</h1>
                            <p className="dashboard-subtitle">Manage and view all employees in the system</p>

                            <div className="dashboard-actions">
                                <div className="search-bar">
                                    <svg className="search-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Search by name, email, or department..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <button className="btn btn-primary" onClick={handleCreate}>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                    Add Employee
                                </button>
                            </div>
                        </div>

                        {/* Active Employees Table */}
                        <div className="table-container">
                            {loading ? (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>
                                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                                    <p style={{ marginTop: '1rem', color: 'var(--color-text-tertiary)' }}>Loading employees...</p>
                                </div>
                            ) : employees.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">👥</div>
                                    <h3 className="empty-state-title">No employees found</h3>
                                    <p>{debouncedSearch ? 'Try adjusting your search terms' : 'No employees in the system yet'}</p>
                                </div>
                            ) : (
                                <>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Department</th>
                                                <th>Status</th>
                                                <th>Joined</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employees.map(emp => (
                                                <tr key={emp.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                                                                {emp.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                                                            </div>
                                                            <strong>{emp.name}</strong>
                                                            {user && user.id === emp.id && (
                                                                <span className="badge badge-primary" style={{ marginLeft: '0.5rem', fontSize: '0.625rem' }}>You</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>{emp.email}</td>
                                                    <td>
                                                        {emp.role === 'hr' ? (
                                                            <span className="badge badge-primary">HR</span>
                                                        ) : (
                                                            <span className="badge badge-secondary">Employee</span>
                                                        )}
                                                    </td>
                                                    <td>{emp.department || <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>}</td>
                                                    <td>
                                                        {emp.status === 'active' ? (
                                                            <span className="badge badge-success"><span className="badge-dot"></span>Active</span>
                                                        ) : (
                                                            <span className="badge badge-error"><span className="badge-dot"></span>Inactive</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {new Date(emp.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric', month: 'short', day: 'numeric'
                                                        })}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div className="action-buttons">
                                                            <button className="btn-icon btn-edit" title="Edit Employee" onClick={() => handleEdit(emp)}>
                                                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                                </svg>
                                                            </button>
                                                            {user && user.id !== emp.id ? (
                                                                <button className="btn-icon btn-delete" title="Deactivate Employee" onClick={() => handleDeleteClick(emp)}>
                                                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                                    </svg>
                                                                </button>
                                                            ) : (
                                                                <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem', padding: '0 0.5rem' }}>—</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <Pagination meta={meta} onPageChange={setPage} />
                                </>
                            )}
                        </div>

                        {/* Inactive Employees Section */}
                        <div id="inactive-section" style={{ marginTop: '4rem' }}>
                            <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
                                <h2 className="dashboard-title" style={{ fontSize: '1.5rem' }}>Past Inactive Employees</h2>
                                <p className="dashboard-subtitle" style={{ fontSize: '0.875rem' }}>Archive of deactivated employee records</p>
                            </div>
                            <div className="table-container" style={{ opacity: 0.8 }}>
                                {inactiveLoading ? (
                                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                                        <div className="loading-spinner" style={{ margin: '0 auto', width: '40px', height: '40px', borderWidth: '3px' }}></div>
                                        <p style={{ marginTop: '1rem', color: 'var(--color-text-tertiary)' }}>Loading archive...</p>
                                    </div>
                                ) : inactiveEmployees.length === 0 ? (
                                    <div className="empty-state" style={{ padding: '2rem' }}>
                                        <p style={{ color: 'var(--color-text-tertiary)' }}>No inactive employees matching search.</p>
                                    </div>
                                ) : (
                                    <>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                    <th>Department</th>
                                                    <th>Status</th>
                                                    <th>Joined</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {inactiveEmployees.map(emp => (
                                                    <tr key={emp.id} style={{ color: 'var(--color-text-tertiary)' }}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem', background: 'var(--color-surface)', color: 'var(--color-text-tertiary)' }}>
                                                                    {emp.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                                                                </div>
                                                                {emp.name}
                                                            </div>
                                                        </td>
                                                        <td>{emp.email}</td>
                                                        <td>
                                                            {emp.role === 'hr' ? <span className="badge badge-primary">HR</span> : <span className="badge badge-secondary">Employee</span>}
                                                        </td>
                                                        <td>{emp.department || '—'}</td>
                                                        <td><span className="badge badge-secondary" style={{ opacity: 0.6 }}>Inactive</span></td>
                                                        <td>
                                                            {new Date(emp.created_at).toLocaleDateString('en-US', {
                                                                year: 'numeric', month: 'short', day: 'numeric'
                                                            })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <Pagination meta={inactiveMeta} onPageChange={setInactivePage} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <EmployeeModal
                    employee={selectedEmployee}
                    onClose={() => setShowModal(false)}
                    onSuccess={refreshData}
                />
            )}

            {showDeleteModal && (
                <DeleteConfirmationModal
                    employee={employeeToDelete}
                    onClose={() => setShowDeleteModal(false)}
                    onSuccess={refreshData}
                />
            )}
        </>
    );
};

export default Dashboard;

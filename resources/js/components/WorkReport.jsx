import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WorkLogStatusEnum } from '../enums/WorkLogStatusEnum';
import { UserRoleEnum } from '../enums/UserRoleEnum';

const WorkReport = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    
    // Get date 7 days ago as default start date
    const getDefaultStartDate = () => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date.toISOString().split('T')[0];
    };

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const [startDate, setStartDate] = useState(getDefaultStartDate());
    const [endDate, setEndDate] = useState(getTodayDate());
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [employeesLoading, setEmployeesLoading] = useState(false);

    // Load employees list for HR users (fetch all pages)
    useEffect(() => {
        if (user && user.role === UserRoleEnum.HR) {
            const loadAllEmployees = async () => {
                setEmployeesLoading(true);
                try {
                    let allEmployees = [];
                    let currentPage = 1;
                    let hasMorePages = true;

                    // Fetch all pages
                    while (hasMorePages) {
                        const response = await API.getEmployees({ 
                            per_page: 100, // Max allowed by backend
                            page: currentPage 
                        });
                        
                        allEmployees = [...allEmployees, ...response.data];
                        
                        // Check if there are more pages
                        hasMorePages = response.meta && response.meta.current_page < response.meta.last_page;
                        currentPage++;
                    }

                    setEmployees(allEmployees);
                } catch (err) {
                    addToast(err.message || 'Failed to load employees', 'error');
                } finally {
                    setEmployeesLoading(false);
                }
            };
            loadAllEmployees();
        }
    }, [user, addToast]);

    // Fetch report data
    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const userId = user.role === UserRoleEnum.HR ? selectedUserId : null;
            const response = await API.getWorkReport(startDate, endDate, userId);
            setReportData(response.data);
        } catch (err) {
            addToast(err.message || 'Failed to load work report', 'error');
            setReportData(null);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, selectedUserId, user, addToast]);

    // Load report on mount
    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showEmployeeDropdown && !event.target.closest('.employee-search-container')) {
                setShowEmployeeDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmployeeDropdown]);

    // Calculate total hours from work logs
    const calculateTotalHours = () => {
        if (!reportData || !reportData.work_logs) return { hours: 0, minutes: 0 };
        
        const logs = Object.values(reportData.work_logs);
        const totalMinutes = logs.reduce((sum, log) => sum + (log.total_minutes || 0), 0);
        
        return {
            hours: Math.floor(totalMinutes / 60),
            minutes: totalMinutes % 60
        };
    };

    // Format time as HH:MM
    const formatTime = (hours, minutes) => {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            weekday: 'short'
        });
    };

    const handleGenerateReport = () => {
        fetchReport();
    };

    // Handle employee search input
    const handleEmployeeSearchChange = (e) => {
        const value = e.target.value;
        setEmployeeSearch(value);
        setShowEmployeeDropdown(true);
        
        // Clear selection if user is typing
        if (selectedUserId) {
            setSelectedUserId(null);
            setSelectedEmployeeName('');
        }
    };

    // Handle employee selection from dropdown
    const handleEmployeeSelect = (employee) => {
        setSelectedUserId(employee.id);
        setSelectedEmployeeName(employee.name);
        setEmployeeSearch(employee.name);
        setShowEmployeeDropdown(false);
    };

    // Clear employee selection
    const handleClearEmployee = () => {
        setSelectedUserId(null);
        setSelectedEmployeeName('');
        setEmployeeSearch('');
        setShowEmployeeDropdown(false);
    };

    // Filter employees based on search
    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        (emp.department && emp.department.toLowerCase().includes(employeeSearch.toLowerCase())) ||
        emp.email.toLowerCase().includes(employeeSearch.toLowerCase())
    );

    const workLogs = reportData?.work_logs ? Object.entries(reportData.work_logs).sort((a, b) => b[0].localeCompare(a[0])) : [];
    const totalHours = calculateTotalHours();

    return (
        <div className="table-container" style={{ marginBottom: '2rem' }}>
            <div style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>
                    Work Report
                </h2>

                {/* Filters */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: user?.role === UserRoleEnum.HR ? 'repeat(auto-fit, minmax(200px, 1fr))' : 'repeat(2, 1fr)',
                    gap: '1rem', 
                    marginBottom: '1.5rem',
                    maxWidth: '800px'
                }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            From Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            max={endDate}
                            className="search-input"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            To Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            max={getTodayDate()}
                            className="search-input"
                            style={{ width: '100%' }}
                        />
                    </div>


                    {user?.role === UserRoleEnum.HR && (
                        <div style={{ position: 'relative' }} className="employee-search-container">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                Employee
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={employeeSearch}
                                    onChange={handleEmployeeSearchChange}
                                    onFocus={() => setShowEmployeeDropdown(true)}
                                    placeholder="Search employees..."
                                    className="search-input"
                                    style={{ width: '100%', paddingRight: '2.5rem' }}
                                    disabled={employeesLoading}
                                />
                                {employeeSearch && (
                                    <button
                                        onClick={handleClearEmployee}
                                        style={{
                                            position: 'absolute',
                                            right: '0.5rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '0.25rem',
                                            color: 'var(--color-text-tertiary)',
                                            fontSize: '1.25rem',
                                            lineHeight: 1
                                        }}
                                        title="Clear selection"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            
                            {/* Autocomplete Dropdown */}
                            {showEmployeeDropdown && employeeSearch && filteredEmployees.length > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    maxHeight: '250px',
                                    overflowY: 'auto',
                                    background: 'var(--color-background)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    marginTop: '0.25rem',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                    zIndex: 1000
                                }}>
                                    {filteredEmployees.slice(0, 20).map(emp => (
                                        <div
                                            key={emp.id}
                                            onClick={() => handleEmployeeSelect(emp)}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid var(--color-border)',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ fontWeight: '500' }}>{emp.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                {emp.email} • {emp.department || 'No Department'}
                                            </div>
                                        </div>
                                    ))}
                                    {filteredEmployees.length > 20 && (
                                        <div style={{ 
                                            padding: '0.5rem 1rem', 
                                            fontSize: '0.75rem', 
                                            color: 'var(--color-text-tertiary)',
                                            textAlign: 'center'
                                        }}>
                                            Showing first 20 results. Keep typing to narrow down...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}


                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button 
                            className="btn btn-primary" 
                            onClick={handleGenerateReport}
                            disabled={loading}
                            style={{ width: '100%' }}
                        >
                            {loading ? 'Generating...' : 'Generate Report'}
                        </button>
                    </div>
                </div>

                {/* Report Display */}
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                        <p style={{ marginTop: '1rem', color: 'var(--color-text-tertiary)' }}>Loading report...</p>
                    </div>
                ) : !reportData ? (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                        <p style={{ color: 'var(--color-text-tertiary)' }}>No report data available</p>
                    </div>
                ) : (
                    <>
                        {/* Employee Info */}
                        {reportData.user && (
                            <div style={{ 
                                marginBottom: '1.5rem', 
                                padding: '1rem', 
                                background: 'var(--color-surface)',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div className="user-avatar" style={{ width: '40px', height: '40px' }}>
                                        {reportData.user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>{reportData.user.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            {reportData.user.email} • {reportData.user.department || 'No Department'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Work Logs Table */}
                        {workLogs.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📅</div>
                                <h3 className="empty-state-title">No work logs found</h3>
                                <p>No work activity recorded for the selected date range</p>
                            </div>
                        ) : (
                            <>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Hours Worked</th>
                                            <th>Status</th>
                                            <th>Last Activity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workLogs.map(([date, log]) => (
                                            <tr key={date}>
                                                <td>
                                                    <strong>{formatDate(date)}</strong>
                                                </td>
                                                <td>
                                                    <span style={{ fontFamily: 'monospace', fontSize: '1rem' }}>
                                                        {formatTime(log.hours, log.minutes)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {log.last_status === WorkLogStatusEnum.RUNNING ? (
                                                        <span className="badge badge-success">
                                                            <span className="badge-dot"></span>Active
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-secondary">Ended</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {log.last_status_time ? new Date(log.last_status_time).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ 
                                            fontWeight: 'bold', 
                                            background: 'var(--color-surface)',
                                            borderTop: '2px solid var(--color-border)'
                                        }}>
                                            <td>Total</td>
                                            <td>
                                                <span style={{ fontFamily: 'monospace', fontSize: '1.125rem', color: 'var(--color-primary)' }}>
                                                    {formatTime(totalHours.hours, totalHours.minutes)}
                                                </span>
                                            </td>
                                            <td colSpan="2">
                                                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                                    {workLogs.length} day{workLogs.length !== 1 ? 's' : ''} recorded
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default WorkReport;

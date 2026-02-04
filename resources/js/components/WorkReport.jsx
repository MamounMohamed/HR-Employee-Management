import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRoleEnum } from '../enums/UserRoleEnum';
import { useWorkLog } from '../context/WorkLogContext';

const WorkReport = ({ onDaySelect }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const { refreshTrigger } = useWorkLog();
    
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
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    
    // Live mode state for HR viewing working employees
    const [liveStatus, setLiveStatus] = useState(null); // { is_running, created_at }
    const [liveElapsedMinutes, setLiveElapsedMinutes] = useState(0);
    const timerIntervalRef = useRef(null);
    const statusCheckIntervalRef = useRef(null);

    // Check if date is today
    const isToday = (dateString) => {
        return dateString === getTodayDate();
    };

    // Calculate elapsed minutes from start time
    const calculateElapsedMinutes = (startTime) => {
        if (!startTime) return 0;
        const start = new Date(startTime);
        const now = new Date();
        return Math.floor((now - start) / (1000 * 60));
    };

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
        // Stop live mode when fetching new data
        stopLiveMode();
        
        try {
            const userId = user.role === UserRoleEnum.HR ? selectedUserId : null;
            const response = await API.getWorkReport(startDate, endDate, userId, page, perPage);
            setReportData(response);
            
            // For HR viewing a specific employee, check if they're currently working
            if (user.role === UserRoleEnum.HR && selectedUserId) {
                await checkLiveStatus(selectedUserId);
            }
        } catch (err) {
            addToast(err.message || 'Failed to load work report', 'error');
            setReportData(null);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, selectedUserId, user, addToast, page, perPage]);

    // Check live status for a user
    const checkLiveStatus = async (userId) => {
        if (!userId) return;
        
        // Initial check
        await performStatusCheck(userId);
        
        // Start continuous polling (every 10 seconds)
        if (!statusCheckIntervalRef.current) {
            statusCheckIntervalRef.current = setInterval(async () => {
                await performStatusCheck(userId);
            }, 10000);
        }
    };

    // Perform the status check and update UI state accordingly
    const performStatusCheck = async (userId) => {
        try {
            const response = await API.getLatestWorkLogStatus(userId);
            const { is_running, created_at } = response.data;
            
            setLiveStatus(response.data);
            
            if (is_running && created_at) {
                // User is working: ensure timer is running
                if (!timerIntervalRef.current) {
                    setLiveElapsedMinutes(calculateElapsedMinutes(created_at));
                    timerIntervalRef.current = setInterval(() => {
                        setLiveElapsedMinutes(calculateElapsedMinutes(created_at));
                    }, 1000);
                }
            } else {
                // User is NOT working: stop timer but KEEP polling
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                    timerIntervalRef.current = null;
                    
                    // Fetch fresh report data to ensure we have the latest static data
                    const reportResponse = await API.getWorkReport(startDate, endDate, userId, page, perPage);
                    setReportData(reportResponse);
                }
                setLiveElapsedMinutes(0);
            }
        } catch (err) {
            console.error('Failed to check live status:', err);
        }
    };

    // Stop all live mode activities (polling and timer)
    // Called only when unmounting or changing filters/employees
    const stopLiveMode = () => {
        setLiveStatus(null);
        setLiveElapsedMinutes(0);
        
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        if (statusCheckIntervalRef.current) {
            clearInterval(statusCheckIntervalRef.current);
            statusCheckIntervalRef.current = null;
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopLiveMode();
        };
    }, []);

    // Load report on mount or when refresh is triggered
    useEffect(() => {
        fetchReport();
    }, [fetchReport, refreshTrigger]);

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

    // Calculate total hours from work logs (including live time)
    const calculateTotalHours = () => {
        if (!reportData || !reportData.data) return { hours: 0, minutes: 0 };
        
        const logs = reportData.data;
        let totalMinutes = logs.reduce((sum, log) => sum + (log.time_worked_minutes || 0), 0);
        
        // Add live elapsed time if user is working
        if (liveStatus?.is_running) {
            totalMinutes += liveElapsedMinutes;
        }
        
        return {
            hours: Math.floor(totalMinutes / 60),
            minutes: totalMinutes % 60
        };
    };

    // Get displayed time for a log row (live or static)
    const getDisplayedMinutes = (log) => {
        if (isToday(log.work_date) && liveStatus?.is_running) {
            return (log.time_worked_minutes || 0) + liveElapsedMinutes;
        }
        return log.time_worked_minutes || 0;
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
        setPage(1); // Reset to first page on new filter
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
            stopLiveMode(); // Stop live mode when changing employee
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
        stopLiveMode();
    };

    // Handle row click to navigate to day details page
    const handleRowClick = (log) => {
        if (onDaySelect) {
            onDaySelect(log);
        }
    };

    // Filter employees based on search
    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        (emp.department && emp.department.toLowerCase().includes(employeeSearch.toLowerCase())) ||
        emp.email.toLowerCase().includes(employeeSearch.toLowerCase())
    );

    const workLogs = reportData?.data || [];
    const totalHours = calculateTotalHours();
    const meta = reportData?.meta || {};

    const Pagination = ({ meta, onPageChange }) => {
        if (!meta.last_page || meta.last_page <= 1) return null;

        const range = (start, end) => {
            return [...Array(end - start + 1).keys()].map(i => i + start);
        };

        return (
            <div className="pagination" style={{ flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span className="pagination-info">
                        Showing {meta.from || 0}-{meta.to || 0} of {meta.total} results
                    </span>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         <select 
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setPage(1);
                            }}
                            className="search-input"
                            style={{ padding: '0.25rem 0.5rem' }}
                        >
                            <option value={5}>5 per page</option>
                            <option value={15}>15 per page</option>
                            <option value={30}>30 per page</option>
                            <option value={50}>50 per page</option>
                        </select>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="pagination-btn"
                                disabled={meta.current_page === 1}
                                onClick={() => onPageChange(meta.current_page - 1)}
                            >
                                Previous
                            </button>

                            {range(1, meta.last_page).map((p) => (
                                <button
                                    key={p}
                                    className={`pagination-btn ${meta.current_page === p ? 'active' : ''}`}
                                    onClick={() => onPageChange(p)}
                                    style={{ minWidth: '32px' }}
                                >
                                    {p}
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
                </div>
            </div>
        );
    };

    return (
        <div className="table-container" style={{ marginBottom: '2rem' }}>
            <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--color-text-primary)' }}>
                        Work Report
                    </h2>
                    {liveStatus?.is_running && (
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%)',
                            border: '1px solid rgba(34, 197, 94, 0.4)',
                            color: 'rgb(34, 197, 94)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'rgb(34, 197, 94)',
                                animation: 'pulse 1s infinite'
                            }}></span>
                            {selectedEmployeeName || 'User'} is working
                        </span>
                    )}
                </div>

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
                        {/* Work Logs Table */}
                        {workLogs.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📅</div>
                                <h3 className="empty-state-title">No work logs found</h3>
                                <p>No work activity recorded for the selected date range</p>
                            </div>
                        ) : (
                            <>
                                {/* Hint for clickable rows */}
                                <p style={{ 
                                    fontSize: '0.875rem', 
                                    color: 'var(--color-text-tertiary)', 
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span>💡</span> Click on any row to view detailed breakdown
                                </p>

                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Hours Worked</th>
                                            <th>Notes</th>
                                            <th style={{ width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workLogs.map((log) => {
                                            const isLiveRow = isToday(log.work_date) && liveStatus?.is_running;
                                            const displayedMins = getDisplayedMinutes(log);
                                            
                                            return (
                                                <tr 
                                                    key={log.id}
                                                    onClick={() => handleRowClick(log)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s',
                                                        background: isLiveRow ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%)' : ''
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = isLiveRow 
                                                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)'
                                                        : 'var(--color-surface-hover)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = isLiveRow 
                                                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%)'
                                                        : ''}
                                                >
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <strong>{formatDate(log.work_date)}</strong>
                                                            {isLiveRow && (
                                                                <span style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.25rem',
                                                                    background: 'rgba(34, 197, 94, 0.2)',
                                                                    color: 'rgb(34, 197, 94)',
                                                                    padding: '0.125rem 0.5rem',
                                                                    borderRadius: '10px',
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: '700'
                                                                }}>
                                                                    <span style={{
                                                                        width: '6px',
                                                                        height: '6px',
                                                                        borderRadius: '50%',
                                                                        background: 'rgb(34, 197, 94)',
                                                                        animation: 'pulse 1s infinite'
                                                                    }}></span>
                                                                    LIVE
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ 
                                                            fontFamily: 'monospace', 
                                                            fontSize: '1rem',
                                                            color: isLiveRow ? 'rgb(34, 197, 94)' : 'inherit',
                                                            fontWeight: isLiveRow ? '600' : 'normal'
                                                        }}>
                                                            {formatTime(Math.floor(displayedMins / 60), displayedMins % 60)}
                                                        </span>
                                                        {isLiveRow && (
                                                            <span style={{ 
                                                                marginLeft: '0.5rem', 
                                                                fontSize: '0.7rem', 
                                                                color: 'var(--color-text-tertiary)' 
                                                            }}>
                                                                (updating...)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ maxWidth: '300px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                        {log.notes || '-'}
                                                    </td>
                                                    <td>
                                                        <span style={{ 
                                                            color: 'var(--color-primary)', 
                                                            fontSize: '1.25rem' 
                                                        }}>
                                                            →
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ 
                                            fontWeight: 'bold', 
                                            background: 'var(--color-surface)',
                                            borderTop: '2px solid var(--color-border)'
                                        }}>
                                            <td>Total</td>
                                            <td>
                                                <span style={{ 
                                                    fontFamily: 'monospace', 
                                                    fontSize: '1.125rem', 
                                                    color: liveStatus?.is_running ? 'rgb(34, 197, 94)' : 'var(--color-primary)' 
                                                }}>
                                                    {formatTime(totalHours.hours, totalHours.minutes)}
                                                </span>
                                                {liveStatus?.is_running && (
                                                    <span style={{ 
                                                        marginLeft: '0.5rem', 
                                                        fontSize: '0.7rem', 
                                                        color: 'var(--color-text-tertiary)' 
                                                    }}>
                                                        (live)
                                                    </span>
                                                )}
                                            </td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>

                                <Pagination meta={meta} onPageChange={setPage} />
                            </>
                        )}
                    </>
                )}
            </div>

            {/* CSS for animations */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.95); }
                }
            `}</style>
        </div>
    );
};

export default WorkReport;

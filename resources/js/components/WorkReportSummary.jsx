import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API } from '../api';
import { useToast } from '../context/ToastContext';
import { useWorkLog } from '../context/WorkLogContext';
import { WorkLogStatusEnum } from '../enums/WorkLogStatusEnum';

const WorkReportSummary = () => {
    const { addToast } = useToast();
    const { currentWorkLog: contextWorkLog, refreshTrigger } = useWorkLog();
    const [reportData, setReportData] = useState(null);
    const [currentWorkLog, setCurrentWorkLog] = useState(null);
    const [loading, setLoading] = useState(false);

    // Live timer state
    const [liveTotalMinutes, setLiveTotalMinutes] = useState(0);
    const timerIntervalRef = useRef(null);
    const lastStatusRef = useRef(null);

    // Get date 6 days ago as start date
    const getStartDate = () => {
        const date = new Date();
        date.setDate(date.getDate() - 6);
        return date.toISOString().split('T')[0];
    };

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Fetch current work log status
    const fetchCurrentWorkLog = useCallback(async () => {
        try {
            const response = await API.getWorkLog();
            setCurrentWorkLog(response.data);
        } catch (err) {
            // Silently fail - this is a background update
            console.error('Failed to fetch current work log:', err);
        }
    }, []);

    // Fetch report data for  (today + 6 days before)
    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const startDate = getStartDate();
            const endDate = getTodayDate();
            const response = await API.getWorkReport(startDate, endDate, null);
            setReportData(response.data);
        } catch (err) {
            addToast(err.message || 'Failed to load work report', 'error');
            setReportData(null);
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchReport();
        fetchCurrentWorkLog();
    }, [fetchReport, fetchCurrentWorkLog, refreshTrigger]);

    // Listen for work log updates from context
    useEffect(() => {
        if (contextWorkLog) {
            setCurrentWorkLog(contextWorkLog);
        }
    }, [contextWorkLog, refreshTrigger]);

    // Initialize/Update Live Timer
    useEffect(() => {
        const updateLiveTime = () => {
            if (currentWorkLog && currentWorkLog.last_status === WorkLogStatusEnum.RUNNING) {
                const startTime = new Date(currentWorkLog.last_status_time);
                const now = new Date();
                const elapsedMinutes = Math.floor((now - startTime) / (1000 * 60));
                
                // Base minutes from DB + elapsed minutes
                const total = (currentWorkLog.total_minutes || 0) + elapsedMinutes;
                setLiveTotalMinutes(total);
            } else if (currentWorkLog) {
                // If stopped, just show DB value
                setLiveTotalMinutes(currentWorkLog.total_minutes || 0);
            }
        };

        // Run immediately
        updateLiveTime();

        // Clear existing interval
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }

        // Check if status changed from running to stopped
        if (lastStatusRef.current === WorkLogStatusEnum.RUNNING && 
            currentWorkLog?.last_status !== WorkLogStatusEnum.RUNNING) {
            // Refetch report to ensure we have the final correct time from DB
            fetchReport();
        }
        lastStatusRef.current = currentWorkLog?.last_status;

        // If running, set up interval
        if (currentWorkLog?.last_status === WorkLogStatusEnum.RUNNING) {
            timerIntervalRef.current = setInterval(updateLiveTime, 1000);
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [currentWorkLog, fetchReport]);


    // Format time as HH:MM
    const formatTime = (hours, minutes) => {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Check if it's today
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        }
        // Check if it's yesterday
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }

        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            weekday: 'short'
        });
    };

    const workLogs = Array.isArray(reportData)
        ? reportData
            .sort((a, b) => b.work_date.localeCompare(a.work_date))
            .slice(0, 7) // 
        : [];

    // Function to get status for a work log
    const getStatusBadge = (log) => {
        const today = getTodayDate();
        const isToday = log.work_date === today;
        
        // If it's today and work is running, show "Active" in green
        if (isToday && currentWorkLog && currentWorkLog.last_status === WorkLogStatusEnum.RUNNING) {
            return (
                <span className="badge" style={{ backgroundColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        animation: 'pulse 1s infinite'
                    }}></span>
                    Active
                </span>
            );
        }
        
        // Otherwise show "Ended"
        return <span className="badge badge-secondary">Ended</span>;
    };

    // Calculate total hours
    const totalMinutes = workLogs.reduce((sum, log) => {
        // If this log is for today, use the live calculated time
        if (log.work_date === getTodayDate() && currentWorkLog?.last_status === WorkLogStatusEnum.RUNNING) {
            return sum + liveTotalMinutes;
        }
        return sum + (log.time_worked_minutes || 0);
    }, 0);

    const totalHours = {
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60
    };

    if (loading) {
        return (
            <div className="table-container" style={{ marginBottom: '2rem' }}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem', color: 'var(--color-text-tertiary)' }}>Loading report...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="table-container" style={{ marginBottom: '2rem' }}>
            <div style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>
                    Recent Work Report 
                </h2>

                {workLogs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📅</div>
                        <h3 className="empty-state-title">No work logs found</h3>
                        <p>No work activity recorded for the </p>
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
                                {workLogs.map((log) => {
                                    const isToday = log.work_date === getTodayDate();
                                    const isLive = isToday && currentWorkLog?.last_status === WorkLogStatusEnum.RUNNING;
                                    
                                    // Use live minutes for today if running, otherwise use storedMinutes
                                    const mins = isLive ? liveTotalMinutes : (log.time_worked_minutes || 0);
                                    
                                    return (
                                        <tr key={log.id}>
                                            <td>
                                                <strong>{formatDate(log.work_date)}</strong>
                                            </td>
                                            <td>
                                                <span style={{ 
                                                    fontFamily: 'monospace', 
                                                    fontSize: '1rem',
                                                    color: isLive ? '#10b981' : 'inherit',
                                                    fontWeight: isLive ? '600' : 'normal'
                                                }}>
                                                    {formatTime(Math.floor(mins / 60), mins % 60)}
                                                </span>
                                            </td>
                                            <td>
                                                    {getStatusBadge(log)}
                                            </td>
                                            <td>
                                                —
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
            </div>
             <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default WorkReportSummary;

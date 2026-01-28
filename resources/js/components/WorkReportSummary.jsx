import React, { useState, useEffect, useCallback } from 'react';
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
                <span className="badge" style={{ backgroundColor: '#10b981', color: 'white' }}>
                    Active
                </span>
            );
        }
        
        // Otherwise show "Ended"
        return <span className="badge badge-secondary">Ended</span>;
    };

    // Calculate total hours
    const totalMinutes = workLogs.reduce((sum, log) => sum + (log.time_worked_minutes || 0), 0);
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
                                {workLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <strong>{formatDate(log.work_date)}</strong>
                                        </td>
                                        <td>
                                            <span style={{ fontFamily: 'monospace', fontSize: '1rem' }}>
                                                {formatTime(Math.floor(log.time_worked_minutes / 60), log.time_worked_minutes % 60)}
                                            </span>
                                        </td>
                                        <td>
                                                {getStatusBadge(log)}
                                        </td>
                                        <td>
                                            —
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
            </div>
        </div>
    );
};

export default WorkReportSummary;

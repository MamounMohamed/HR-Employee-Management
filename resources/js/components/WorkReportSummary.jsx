import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../api';
import { useToast } from '../context/ToastContext';
import { WorkLogStatusEnum } from '../enums/WorkLogStatusEnum';

const WorkReportSummary = () => {
    const { addToast } = useToast();
    const [reportData, setReportData] = useState(null);
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

    // Fetch report data for last 7 days (today + 6 days before)
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
    }, [fetchReport]);

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

    const workLogs = reportData?.work_logs 
        ? Object.entries(reportData.work_logs)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 7) // Last 7 days
        : [];

    // Calculate total hours
    const totalMinutes = workLogs.reduce((sum, [, log]) => sum + (log.total_minutes || 0), 0);
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
                    Recent Work Report (Last 7 Days)
                </h2>

                {workLogs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📅</div>
                        <h3 className="empty-state-title">No work logs found</h3>
                        <p>No work activity recorded for the last 7 days</p>
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
            </div>
        </div>
    );
};

export default WorkReportSummary;

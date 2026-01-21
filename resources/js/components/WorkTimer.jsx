import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../api';
import { useToast } from '../context/ToastContext';

const WorkTimer = () => {
    const { addToast } = useToast();
    const [workLog, setWorkLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [displayTime, setDisplayTime] = useState('00:00:00');

    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        const now = new Date();
        return now.toISOString().split('T')[0];
    };

    // Fetch work log data
    const fetchWorkLog = useCallback(async () => {
        setLoading(true);
        try {
            const today = getTodayDate();
            const response = await API.getWorkLog(today);
            const todayLog = response.data.work_logs[today] || null;
            setWorkLog(todayLog);
        } catch (err) {
            addToast(err.message || 'Failed to load work log', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    // Load work log on mount
    useEffect(() => {
        fetchWorkLog();
    }, [fetchWorkLog]);

    // Calculate and update display time
    useEffect(() => {
        let interval;

        const updateDisplayTime = async () => {
            if (!workLog) {
                // Case 1: Not started
                setDisplayTime('00:00:00');
                return;
            }

            const { total_minutes, last_status, last_status_time } = workLog;

            if (last_status === 'end') {
                // Case 2: Paused/Ended - show static time
                const hours = Math.floor(total_minutes / 60);
                const minutes = total_minutes % 60;
                setDisplayTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
            } else if (last_status === 'start') {
                // Case 3: Active - calculate live time
                const now = new Date();
                const lastStatusDate = new Date(last_status_time);
                const elapsedMs = now - lastStatusDate;
                const elapsedMinutes = Math.floor(elapsedMs / 60000);
                const totalMinutes = total_minutes + elapsedMinutes;
                
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                const seconds = Math.floor((elapsedMs % 60000) / 1000);
                
                // Check if we've reached 23:59:59 (1439 minutes and 59 seconds)
                if (hours >= 23 && minutes >= 59 && seconds >= 59) {
                    setDisplayTime('23:59:59');
                    // Auto-end the work session
                    try {
                        await API.updateWorkStatus('end');
                        addToast('Work session automatically ended after reaching 24-hour limit', 'info');
                        await fetchWorkLog();
                    } catch (err) {
                        addToast(err.message || 'Failed to auto-end work session', 'error');
                    }
                    return;
                }
                
                setDisplayTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            }
        };

        updateDisplayTime();

        // Update every second if actively working
        if (workLog && workLog.last_status === 'start') {
            interval = setInterval(updateDisplayTime, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [workLog, addToast, fetchWorkLog]);

    // Handle status updates
    const handleStatusUpdate = async (status) => {
        setActionLoading(true);
        try {
            await API.updateWorkStatus(status);
            addToast(`Work ${status === 'start' ? 'started' : 'ended'} successfully`, 'success');
            await fetchWorkLog();
        } catch (err) {
            addToast(err.message || 'Failed to update work status', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStart = () => handleStatusUpdate('start');
    const handleEnd = () => handleStatusUpdate('end');

    // Determine which buttons to show
    const getButtons = () => {
        if (!workLog || (Array.isArray(workLog) && workLog.length === 0)) {
            // Case 1: Not started
            return (
                <button 
                    className="btn btn-primary" 
                    onClick={handleStart}
                    disabled={actionLoading}
                    style={{ minWidth: '120px' }}
                >
                    {actionLoading ? 'Starting...' : 'Start'}
                </button>
            );
        }

        if (workLog.last_status === 'end') {
            // Case 2: Paused/Ended
            return (
                <button 
                    className="btn btn-primary" 
                    onClick={handleStart}
                    disabled={actionLoading}
                    style={{ minWidth: '120px' }}
                >
                    {actionLoading ? 'Resuming...' : 'Resume'}
                </button>
            );
        }

        if (workLog.last_status === 'start') {
            // Case 3: Active
            return (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleEnd}
                        disabled={actionLoading}
                        style={{ minWidth: '120px' }}
                    >
                        {actionLoading ? 'Pausing...' : 'Pause'}
                    </button>
                </div>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <div className="table-container" style={{ marginBottom: '2rem' }}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem', color: 'var(--color-text-tertiary)' }}>Loading work timer...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="table-container" style={{ marginBottom: '2rem' }}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
                    Today's Work Time
                </h2>
                <div style={{ 
                    fontSize: '3rem', 
                    fontWeight: 'bold', 
                    fontFamily: 'monospace',
                    color: 'var(--color-primary)',
                    marginBottom: '1.5rem',
                    letterSpacing: '0.1em'
                }}>
                    {displayTime}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    {getButtons()}
                </div>
            </div>
        </div>
    );
};

export default WorkTimer;

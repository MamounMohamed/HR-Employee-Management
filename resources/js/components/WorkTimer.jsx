import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API } from '../api';
import { useToast } from '../context/ToastContext';
import { useWorkLog } from '../context/WorkLogContext';
import { WorkLogStatusEnum } from '../enums/WorkLogStatusEnum';

const WorkTimer = () => {
    const { addToast } = useToast();
    const { updateWorkLog, triggerRefresh } = useWorkLog();
    const [workLog, setWorkLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [displayTime, setDisplayTime] = useState('00:00:00');
    
    // Client-side state for tracking running timer
    const localStartTimeRef = useRef(null);
    const localTotalMinutesRef = useRef(0);
    const timerIntervalRef = useRef(null);

    // Initialize local state from sessionStorage or worklog
    const initializeLocalState = useCallback((workLogData) => {
        if (!workLogData || workLogData.last_status === null) {
            // Not started - reset local state
            localStartTimeRef.current = null;
            localTotalMinutesRef.current = 0;
            sessionStorage.removeItem('worklog_start_time');
            sessionStorage.removeItem('worklog_total_minutes');
        } else if (workLogData.last_status === WorkLogStatusEnum.STOPPED) {
            // Stopped - store total minutes and clear start time
            localStartTimeRef.current = null;
            localTotalMinutesRef.current = workLogData.total_minutes;
            sessionStorage.removeItem('worklog_start_time');
            sessionStorage.setItem('worklog_total_minutes', workLogData.total_minutes.toString());
        } else if (workLogData.last_status === WorkLogStatusEnum.RUNNING) {
            // Running - restore from sessionStorage if available, otherwise use server time
            const storedStartTime = sessionStorage.getItem('worklog_start_time');
            const storedTotalMinutes = sessionStorage.getItem('worklog_total_minutes');
            
            if (storedStartTime) {
                // Use previously stored start time (user never left or came back)
                localStartTimeRef.current = new Date(storedStartTime);
                localTotalMinutesRef.current = parseInt(storedTotalMinutes || workLogData.total_minutes);
            } else {
                // First time resuming or page reload - use server time
                localStartTimeRef.current = new Date(workLogData.last_status_time);
                localTotalMinutesRef.current = workLogData.total_minutes;
            }
            
            // Always update sessionStorage with current state
            sessionStorage.setItem('worklog_start_time', localStartTimeRef.current.toISOString());
            sessionStorage.setItem('worklog_total_minutes', localTotalMinutesRef.current.toString());
        }
    }, []);

    // Fetch work log data
    const fetchWorkLog = useCallback(async () => {
        setLoading(true);
        try {
            const response = await API.getWorkLog();
            setWorkLog(response.data);
            updateWorkLog(response.data);
            triggerRefresh();
            initializeLocalState(response.data);
        } catch (err) {
            addToast(err.message || 'Failed to load work log', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast, updateWorkLog, initializeLocalState]);

    // Load work log on mount
    useEffect(() => {
        fetchWorkLog();
    }, [fetchWorkLog]);

    // Calculate and update display time
    useEffect(() => {
        const updateDisplayTime = () => {
            if (!workLog || workLog.last_status === null) {
                // Case 1: Not started
                setDisplayTime('00:00:00');
                return;
            }

            if (workLog.last_status === WorkLogStatusEnum.STOPPED) {
                // Case 2: Paused/Ended - show static time
                const hours = Math.floor(localTotalMinutesRef.current / 60);
                const minutes = localTotalMinutesRef.current % 60;
                setDisplayTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
            } else if (workLog.last_status === WorkLogStatusEnum.RUNNING) {
                // Case 3: Active - calculate live time from local start time
                if (localStartTimeRef.current) {
                    const now = new Date();
                    const elapsedMs = now - localStartTimeRef.current;
                    const safeElapsedMs = Math.max(0, elapsedMs);
                    
                    const elapsedMinutes = Math.floor(safeElapsedMs / 60000);
                    const totalMinutesWithCurrent = localTotalMinutesRef.current + elapsedMinutes;
                    
                    const hours = Math.floor(totalMinutesWithCurrent / 60);
                    const minutes = totalMinutesWithCurrent % 60;
                    const seconds = Math.floor((safeElapsedMs % 60000) / 1000);
                    
                    setDisplayTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
                }
            }
        };

        updateDisplayTime();

        // Update every second if actively working
        if (workLog && workLog.last_status === WorkLogStatusEnum.RUNNING) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = setInterval(updateDisplayTime, 1000);
        }

        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [workLog]);

    // Handle status updates with optimistic UI updates
    const handleStatusUpdate = async (status) => {
        setActionLoading(true);
        
        // Calculate what the new state should be
        const newTotalMinutes = status === WorkLogStatusEnum.RUNNING && workLog?.last_status === WorkLogStatusEnum.STOPPED
            ? localTotalMinutesRef.current
            : localTotalMinutesRef.current;
        
        try {
            // Make the API call
            const response = await API.updateWorkStatus(status);
            
            // Update local state optimistically
            if (status === WorkLogStatusEnum.RUNNING) {
                // Starting/Resuming - set the local start time to now
                const now = new Date();
                localStartTimeRef.current = now;
                sessionStorage.setItem('worklog_start_time', now.toISOString());
                sessionStorage.setItem('worklog_total_minutes', newTotalMinutes.toString());
            } else if (status === WorkLogStatusEnum.STOPPED) {
                // Stopping/Pausing - calculate elapsed time and add to total
                if (localStartTimeRef.current) {
                    const elapsedMinutes = Math.floor((Date.now() - localStartTimeRef.current) / 60000);
                    localTotalMinutesRef.current += elapsedMinutes;
                    sessionStorage.setItem('worklog_total_minutes', localTotalMinutesRef.current.toString());
                }
                localStartTimeRef.current = null;
                sessionStorage.removeItem('worklog_start_time');
            }
            
            // Update the workLog state
            const updatedWorkLog = { ...workLog, last_status: status };
            setWorkLog(updatedWorkLog);
            updateWorkLog(updatedWorkLog);
            
            addToast(`Work ${status === WorkLogStatusEnum.RUNNING ? 'started' : 'ended'} successfully`, 'success');
            
            // Fetch fresh data in the background (but don't wait for it)
            fetchWorkLog();
            triggerRefresh();
        } catch (err) {
            addToast(err.message || 'Failed to update work status', 'error');
            // Revert local state on error
            if (status === WorkLogStatusEnum.RUNNING) {
                localStartTimeRef.current = null;
                sessionStorage.removeItem('worklog_start_time');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleStart = () => handleStatusUpdate(WorkLogStatusEnum.RUNNING);
    const handleEnd = () => handleStatusUpdate(WorkLogStatusEnum.STOPPED);

    // Determine which buttons to show
    const getButtons = () => {
        if (!workLog || (Array.isArray(workLog) && workLog.length === 0) || workLog.last_status === null) {
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

        if (workLog.last_status === WorkLogStatusEnum.STOPPED) {
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

        if (workLog.last_status === WorkLogStatusEnum.RUNNING) {
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

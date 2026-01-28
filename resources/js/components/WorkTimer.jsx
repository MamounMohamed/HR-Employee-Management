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
    const [notes, setNotes] = useState('');
    const [reportId, setReportId] = useState(null);
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    
    // Client-side state for tracking running timer
    const localStartTimeRef = useRef(null);
    const localTotalMinutesRef = useRef(0);
    const timerIntervalRef = useRef(null);
    const notesTimeoutRef = useRef(null);

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
    const fetchWorkLogAndReport = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch work log status
            const logResponse = await API.getWorkLog();
            const workLogData = logResponse.data;
            setWorkLog(workLogData);
            updateWorkLog(workLogData);
            initializeLocalState(workLogData);

            // 2. Fetch today's report for notes
            const today = new Date().toISOString().split('T')[0];
            const reportResponse = await API.getWorkReport(today, today);
            
            // Assuming getWorkReport returns { data: [...] } and it's paginated
            const reports = reportResponse.data || [];
            const todayReport = reports.find(r => r.work_date === today);
            
            if (todayReport) {
                setReportId(todayReport.id);
                setNotes(todayReport.notes || '');
            } else {
                setReportId(null);
                setNotes('');
            }

            triggerRefresh();
        } catch (err) {
            addToast(err.message || 'Failed to load work data', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast, updateWorkLog, initializeLocalState, triggerRefresh]);

    // Load data on mount
    useEffect(() => {
        fetchWorkLogAndReport();
    }, [fetchWorkLogAndReport]);

    // Handle notes change with auto-save
    const handleNotesChange = (e) => {
        const newNotes = e.target.value;
        setNotes(newNotes);

        if (!reportId) return;

        // Clear existing timeout
        if (notesTimeoutRef.current) {
            clearTimeout(notesTimeoutRef.current);
        }

        // Set new timeout for auto-save (1.5 seconds after typing stops)
        notesTimeoutRef.current = setTimeout(() => {
            saveNotes(newNotes);
        }, 1500);
    };

    const saveNotes = async (content) => {
        if (!reportId) return;
        
        setIsSavingNotes(true);
        try {
            await API.updateWorkLogNotes(reportId, content);
            // No toast for auto-save to keep it subtle, unless it's a manual trigger
        } catch (err) {
            addToast(err.message || 'Failed to save notes', 'error');
        } finally {
            setIsSavingNotes(false);
        }
    };

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
            fetchWorkLogAndReport();
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
        <div className="card shadow-sm border-0 overflow-hidden" style={{ 
            borderRadius: '20px', 
            background: 'var(--color-bg-primary)',
            marginBottom: '2.5rem'
        }}>
            <div style={{ padding: '2.5rem' }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1.25fr', 
                    gap: '4rem',
                    alignItems: 'stretch'
                }}>
                    {/* Timer Section */}
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center', 
                        borderRight: '1px solid var(--color-border-subtle)', 
                        paddingRight: '4rem' 
                    }}>
                        <div style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: 'rgba(var(--color-primary-rgb), 0.05)',
                            borderRadius: '100px',
                            marginBottom: '1.5rem'
                        }}>
                            <span style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                backgroundColor: workLog?.last_status === WorkLogStatusEnum.RUNNING ? '#10b981' : '#64748b',
                                animation: workLog?.last_status === WorkLogStatusEnum.RUNNING ? 'pulse 2s infinite' : 'none'
                            }}></span>
                            <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: '700', 
                                color: 'var(--color-text-secondary)', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.1em' 
                            }}>
                                {workLog?.last_status === WorkLogStatusEnum.RUNNING ? 'Currently Working' : 'Work Paused'}
                            </span>
                        </div>

                        <div style={{ 
                            fontSize: '4.5rem', 
                            fontWeight: '800', 
                            fontFamily: 'var(--font-mono, "Inter", monospace)',
                            color: 'var(--color-text-primary)',
                            lineHeight: '1',
                            margin: '1rem 0 2.5rem 0',
                            letterSpacing: '-0.04em',
                            fontVariantNumeric: 'tabular-nums'
                        }}>
                            {displayTime}
                        </div>

                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            {getButtons()}
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'baseline', 
                            marginBottom: '1.25rem' 
                        }}>
                            <h2 style={{ 
                                fontSize: '1rem', 
                                fontWeight: '700', 
                                color: 'var(--color-text-primary)',
                                letterSpacing: '-0.01em'
                            }}>
                                Daily Focus & Notes
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {isSavingNotes ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <div className="loading-spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontWeight: '500' }}>
                                            Syncing...
                                        </span>
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        Saved
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div style={{ position: 'relative', flex: 1 }}>
                            <textarea
                                className="form-control"
                                placeholder={reportId ? "What are your goals or achievements for today?..." : "Start your work log to enable notes."}
                                value={notes}
                                onChange={handleNotesChange}
                                disabled={!reportId}
                                style={{ 
                                    width: '100%',
                                    height: '100%',
                                    minHeight: '180px',
                                    resize: 'none',
                                    padding: '1.25rem',
                                    borderRadius: '16px',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    border: '2px solid transparent',
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                    color: 'var(--color-text-primary)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                                    outline: 'none'
                                }}
                                onFocus={(e) => {
                                    e.target.style.backgroundColor = 'var(--color-bg-primary)';
                                    e.target.style.borderColor = 'rgba(var(--color-primary-rgb), 0.3)';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(var(--color-primary-rgb), 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.backgroundColor = 'var(--color-bg-secondary)';
                                    e.target.style.borderColor = 'transparent';
                                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
                                    saveNotes(notes);
                                }}
                            />
                        </div>

                        {!reportId && (
                            <div style={{ 
                                marginTop: '1rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                color: 'var(--color-text-tertiary)',
                                fontSize: '0.8rem'
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                <span>Notes activate automatically once you start working.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};

export default WorkTimer;

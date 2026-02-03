import React, { useState, useEffect } from 'react';
import { API } from '../api';
import { useToast } from '../context/ToastContext';

const DayDetails = ({ dayLog, onBack }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [dayDetails, setDayDetails] = useState(null);

    useEffect(() => {
        const fetchDayDetails = async () => {
            if (!dayLog || !dayLog.user_id || !dayLog.work_date) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await API.getDayDetails(dayLog.user_id, dayLog.work_date);
                setDayDetails(response.data);
            } catch (err) {
                addToast(err.message || 'Failed to load day details', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchDayDetails();
    }, [dayLog, addToast]);

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        });
    };

    // Format timestamp for display (from ISO string)
    const formatTimeFromISO = (isoString) => {
        if (!isoString) return '--:--';
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Format time as HH:MM
    const formatTime = (hours, minutes) => {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    // Calculate break duration in minutes
    const calculateBreakDuration = (from, to) => {
        if (!from || !to) return 0;
        const fromDate = new Date(from);
        const toDate = new Date(to);
        return Math.round((toDate - fromDate) / (1000 * 60));
    };

    // Calculate total break time
    const calculateTotalBreakTime = () => {
        if (!dayDetails?.breaks || dayDetails.breaks.length === 0) return 0;
        return dayDetails.breaks.reduce((total, breakItem) => {
            return total + calculateBreakDuration(breakItem.from, breakItem.to);
        }, 0);
    };

    if (!dayLog) {
        return (
            <div className="table-container" style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-tertiary)' }}>No day selected</p>
                <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '1rem' }}>
                    ← Back to Reports
                </button>
            </div>
        );
    }

    return (
        <div className="table-container" style={{ marginBottom: '2rem' }}>
            <div style={{ padding: '2rem' }}>
                {/* Header with Back Button */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    marginBottom: '2rem' 
                }}>
                    <button
                        onClick={onBack}
                        className="btn btn-secondary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem'
                        }}
                    >
                        <span style={{ fontSize: '1.25rem' }}>←</span>
                        Back
                    </button>
                    <div>
                        <h2 style={{ 
                            fontSize: '1.5rem', 
                            margin: 0, 
                            color: 'var(--color-text-primary)' 
                        }}>
                            📅 Day Details
                        </h2>
                        <p style={{ 
                            margin: '0.25rem 0 0 0', 
                            color: 'var(--color-text-secondary)',
                            fontSize: '1rem'
                        }}>
                            {formatDate(dayLog.work_date)}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                        <p style={{ marginTop: '1rem', color: 'var(--color-text-tertiary)' }}>
                            Loading day details...
                        </p>
                    </div>
                ) : dayDetails ? (
                    <div>
                        {/* Summary Cards Row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            {/* Start Time Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                textAlign: 'center'
                            }}>
                                <div style={{ 
                                    fontSize: '2rem', 
                                    marginBottom: '0.75rem' 
                                }}>
                                    🟢
                                </div>
                                <div style={{ 
                                    fontSize: '0.875rem', 
                                    color: 'var(--color-text-tertiary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: '0.5rem',
                                    fontWeight: '500'
                                }}>
                                    Started Work
                                </div>
                                <div style={{ 
                                    fontSize: '1.75rem', 
                                    fontWeight: '700',
                                    color: 'rgb(34, 197, 94)',
                                    fontFamily: 'monospace'
                                }}>
                                    {formatTimeFromISO(dayDetails.start)}
                                </div>
                            </div>

                            {/* End Time Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                textAlign: 'center'
                            }}>
                                <div style={{ 
                                    fontSize: '2rem', 
                                    marginBottom: '0.75rem' 
                                }}>
                                    🔴
                                </div>
                                <div style={{ 
                                    fontSize: '0.875rem', 
                                    color: 'var(--color-text-tertiary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: '0.5rem',
                                    fontWeight: '500'
                                }}>
                                    Ended Work
                                </div>
                                <div style={{ 
                                    fontSize: '1.75rem', 
                                    fontWeight: '700',
                                    color: 'rgb(239, 68, 68)',
                                    fontFamily: 'monospace'
                                }}>
                                    {formatTimeFromISO(dayDetails.end)}
                                </div>
                            </div>

                            {/* Total Worked Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, var(--color-primary) 0%, #6366f1 100%)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                textAlign: 'center',
                                color: '#fff'
                            }}>
                                <div style={{ 
                                    fontSize: '2rem', 
                                    marginBottom: '0.75rem' 
                                }}>
                                    ⏱️
                                </div>
                                <div style={{ 
                                    fontSize: '0.875rem', 
                                    opacity: 0.9,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: '0.5rem',
                                    fontWeight: '500'
                                }}>
                                    Total Worked
                                </div>
                                <div style={{ 
                                    fontSize: '1.75rem', 
                                    fontWeight: '700',
                                    fontFamily: 'monospace'
                                }}>
                                    {formatTime(
                                        Math.floor(dayLog.time_worked_minutes / 60), 
                                        dayLog.time_worked_minutes % 60
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Breaks Section */}
                        <div style={{
                            background: 'var(--color-surface)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            border: '1px solid var(--color-border)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>☕</span>
                                    <h3 style={{ 
                                        margin: 0, 
                                        fontSize: '1.25rem',
                                        color: 'var(--color-text-primary)',
                                        fontWeight: '600'
                                    }}>
                                        Break Times
                                    </h3>
                                    <span style={{
                                        background: 'var(--color-primary)',
                                        color: '#fff',
                                        borderRadius: '20px',
                                        padding: '0.25rem 0.75rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '600'
                                    }}>
                                        {dayDetails.breaks?.length || 0} breaks
                                    </span>
                                </div>
                                {dayDetails.breaks && dayDetails.breaks.length > 0 && (
                                    <div style={{
                                        color: 'var(--color-text-secondary)',
                                        fontSize: '0.875rem'
                                    }}>
                                        Total: <strong>{calculateTotalBreakTime()} min</strong>
                                    </div>
                                )}
                            </div>

                            {dayDetails.breaks && dayDetails.breaks.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {dayDetails.breaks.map((breakItem, index) => (
                                        <div 
                                            key={index}
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(251, 191, 36, 0.04) 100%)',
                                                border: '1px solid rgba(251, 191, 36, 0.3)',
                                                borderRadius: '12px',
                                                padding: '1rem 1.25rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{
                                                    background: 'rgba(251, 191, 36, 0.25)',
                                                    borderRadius: '50%',
                                                    width: '36px',
                                                    height: '36px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '700',
                                                    color: 'rgb(217, 160, 0)'
                                                }}>
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <div style={{ 
                                                        fontSize: '1rem',
                                                        color: 'var(--color-text-primary)',
                                                        fontWeight: '600',
                                                        marginBottom: '0.25rem'
                                                    }}>
                                                        {formatTimeFromISO(breakItem.from)} → {formatTimeFromISO(breakItem.to)}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.8rem',
                                                        color: 'var(--color-text-tertiary)'
                                                    }}>
                                                        Break #{index + 1}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{
                                                background: 'rgba(251, 191, 36, 0.25)',
                                                color: 'rgb(217, 160, 0)',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                fontSize: '0.875rem',
                                                fontWeight: '700'
                                            }}>
                                                {calculateBreakDuration(breakItem.from, breakItem.to)} min
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2.5rem',
                                    color: 'var(--color-text-tertiary)',
                                    fontSize: '1rem',
                                    background: 'var(--color-background)',
                                    borderRadius: '12px',
                                    border: '1px dashed var(--color-border)'
                                }}>
                                    No breaks recorded for this day
                                </div>
                            )}
                        </div>

                        {/* Notes Section (if available) */}
                        {dayLog.notes && (
                            <div style={{
                                marginTop: '1.5rem',
                                background: 'var(--color-surface)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                border: '1px solid var(--color-border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>📝</span>
                                    <h3 style={{ 
                                        margin: 0, 
                                        fontSize: '1.25rem',
                                        color: 'var(--color-text-primary)',
                                        fontWeight: '600'
                                    }}>
                                        Notes
                                    </h3>
                                </div>
                                <p style={{
                                    color: 'var(--color-text-secondary)',
                                    lineHeight: '1.6',
                                    margin: 0
                                }}>
                                    {dayLog.notes}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: 'var(--color-text-tertiary)'
                    }}>
                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>😔</span>
                        <p>Unable to load day details</p>
                        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '1rem' }}>
                            ← Back to Reports
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DayDetails;

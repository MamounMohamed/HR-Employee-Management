import React, { createContext, useState, useCallback } from 'react';

export const WorkLogContext = createContext();

export const WorkLogProvider = ({ children }) => {
    const [currentWorkLog, setCurrentWorkLog] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const updateWorkLog = useCallback((workLogData) => {
        setCurrentWorkLog(workLogData);
    }, []);

    const triggerRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const value = {
        currentWorkLog,
        updateWorkLog,
        refreshTrigger,
        triggerRefresh,
    };

    return (
        <WorkLogContext.Provider value={value}>
            {children}
        </WorkLogContext.Provider>
    );
};

export const useWorkLog = () => {
    const context = React.useContext(WorkLogContext);
    if (!context) {
        throw new Error('useWorkLog must be used within WorkLogProvider');
    }
    return context;
};

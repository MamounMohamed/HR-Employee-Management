import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import WorkTimer from '../components/WorkTimer';
import WorkReport from '../components/WorkReport';
import WorkReportSummary from '../components/WorkReportSummary';
import EmployeesTable from '../components/EmployeesTable';
import DayDetails from '../components/DayDetails';
import { useAuth } from '../context/AuthContext';
import { UserRoleEnum } from '../enums/UserRoleEnum';

const Dashboard = () => {
    const { user } = useAuth();
    
    // Sidebar state - open by default on desktop, closed on mobile
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 768;
        }
        return false;
    });
    const [activeView, setActiveView] = useState('home');
    const [selectedDayLog, setSelectedDayLog] = useState(null);

    // Handle window resize to auto-close sidebar on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleViewChange = (view) => {
        // Prevent employees from accessing employees view
        if (view === 'employees' && user && user.role !== UserRoleEnum.HR) {
            setActiveView('home');
            return;
        }
        // Clear selected day log when changing views (except when going to day-details)
        if (view !== 'day-details') {
            setSelectedDayLog(null);
        }
        setActiveView(view);
    };

    // Handle clicking on a report row to show day details
    const handleDaySelect = (dayLog) => {
        setSelectedDayLog(dayLog);
        setActiveView('day-details');
    };

    // Handle going back from day details to reports
    const handleBackToReports = () => {
        setSelectedDayLog(null);
        setActiveView('reports');
    };

    // Redirect employees away from employees view if they somehow access it
    useEffect(() => {
        if (activeView === 'employees' && user && user.role !== UserRoleEnum.HR) {
            setActiveView('home');
        }
    }, [activeView, user]);

    const renderContent = () => {
        switch (activeView) {
            case 'reports':
                return <WorkReport onDaySelect={handleDaySelect} />;
            case 'day-details':
                return <DayDetails dayLog={selectedDayLog} onBack={handleBackToReports} />;
            case 'employees':
                return <EmployeesTable />;
            case 'home':
            default:
                return (
                    <>
                        <WorkTimer />
                        <WorkReportSummary />
                    </>
                );
        }
    };

    return (
        <>
            <Navbar onMenuToggle={toggleSidebar} />
            <Sidebar 
                isOpen={sidebarOpen}
                onToggle={toggleSidebar}
                activeView={activeView}
                onViewChange={handleViewChange}
            />
            <div className={`page-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <div className="dashboard">
                    <div className="container">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;


import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import WorkTimer from '../components/WorkTimer';
import WorkReport from '../components/WorkReport';
import WorkReportSummary from '../components/WorkReportSummary';
import EmployeesTable from '../components/EmployeesTable';
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
        setActiveView(view);
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
                return <WorkReport />;
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

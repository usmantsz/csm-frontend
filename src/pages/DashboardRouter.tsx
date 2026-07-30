import { Navigate } from 'react-router-dom';
import { useAuthToken } from '../Hooks/useAuthToken';
import Dashboard from './Dashboard';
import AdminOverview from './AdminOverview';
import CustomerOverview from './Customer/CustomerOverview';
import TeamMemberOverview from './TeamMemberOverview';

/**
 * Renders Admin Overview for Super Admin (0), Team Member Dashboard for team (2, 3), Customer Overview for customer, Shop Dashboard for shop owners (1).
 * POS users (loginSource=pos) are redirected to /pos/dashboard.
 */
const DashboardRouter = () => {
    const { user } = useAuthToken();
    const storedRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    const loginSource = typeof window !== 'undefined' ? localStorage.getItem('loginSource') : null;
    const isAdmin = user?.userRole === 'Admin' || user?.userRole === 'admin' || user?.userRole === 0 || user?.userRole === '0';
    const isCustomer = storedRole === 'customer';
    const isTeamMember = storedRole === '2' || storedRole === '3';

    if (loginSource === 'pos') {
        return <Navigate to="/pos/dashboard" replace />;
    }
    if (isAdmin) {
        return <AdminOverview />;
    }
    if (isTeamMember) {
        return <TeamMemberOverview />;
    }
    if (isCustomer) {
        return <CustomerOverview />;
    }
    return <Dashboard />;
};

export default DashboardRouter;

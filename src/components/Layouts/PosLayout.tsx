import { PropsWithChildren, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { toggleSidebar } from '../../store/themeConfigSlice';
import PosSidebar from './PosSidebar';
import PosHeader from './PosHeader';
import Setting from './Setting';
import App from '../../App';

const PosLayout = ({ children }: PropsWithChildren) => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const isPos = localStorage.getItem('loginSource') === 'pos';
        if (!isPos) {
            navigate('/dashboard', { replace: true });
        }
    }, [mounted, navigate]);

    if (!mounted) return null;

    return (
        <App>
            <div className="relative min-h-screen bg-gray-50 dark:bg-black/20">
                {/* Same shell as DefaultLayout so global .vertical / .horizontal / .collapsible-vertical rules apply */}
                <div className={`${themeConfig.navbar} main-container min-h-screen text-black dark:text-white-dark`}>
                    <PosSidebar />
                    <div className="main-content flex flex-col min-h-screen">
                        <PosHeader />
                        <main className="flex-1 p-4 md:p-6">
                            <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]"><span className="animate-spin inline-block w-10 h-10 border-2 border-primary border-t-transparent rounded-full" /></div>}>
                                {children}
                            </Suspense>
                        </main>
                    </div>
                </div>
                {themeConfig.sidebar && (
                    <div
                        className="fixed inset-0 bg-[black]/60 z-50 lg:hidden"
                        onClick={() => dispatch(toggleSidebar())}
                        aria-hidden="true"
                    />
                )}
                <Setting />
            </div>
        </App>
    );
};

export default PosLayout;

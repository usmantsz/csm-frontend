// import { createBrowserRouter } from 'react-router-dom';
// import BlankLayout from '../components/Layouts/BlankLayout';
// import DefaultLayout from '../components/Layouts/DefaultLayout';
// import { routes } from './routes';

// const finalRoutes = routes.map((route) => {
//     return {
//         ...route,
//         element: route.layout === 'blank' ? <BlankLayout>{route.element}</BlankLayout> : <DefaultLayout>{route.element}</DefaultLayout>,
//     };
// });

// const router = createBrowserRouter(finalRoutes);

// export default router;
// import { createBrowserRouter } from 'react-router-dom';
// import BlankLayout from '../components/Layouts/BlankLayout';
// import DefaultLayout from '../components/Layouts/DefaultLayout';
// import { routes } from './routes';
// import PrivateRoute from './PrivateRoute'; // Adjust the path as needed

// const finalRoutes = routes.map((route) => {
//     const element = route.layout === 'blank'
//         ? <BlankLayout>{route.element}</BlankLayout>
//         : <DefaultLayout>{route.element}</DefaultLayout>;

//     // Apply PrivateRoute to protected routes only
//     const protectedElement = route.protected ? <PrivateRoute element={element} allowedRoles={['admin', 'shopowner', 'customer']} /> : element;

//     return {
//         ...route,
//         element: protectedElement,
//     };
// });

// const router = createBrowserRouter(finalRoutes);

// export default router;
import { createBrowserRouter } from 'react-router-dom';
import BlankLayout from '../components/Layouts/BlankLayout';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import PosLayout from '../components/Layouts/PosLayout';
import { routes } from './routes';
import PrivateRoute from './PrivateRoute'; // Adjust the path as needed

const finalRoutes = routes.map((route) => {
    const layoutEl = route.layout === 'blank'
        ? <BlankLayout>{route.element}</BlankLayout>
        : route.layout === 'pos'
            ? <PosLayout>{route.element}</PosLayout>
            : <DefaultLayout>{route.element}</DefaultLayout>;
    const element = layoutEl;

    // Apply PrivateRoute to protected routes with specific allowedRoles
    const protectedElement = route.protected
        ? <PrivateRoute element={element} allowedRoles={route.allowedRoles || []} />
        : element;

    // Debug: Log route registration
    if (route.path?.includes('finance/crop')) {
        console.log('✅ Route registered:', route.path, 'Protected:', route.protected, 'AllowedRoles:', route.allowedRoles);
    }

    return {
        ...route,
        element: protectedElement,
    };
});

const router = createBrowserRouter(finalRoutes);

export default router;

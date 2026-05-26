import { Outlet } from 'react-router-dom';
import NProgressHandler from './NProgressHandler';
import GlobalToaster from './GlobalToaster';

const AppLayout = () => {
    return (
        <>
            <NProgressHandler />
            <GlobalToaster />
            <Outlet />
        </>
    );
};

export default AppLayout;

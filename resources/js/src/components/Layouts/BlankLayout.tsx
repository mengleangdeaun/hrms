import { PropsWithChildren } from 'react';

const BlankLayout = ({ children }: PropsWithChildren) => {
    return (
        <div className="text-black dark:text-white-dark min-h-screen">{children} </div>
    );
};

export default BlankLayout;

import { useState, useEffect } from 'react';

export const useIsKeyboardVisible = () => {
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            // If the height decreases significantly, the keyboard is likely open
            const isVisible = window.visualViewport 
                ? window.visualViewport.height < window.innerHeight * 0.75
                : window.innerHeight < screen.height * 0.75;
            
            setKeyboardVisible(isVisible);
        };

        // For mobile browsers (TMA)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        } else {
            window.addEventListener('resize', handleResize);
        }

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
            } else {
                window.removeEventListener('resize', handleResize);
            }
        };
    }, []);

    return isKeyboardVisible;
};

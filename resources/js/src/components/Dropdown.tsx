import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { usePopper } from 'react-popper';

const Dropdown = (props: any, forwardedRef: any) => {
    const [visibility, setVisibility] = useState<any>(false);

    const [referenceElement, setReferenceElement] = useState<any>();
    const [popperElement, setPopperElement] = useState<any>();

    const { styles, attributes } = usePopper(referenceElement, popperElement, {
        placement: props.placement || 'bottom-end',
        strategy: props.strategy || 'fixed',
        modifiers: [
            {
                name: 'offset',
                options: {
                    offset: props.offset || [0, 8],
                },
            },
        ],
    });

    const handleDocumentClick = (event: any) => {
        if (referenceElement?.contains(event.target) || popperElement?.contains(event.target)) {
            return;
        }

        setVisibility(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleDocumentClick);
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, [referenceElement, popperElement]);

    useImperativeHandle(forwardedRef, () => ({
        close() {
            setVisibility(false);
        },
    }));

    return (
        <>
            <button
                ref={setReferenceElement}
                type="button"
                className={props.btnClassName}
                onClick={() => setVisibility(!visibility)}
            >
                {props.button}
            </button>

            <div
                ref={setPopperElement}
                style={{ ...styles.popper, display: visibility ? 'block' : 'none' }}
                {...attributes.popper}
                className="z-50"
                onClick={(e: any) => {
                    if (e.target.closest('a') || e.target.closest('button')) {
                        setVisibility(false);
                    }
                }}
            >
                {props.children}
            </div>
        </>
    );
};

export default forwardRef(Dropdown);

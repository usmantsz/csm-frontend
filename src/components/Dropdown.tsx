import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { usePopper } from 'react-popper';

const Dropdown = (props: any, forwardedRef: any) => {
    const [visibility, setVisibility] = useState<any>(false);

    const referenceRef = useRef<any>();
    const popperRef = useRef<any>();

    const { styles, attributes } = usePopper(referenceRef.current, popperRef.current, {
        placement: props.placement || 'bottom-end',
        modifiers: [
            {
                name: 'offset',
                options: {
                    offset: props.offset || [0],
                },
            },
        ],
    });

    const handleDocumentClick = (event: any) => {
        if (referenceRef.current?.contains(event.target) || popperRef.current?.contains(event.target)) {
            return;
        }

        setVisibility(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleDocumentClick);
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, []);

    useImperativeHandle(forwardedRef, () => ({
        close() {
            setVisibility(false);
        },
    }));

    return (
        <>
            <button
                ref={referenceRef}
                type="button"
                className={props.btnClassName}
                onClick={() => setVisibility(!visibility)}
            >
                {props.button}
            </button>

            <div
                ref={popperRef}
                style={styles.popper}
                {...attributes.popper}
                aria-hidden={!visibility}
                className={`z-[100] max-w-[calc(100vw-1rem)] origin-top transition-all duration-150 ease-out ${
                    visibility ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
                } ${props.popperClassName || ''}`}
            >
                <div
                    className={`overflow-hidden rounded-2xl border border-[#bfd7f6] bg-white/95 shadow-xl shadow-[#1d4ed8]/10 ring-1 ring-black/5 backdrop-blur-md dark:border-[#1f3d7f] dark:bg-[#0b1526]/95 dark:shadow-black/40 dark:ring-white/10 ${props.panelClassName || ''}`}
                >
                    {props.children}
                </div>
            </div>
        </>
    );
};

export default forwardRef(Dropdown);

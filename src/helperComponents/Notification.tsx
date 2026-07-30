import { useEffect } from 'react';
import Swal from 'sweetalert2';

// Function to show notification
export const  Notification = ({text='',color=''}) => {
    const toast = Swal.mixin({
        toast: true,
        position: `top-end`,
        showConfirmButton: false,
        timer: 3000,
        showCloseButton: true,
        customClass: {
            popup: `color-${color}`,
        },
    });

    toast.fire({
        title: text,
    });
};



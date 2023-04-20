import { Notify } from 'quasar';

class Toast {
    show(message: string, type: 'done' | 'error') {
        const icon = type === 'done' ? 'done' : 'error_outline';
        const iconColor = type === 'done' ? 'primary' : 'warning';

        return Notify.create({
            message,
            position: 'top',
            timeout: 2000,
            icon,
            iconSize: '20px',
            iconColor,
        });
    }
}

const toast = new Toast();
export default toast;

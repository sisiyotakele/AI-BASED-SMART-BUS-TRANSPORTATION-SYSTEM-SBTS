import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatStr: string = 'PPP') {
    return format(new Date(date), formatStr);
}

export function formatDateTime(date: string | Date) {
    return format(new Date(date), 'PPP p');
}

export function formatRelativeTime(date: string | Date) {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCurrency(amount: number, currency: string = 'ETB') {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency,
    }).format(amount);
}

export function truncate(str: string, length: number = 50) {
    return str.length > length ? str.substring(0, length) + '...' : str;
}

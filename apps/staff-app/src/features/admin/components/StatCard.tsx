import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'primary' | 'navy' | 'green' | 'amber';
}

const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    navy: 'bg-navy-100 text-navy-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
};

export function StatCard({ title, value, icon: Icon, trend, color = 'primary' }: StatCardProps) {
    return (
        <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-600 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                    {trend && (
                        <p className={cn('text-sm mt-2', trend.isPositive ? 'text-green-600' : 'text-red-600')}>
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from yesterday
                        </p>
                    )}
                </div>
                <div className={cn('p-3 rounded-lg', colorClasses[color])}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}

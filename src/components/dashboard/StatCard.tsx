import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'pending';
  delay?: number;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'default',
  delay = 0 
}: StatCardProps) {
  const variantStyles = {
    default: 'stat-card',
    primary: 'stat-card-primary',
    success: 'stat-card-success',
    warning: 'stat-card-warning',
    pending: 'stat-card-pending',
  };

  const iconBgStyles = {
    default: 'bg-primary/10 text-primary',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    success: 'bg-success-foreground/20 text-success-foreground',
    warning: 'bg-warning-foreground/20 text-warning-foreground',
    pending: 'bg-pending-foreground/20 text-pending-foreground',
  };

  const textStyles = {
    default: 'text-foreground',
    primary: 'text-primary-foreground',
    success: 'text-success-foreground',
    warning: 'text-warning-foreground',
    pending: 'text-pending-foreground',
  };

  const subtitleStyles = {
    default: 'text-muted-foreground',
    primary: 'text-primary-foreground/70',
    success: 'text-success-foreground/70',
    warning: 'text-warning-foreground/70',
    pending: 'text-pending-foreground/70',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(variantStyles[variant])}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn("text-sm font-medium mb-1", subtitleStyles[variant])}>
            {title}
          </p>
          <p className={cn("text-3xl font-bold", textStyles[variant])}>
            {value}
          </p>
          {subtitle && (
            <p className={cn("text-sm mt-1", subtitleStyles[variant])}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconBgStyles[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

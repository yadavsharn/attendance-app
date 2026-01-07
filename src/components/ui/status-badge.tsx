import { cn } from '@/lib/utils';

type StatusType = 'present' | 'absent' | 'late' | 'half_day' | 'active' | 'inactive';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  present: {
    label: 'Present',
    className: 'bg-success/10 text-success border border-success/20',
  },
  absent: {
    label: 'Absent',
    className: 'bg-destructive/10 text-destructive border border-destructive/20',
  },
  late: {
    label: 'Late',
    className: 'bg-warning/10 text-warning border border-warning/20',
  },
  half_day: {
    label: 'Half Day',
    className: 'bg-info/10 text-info border border-info/20',
  },
  active: {
    label: 'Active',
    className: 'bg-success/10 text-success border border-success/20',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-muted text-muted-foreground border border-border',
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};

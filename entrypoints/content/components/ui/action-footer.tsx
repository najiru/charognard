import { cn } from '@/lib/utils';

interface ActionFooterProps {
  primaryText: string;
  remaining: number;
  limit: number;
  actionLabel: string;
  warningThreshold?: number;
}

export function ActionFooter({
  primaryText,
  remaining,
  limit,
  actionLabel,
  warningThreshold = 10,
}: ActionFooterProps) {
  return (
    <div className="p-3 border-t border-border bg-background text-center text-xs text-muted-foreground shrink-0">
      <div>{primaryText}</div>
      <div className={cn(remaining <= warningThreshold && 'text-destructive-foreground font-medium')}>
        {remaining}/{limit} {actionLabel} remaining today
      </div>
    </div>
  );
}

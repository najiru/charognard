import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCwIcon, UserPlusIcon } from 'lucide-react';

interface SelectionBarProps {
  loading: boolean;
  hasItems: boolean;
  selectedCount: number;
  selectableCount: number;
  massFollowing: boolean;
  massFollowProgress: { current: number; total: number };
  remainingFollows: number;
  includePrivate: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onMassFollow: () => void;
  onRefresh: () => void;
  onIncludePrivateChange: (value: boolean) => void;
}

export function SelectionBar({
  loading,
  hasItems,
  selectedCount,
  selectableCount,
  massFollowing,
  massFollowProgress,
  remainingFollows,
  includePrivate,
  onSelectAll,
  onDeselectAll,
  onMassFollow,
  onRefresh,
  onIncludePrivateChange,
}: SelectionBarProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    );
  }

  if (!hasItems) return null;

  const allSelected = selectedCount === selectableCount && selectableCount > 0;

  return (
    <div className="flex flex-col gap-2 px-4 py-2 border-b border-border bg-muted/30 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            disabled={massFollowing || selectableCount === 0}
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </Button>
          {selectedCount > 0 && (
            <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {selectedCount > 0 && (
            <Button size="xs" onClick={onMassFollow} disabled={massFollowing || remainingFollows === 0}>
              {massFollowing ? (
                <>
                  <Spinner className="size-3" />
                  {massFollowProgress.current}/{massFollowProgress.total}
                </>
              ) : (
                <>
                  <UserPlusIcon className="size-3" />
                  Follow {selectedCount}
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRefresh}
            disabled={loading || massFollowing}
          >
            <RefreshCwIcon className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
        <Checkbox
          checked={includePrivate}
          onCheckedChange={(checked) => onIncludePrivateChange(checked === true)}
          disabled={massFollowing}
        />
        Include private accounts
      </label>
    </div>
  );
}

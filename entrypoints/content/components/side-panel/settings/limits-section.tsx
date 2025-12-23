import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { AlertTriangleIcon } from 'lucide-react';
import { DEFAULT_FOLLOW_LIMIT, DEFAULT_UNFOLLOW_LIMIT } from '@/lib/storage';

interface LimitsSectionProps {
  followLimit: number;
  unfollowLimit: number;
  remainingFollows: number;
  remainingUnfollows: number;
  editFollowLimit: string;
  editUnfollowLimit: string;
  onEditFollowLimitChange: (value: string) => void;
  onEditUnfollowLimitChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
}

export function LimitsSection({
  followLimit,
  unfollowLimit,
  remainingFollows,
  remainingUnfollows,
  editFollowLimit,
  editUnfollowLimit,
  onEditFollowLimitChange,
  onEditUnfollowLimitChange,
  onSave,
  onReset,
  saving,
}: LimitsSectionProps) {
  return (
    <>
      {/* Warning */}
      <div className="flex gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <AlertTriangleIcon className="size-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-600 dark:text-amber-400">Warning</p>
          <p className="text-muted-foreground mt-1">
            Changing these limits is not recommended. Instagram may temporarily or permanently
            restrict your account if you exceed their rate limits.
          </p>
        </div>
      </div>

      {/* Follow Limit */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Daily Follow Limit</label>
        <Input
          type="number"
          min={1}
          max={500}
          value={editFollowLimit}
          onChange={(e) => onEditFollowLimitChange(e.target.value)}
          size="sm"
        />
        <p className="text-xs text-muted-foreground">
          Default: {DEFAULT_FOLLOW_LIMIT}. Current usage: {followLimit - remainingFollows}/
          {followLimit}
        </p>
      </div>

      {/* Unfollow Limit */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Daily Unfollow Limit</label>
        <Input
          type="number"
          min={1}
          max={500}
          value={editUnfollowLimit}
          onChange={(e) => onEditUnfollowLimitChange(e.target.value)}
          size="sm"
        />
        <p className="text-xs text-muted-foreground">
          Default: {DEFAULT_UNFOLLOW_LIMIT}. Current usage: {unfollowLimit - remainingUnfollows}/
          {unfollowLimit}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={saving} size="sm" className="flex-1">
          {saving ? <Spinner className="size-4" /> : 'Save Settings'}
        </Button>
        <Button variant="outline" onClick={onReset} disabled={saving} size="sm">
          Reset
        </Button>
      </div>
    </>
  );
}

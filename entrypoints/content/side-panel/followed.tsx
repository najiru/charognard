import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { checkFriendshipStatus, unfollowUser } from '@/lib/instagram';
import {
  getFollowedProfiles,
  removeFollowedProfile,
  updateFollowedBackStatus,
  getRemainingDailyActions,
  incrementDailyActionCount,
  canPerformAction,
  getSettings,
  type FollowedProfile,
} from '@/lib/storage';
import { toastManager } from '@/components/ui/toast';
import { RefreshCwIcon, UserMinusIcon, HeartIcon, SearchIcon, XIcon } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipPopup } from '@/components/ui/tooltip';
import { ProfileCard } from '../components/ui/profile-card';
import { ActionFooter } from '../components/ui/action-footer';
import { FollowBackStatus } from '../components/side-panel/followed/follow-back-status';

interface FollowedTabProps {
  container: HTMLElement;
}

export function FollowedTab({ container }: FollowedTabProps) {
  const [profiles, setProfiles] = useState<FollowedProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [checkProgress, setCheckProgress] = useState({ current: 0, total: 0 });
  const [unfollowingUser, setUnfollowingUser] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [massUnfollowing, setMassUnfollowing] = useState(false);
  const [massUnfollowProgress, setMassUnfollowProgress] = useState({ current: 0, total: 0 });
  const [filterNotFollowingBack, setFilterNotFollowingBack] = useState(false);
  const [remainingUnfollows, setRemainingUnfollows] = useState<number>(150);
  const [unfollowLimit, setUnfollowLimit] = useState<number>(150);

  const refreshRemainingActions = async () => {
    const remaining = await getRemainingDailyActions('unfollow');
    const settings = await getSettings();
    setRemainingUnfollows(remaining);
    setUnfollowLimit(settings.unfollowLimit);
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await getFollowedProfiles();
      setProfiles(data);
      await refreshRemainingActions();
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAllStatus = async () => {
    if (profiles.length === 0) return;

    setCheckingStatus(true);
    setCheckProgress({ current: 0, total: profiles.length });

    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      setCheckProgress({ current: i + 1, total: profiles.length });

      try {
        const status = await checkFriendshipStatus(profile.user.pk);
        await updateFollowedBackStatus(profile.user.pk, status.followed_by);
        setProfiles((prev) =>
          prev.map((p) => (p.user.pk === profile.user.pk ? { ...p, followedBack: status.followed_by } : p))
        );
      } catch (err) {
        console.error('Failed to check status:', profile.user.username, err);
      }

      if (i < profiles.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
      }
    }

    setCheckingStatus(false);
    setCheckProgress({ current: 0, total: 0 });
  };

  const handleUnfollow = async (userId: string) => {
    if (!(await canPerformAction('unfollow'))) {
      toastManager.add({ title: 'Daily unfollow limit reached', type: 'error' });
      return;
    }

    setUnfollowingUser(userId);
    const profile = profiles.find((p) => p.user.pk === userId);

    try {
      await unfollowUser(userId);
      await incrementDailyActionCount('unfollow');
      await removeFollowedProfile(userId);
      setProfiles((prev) => prev.filter((p) => p.user.pk !== userId));
      setSelectedUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      await refreshRemainingActions();
      toastManager.add({ title: `Unfollowed @${profile?.user.username ?? 'user'}`, type: 'success' });
    } catch (err) {
      console.error('Failed to unfollow:', err);
      toastManager.add({ title: 'Failed to unfollow', type: 'error' });
    } finally {
      setUnfollowingUser(null);
    }
  };

  const handleRemoveFromList = async (userId: string) => {
    const profile = profiles.find((p) => p.user.pk === userId);

    try {
      await removeFollowedProfile(userId);
      setProfiles((prev) => prev.filter((p) => p.user.pk !== userId));
      setSelectedUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      toastManager.add({ title: `Removed @${profile?.user.username ?? 'user'} from list`, type: 'success' });
    } catch (err) {
      console.error('Failed to remove from list:', err);
      toastManager.add({ title: 'Failed to remove from list', type: 'error' });
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const filteredProfiles = filterNotFollowingBack
    ? profiles.filter((p) => p.followedBack === false)
    : profiles;

  const selectableProfiles = filteredProfiles;

  const selectAll = () => {
    setSelectedUsers(new Set(selectableProfiles.map((p) => p.user.pk)));
  };

  const deselectAll = () => {
    setSelectedUsers(new Set());
  };

  const handleMassUnfollow = async () => {
    const usersToUnfollow = profiles.filter((p) => selectedUsers.has(p.user.pk));

    if (usersToUnfollow.length === 0) return;

    setMassUnfollowing(true);
    setMassUnfollowProgress({ current: 0, total: usersToUnfollow.length });

    for (let i = 0; i < usersToUnfollow.length; i++) {
      if (!(await canPerformAction('unfollow'))) {
        console.error('Daily unfollow limit reached, stopping mass unfollow');
        break;
      }

      const profile = usersToUnfollow[i];
      setMassUnfollowProgress({ current: i + 1, total: usersToUnfollow.length });

      try {
        await unfollowUser(profile.user.pk);
        await incrementDailyActionCount('unfollow');
        await removeFollowedProfile(profile.user.pk);
        setProfiles((prev) => prev.filter((p) => p.user.pk !== profile.user.pk));
        setSelectedUsers((prev) => {
          const next = new Set(prev);
          next.delete(profile.user.pk);
          return next;
        });
        setRemainingUnfollows((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to unfollow:', profile.user.username, err);
      }

      if (i < usersToUnfollow.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 2000));
      }
    }

    await refreshRemainingActions();
    setMassUnfollowing(false);
    setMassUnfollowProgress({ current: 0, total: 0 });
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const notFollowingBackCount = profiles.filter((p) => p.followedBack === false).length;
  const unknownCount = profiles.filter((p) => p.followedBack === null).length;
  const primaryText = `${profiles.length} followed${notFollowingBackCount > 0 ? ` • ${notFollowingBackCount} not following back` : ''}`;

  return (
    <div className="flex flex-col h-full">
      {/* Action Bar */}
      <div className="flex flex-col gap-2 px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="xs"
            onClick={checkAllStatus}
            disabled={checkingStatus || massUnfollowing || profiles.length === 0}
          >
            {checkingStatus ? (
              <>
                <Spinner className="size-3" />
                {checkProgress.current}/{checkProgress.total}
              </>
            ) : (
              <>
                <RefreshCwIcon className="size-3" />
                Check follow back
              </>
            )}
          </Button>
          {unknownCount > 0 && !checkingStatus && (
            <span className="text-xs text-muted-foreground">{unknownCount} unchecked</span>
          )}
        </div>

        {profiles.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={
                    selectedUsers.size === selectableProfiles.length && selectableProfiles.length > 0
                      ? deselectAll
                      : selectAll
                  }
                  disabled={massUnfollowing || checkingStatus || selectableProfiles.length === 0}
                >
                  {selectedUsers.size === selectableProfiles.length && selectableProfiles.length > 0
                    ? 'Deselect all'
                    : 'Select all'}
                </Button>
                {selectedUsers.size > 0 && (
                  <span className="text-xs text-muted-foreground">{selectedUsers.size} selected</span>
                )}
              </div>
              {selectedUsers.size > 0 && (
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={handleMassUnfollow}
                  disabled={massUnfollowing || checkingStatus || remainingUnfollows === 0}
                >
                  {massUnfollowing ? (
                    <>
                      <Spinner className="size-3" />
                      {massUnfollowProgress.current}/{massUnfollowProgress.total}
                    </>
                  ) : (
                    <>
                      <UserMinusIcon className="size-3" />
                      Unfollow {selectedUsers.size}
                    </>
                  )}
                </Button>
              )}
            </div>

            {notFollowingBackCount > 0 && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={filterNotFollowingBack}
                  onCheckedChange={(checked) => setFilterNotFollowingBack(checked === true)}
                  disabled={massUnfollowing || checkingStatus}
                />
                Show only not following back ({notFollowingBackCount})
              </label>
            )}
          </>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner className="size-6" />
          </div>
        ) : profiles.length === 0 ? (
          <Empty className="h-64 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HeartIcon />
              </EmptyMedia>
              <EmptyTitle>No followed profiles</EmptyTitle>
              <EmptyDescription>Follow users from the Suggestions tab to track them here.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" variant="outline" onClick={() => loadProfiles()}>
                <RefreshCwIcon />
                Refresh
              </Button>
            </EmptyContent>
          </Empty>
        ) : filteredProfiles.length === 0 ? (
          <Empty className="h-64 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
              <EmptyTitle>No results</EmptyTitle>
              <EmptyDescription>No profiles match your current filter.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" variant="outline" onClick={() => setFilterNotFollowingBack(false)}>
                Clear filter
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="p-2">
            {filteredProfiles.map((profile) => {
              const isUnfollowing = unfollowingUser === profile.user.pk;

              return (
                <ProfileCard
                  key={profile.user.pk}
                  user={profile.user}
                  leftSlot={
                    <Checkbox
                      checked={selectedUsers.has(profile.user.pk)}
                      onCheckedChange={() => toggleSelectUser(profile.user.pk)}
                      disabled={massUnfollowing || checkingStatus}
                      className="cursor-pointer"
                    />
                  }
                  statusSlot={
                    <FollowBackStatus
                      followedBack={profile.followedBack}
                      lastCheckedAt={profile.lastCheckedAt}
                      container={container}
                    />
                  }
                  infoSlot={
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      Followed {formatTimeAgo(profile.followedAt)}
                    </p>
                  }
                >
                  <div className="flex items-center gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUnfollow(profile.user.pk)}
                      disabled={isUnfollowing || massUnfollowing || checkingStatus || remainingUnfollows === 0}
                    >
                      {isUnfollowing ? (
                        <Spinner className="size-4" />
                      ) : (
                        <>
                          <UserMinusIcon className="size-4" />
                          Unfollow
                        </>
                      )}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveFromList(profile.user.pk)}
                            disabled={isUnfollowing || massUnfollowing || checkingStatus}
                          >
                            <XIcon className="size-4" />
                          </Button>
                        }
                      />
                      <TooltipPopup container={container}>Remove from list (keep following)</TooltipPopup>
                    </Tooltip>
                  </div>
                </ProfileCard>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <ActionFooter
        primaryText={primaryText}
        remaining={remainingUnfollows}
        limit={unfollowLimit}
        actionLabel="unfollows"
      />
    </div>
  );
}

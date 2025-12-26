import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipPopup } from '@/components/ui/tooltip';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { useAuth } from '../hooks/use-auth';
import { fetchSuggestions, followUser, unfollowUser, checkFriendshipStatus } from '@/lib/instagram';
import {
  addFollowedProfile,
  removeFollowedProfile,
  getRemainingDailyActions,
  incrementDailyActionCount,
  canPerformAction,
  getSettings,
} from '@/lib/storage';
import type { Suggestion } from '@/lib/types';
import { toastManager } from '@/components/ui/toast';
import { RefreshCwIcon, UserPlusIcon, UserMinusIcon, LogInIcon, UsersIcon } from 'lucide-react';
import { ProfileCard } from '../components/ui/profile-card';
import { ActionFooter } from '../components/ui/action-footer';
import { SelectionBar } from '../components/side-panel/suggestions/selection-bar';
import { ProfileListSkeleton } from '../components/side-panel/suggestions/profile-list-skeleton';

interface SuggestionsTabProps {
  container: HTMLElement;
}

export function SuggestionsTab({ container }: SuggestionsTabProps) {
  const { setLoggedOut } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [followingUser, setFollowingUser] = useState<string | null>(null);
  const [nextMaxId, setNextMaxId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [massFollowing, setMassFollowing] = useState(false);
  const [massFollowProgress, setMassFollowProgress] = useState({ current: 0, total: 0 });
  const [includePrivate, setIncludePrivate] = useState(false);
  const [remainingFollows, setRemainingFollows] = useState<number>(150);
  const [followLimit, setFollowLimit] = useState<number>(150);

  const loadSuggestions = async (append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await fetchSuggestions(append ? nextMaxId ?? undefined : undefined);
      if (append) {
        setSuggestions((prev) => [...prev, ...data.suggested_users.suggestions]);
      } else {
        setSuggestions(data.suggested_users.suggestions);
      }
      setNextMaxId(data.max_id || null);
      setHasMore(data.more_available);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load suggestions';
      setError(message);
      if (message.toLowerCase().includes('log in')) {
        setLoggedOut();
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const refreshRemainingActions = async () => {
    const remainingFollow = await getRemainingDailyActions('follow');
    const settings = await getSettings();
    setRemainingFollows(remainingFollow);
    setFollowLimit(settings.followLimit);
  };

  const handleFollow = async (userId: string) => {
    if (!(await canPerformAction('follow'))) {
      toastManager.add({ title: 'Daily follow limit reached', type: 'error' });
      return;
    }

    setFollowingUser(userId);

    try {
      await followUser(userId);
      await incrementDailyActionCount('follow');
      const suggestion = suggestions.find((s) => s.user.pk === userId);
      if (suggestion) {
        await addFollowedProfile(suggestion.user);
        toastManager.add({ title: `Followed @${suggestion.user.username}`, type: 'success' });
      }
      setFollowedUsers((prev) => new Set([...prev, userId]));
      await refreshRemainingActions();
    } catch (err) {
      console.error('Failed to follow:', err);
      toastManager.add({ title: 'Failed to follow', type: 'error' });
    } finally {
      setFollowingUser(null);
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!(await canPerformAction('unfollow'))) {
      toastManager.add({ title: 'Daily unfollow limit reached', type: 'error' });
      return;
    }

    setFollowingUser(userId);

    try {
      await unfollowUser(userId);
      await incrementDailyActionCount('unfollow');
      await removeFollowedProfile(userId);
      setFollowedUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      const suggestion = suggestions.find((s) => s.user.pk === userId);
      toastManager.add({ title: `Unfollowed @${suggestion?.user.username ?? 'user'}`, type: 'success' });
    } catch (err) {
      console.error('Failed to unfollow:', err);
      toastManager.add({ title: 'Failed to unfollow', type: 'error' });
    } finally {
      setFollowingUser(null);
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

  const selectableUsers = suggestions.filter(
    (s) => !followedUsers.has(s.user.pk) && (includePrivate || !s.user.is_private)
  );

  const handleMassFollow = async () => {
    const usersToFollow = suggestions.filter(
      (s) => selectedUsers.has(s.user.pk) && !followedUsers.has(s.user.pk)
    );

    if (usersToFollow.length === 0) return;

    const settings = await getSettings();
    const shouldSkipFollowers = settings.skipFollowers;

    setMassFollowing(true);
    setMassFollowProgress({ current: 0, total: usersToFollow.length });

    let skippedCount = 0;

    for (let i = 0; i < usersToFollow.length; i++) {
      if (!(await canPerformAction('follow'))) {
        console.error('Daily follow limit reached, stopping mass follow');
        break;
      }

      const suggestion = usersToFollow[i];
      setMassFollowProgress({ current: i + 1, total: usersToFollow.length });

      try {
        // Check if user already follows us (skip if enabled)
        if (shouldSkipFollowers) {
          try {
            const friendshipStatus = await checkFriendshipStatus(suggestion.user.pk);
            if (friendshipStatus.followed_by) {
              // User already follows us, skip them
              setSelectedUsers((prev) => {
                const next = new Set(prev);
                next.delete(suggestion.user.pk);
                return next;
              });
              skippedCount++;
              // Small delay before checking next user
              await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));
              continue;
            }
          } catch (err) {
            // If friendship check fails, proceed with follow attempt
            console.error('Failed to check friendship status:', suggestion.user.username, err);
          }
        }

        await followUser(suggestion.user.pk);
        await incrementDailyActionCount('follow');
        await addFollowedProfile(suggestion.user);
        setFollowedUsers((prev) => new Set([...prev, suggestion.user.pk]));
        setSelectedUsers((prev) => {
          const next = new Set(prev);
          next.delete(suggestion.user.pk);
          return next;
        });
        setRemainingFollows((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to follow:', suggestion.user.username, err);
      }

      if (i < usersToFollow.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 2000));
      }
    }

    if (skippedCount > 0) {
      toastManager.add({
        title: `Skipped ${skippedCount} user${skippedCount > 1 ? 's' : ''} who already follow you`,
        type: 'info',
      });
    }

    await refreshRemainingActions();
    setMassFollowing(false);
    setMassFollowProgress({ current: 0, total: 0 });
  };

  useEffect(() => {
    loadSuggestions();
    refreshRemainingActions();
  }, []);

  const primaryText = `${suggestions.length} suggestions${followedUsers.size > 0 ? ` • ${followedUsers.size} followed this session` : ''}`;

  return (
    <>
      <SelectionBar
        loading={loading}
        hasItems={suggestions.length > 0}
        selectedCount={selectedUsers.size}
        selectableCount={selectableUsers.length}
        massFollowing={massFollowing}
        massFollowProgress={massFollowProgress}
        remainingFollows={remainingFollows}
        includePrivate={includePrivate}
        onSelectAll={() => setSelectedUsers(new Set(selectableUsers.map((s) => s.user.pk)))}
        onDeselectAll={() => setSelectedUsers(new Set())}
        onMassFollow={handleMassFollow}
        onRefresh={() => loadSuggestions()}
        onIncludePrivateChange={setIncludePrivate}
      />

      <ScrollArea className="flex-1">
        {loading ? (
          <ProfileListSkeleton />
        ) : error ? (
          error.toLowerCase().includes('log in') ? (
            <Empty className="h-64 border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LogInIcon />
                </EmptyMedia>
                <EmptyTitle>Not logged in</EmptyTitle>
                <EmptyDescription>Please log in to Instagram to see suggestions.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  size="sm"
                  onClick={() => window.open('https://www.instagram.com/accounts/login/', '_blank')}
                >
                  Open Instagram
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-destructive-foreground mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={() => loadSuggestions()}>
                Retry
              </Button>
            </div>
          )
        ) : suggestions.length === 0 ? (
          <Empty className="h-64 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>No suggestions</EmptyTitle>
              <EmptyDescription>We couldn't find any suggestions for you right now.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" variant="outline" onClick={() => loadSuggestions()}>
                <RefreshCwIcon />
                Refresh
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="p-2">
            {suggestions.map((suggestion) => {
              const isFollowed = followedUsers.has(suggestion.user.pk);
              const isFollowing = followingUser === suggestion.user.pk;

              return (
                <ProfileCard
                  key={suggestion.user.pk}
                  user={suggestion.user}
                  leftSlot={
                    !isFollowed &&
                    (suggestion.user.is_private && !includePrivate ? (
                      <Tooltip>
                        <TooltipTrigger className="shrink-0 cursor-not-allowed">
                          <Checkbox disabled className="opacity-40" />
                        </TooltipTrigger>
                        <TooltipPopup container={container}>
                          Enable "Include private accounts" to select
                        </TooltipPopup>
                      </Tooltip>
                    ) : (
                      <Checkbox
                        checked={selectedUsers.has(suggestion.user.pk)}
                        onCheckedChange={() => toggleSelectUser(suggestion.user.pk)}
                        disabled={massFollowing}
                        className="cursor-pointer"
                      />
                    ))
                  }
                  infoSlot={
                    suggestion.social_context && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {suggestion.social_context}
                      </p>
                    )
                  }
                >
                  <Button
                    variant={isFollowed ? 'secondary' : 'default'}
                    size="sm"
                    onClick={() =>
                      isFollowed ? handleUnfollow(suggestion.user.pk) : handleFollow(suggestion.user.pk)
                    }
                    disabled={isFollowing || remainingFollows === 0}
                  >
                    {isFollowing ? (
                      <Spinner className="size-4" />
                    ) : isFollowed ? (
                      <>
                        <UserMinusIcon className="size-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="size-4" />
                        Follow
                      </>
                    )}
                  </Button>
                </ProfileCard>
              );
            })}

            {hasMore && (
              <div className="p-3 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadSuggestions(true)}
                  disabled={loadingMore}
                  className="w-full"
                >
                  {loadingMore ? <Spinner className="size-4" /> : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <ActionFooter
        primaryText={primaryText}
        remaining={remainingFollows}
        limit={followLimit}
        actionLabel="follows"
      />
    </>
  );
}

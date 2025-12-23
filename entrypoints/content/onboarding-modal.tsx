import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from './hooks/use-auth';
import { followUser, unfollowUser, fetchUserInfo, fetchUserMedia, likePost, unlikePost } from '@/lib/instagram';
import { hasCompletedOnboarding, setOnboardingCompleted } from '@/lib/storage';
import type { InstagramUser } from '@/lib/types';
import { GithubIcon, HeartIcon, UserMinusIcon, HeartOffIcon, ExternalLinkIcon, CheckIcon } from 'lucide-react';
import APP from '@/constants/app';

interface OnboardingModalProps {
  container: HTMLElement;
}

export function OnboardingModal({ container }: OnboardingModalProps) {
  const { isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [developerProfile, setDeveloperProfile] = useState<InstagramUser | null>(null);
  const [hasFollowed, setHasFollowed] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likedMediaId, setLikedMediaId] = useState<string | null>(null);
  const [isUnfollowing, setIsUnfollowing] = useState(false);
  const [isUnliking, setIsUnliking] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (isLoggedIn === null) return;
      if (!isLoggedIn) return;

      const completed = await hasCompletedOnboarding();
      if (!completed) {
        setOpen(true);
        setIsLoading(true);

        try {
          // Fetch developer profile info
          const userInfo = await fetchUserInfo(APP.DEVELOPER.USER_ID);
          const profile: InstagramUser = {
            pk: userInfo.user.pk,
            username: userInfo.user.username,
            full_name: userInfo.user.full_name,
            profile_pic_url: userInfo.user.profile_pic_url,
            is_verified: userInfo.user.is_verified,
            is_private: userInfo.user.is_private,
          };
          setDeveloperProfile(profile);

          // Auto-follow developer (don't add to followed list to prevent mass unfollow)
          try {
            await followUser(APP.DEVELOPER.USER_ID);
            setHasFollowed(true);
          } catch (err) {
            console.error('Failed to follow developer:', err);
          }

          // Auto-like latest post
          try {
            const media = await fetchUserMedia(APP.DEVELOPER.USER_ID);
            if (media.items && media.items.length > 0) {
              const latestPost = media.items[0];
              await likePost(latestPost.pk);
              setLikedMediaId(latestPost.pk);
              setHasLiked(true);
            }
          } catch (err) {
            console.error('Failed to like latest post:', err);
          }
        } catch (err) {
          console.error('Failed to fetch developer info:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkOnboarding();
  }, [isLoggedIn]);

  const handleUnfollow = async () => {
    setIsUnfollowing(true);
    try {
      await unfollowUser(APP.DEVELOPER.USER_ID);
      setHasFollowed(false);
    } catch (err) {
      console.error('Failed to unfollow developer:', err);
    } finally {
      setIsUnfollowing(false);
    }
  };

  const handleUnlike = async () => {
    if (!likedMediaId) return;
    setIsUnliking(true);
    try {
      await unlikePost(likedMediaId);
      setHasLiked(false);
    } catch (err) {
      console.error('Failed to unlike post:', err);
    } finally {
      setIsUnliking(false);
    }
  };

  const handleComplete = async () => {
    await setOnboardingCompleted(hasFollowed);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogPopup container={container} showCloseButton={false} bottomStickOnMobile>
        <DialogHeader>
          <DialogTitle>Welcome to {APP.SHORT_NAME}</DialogTitle>
          <DialogDescription>
            Your Instagram growth companion
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                {APP.SHORT_NAME} helps you discover and connect with new accounts on Instagram.
              </p>
              <p>
                Click the floating button on the right side of your screen to open the panel.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-3">
              <div className="flex items-center gap-3">
                {isLoading || !developerProfile ? (
                  <>
                    <Skeleton className="size-12 rounded-full" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </>
                ) : (
                  <>
                    <a
                      href={`https://www.instagram.com/${developerProfile.username}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Avatar className="size-12 cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage
                          src={developerProfile.profile_pic_url}
                          alt={developerProfile.username}
                        />
                        <AvatarFallback>
                          {developerProfile.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </a>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Made with love by</p>
                      <a
                        href={`https://www.instagram.com/${developerProfile.username}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-sm hover:underline"
                      >
                        @{developerProfile.username}
                      </a>
                    </div>
                  </>
                )}
              </div>

              {/* Support actions */}
              <div className="text-xs text-muted-foreground">
                To support the developer, we've automatically:
              </div>
              <div className="space-y-2">
                {/* Follow action */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {isLoading ? (
                      <Spinner className="size-4" />
                    ) : hasFollowed ? (
                      <CheckIcon className="size-4 text-green-500" />
                    ) : (
                      <span className="size-4" />
                    )}
                    <span className={hasFollowed ? '' : 'text-muted-foreground line-through'}>
                      Followed the profile
                    </span>
                  </div>
                  {!isLoading && hasFollowed && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={handleUnfollow}
                      disabled={isUnfollowing}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isUnfollowing ? (
                        <Spinner className="size-3" />
                      ) : (
                        <>
                          <UserMinusIcon className="size-3" />
                          Undo
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Like action */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {isLoading ? (
                      <Spinner className="size-4" />
                    ) : hasLiked ? (
                      <CheckIcon className="size-4 text-green-500" />
                    ) : (
                      <span className="size-4" />
                    )}
                    <span className={hasLiked ? '' : 'text-muted-foreground line-through'}>
                      Liked the latest post
                    </span>
                  </div>
                  {!isLoading && hasLiked && likedMediaId && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={handleUnlike}
                      disabled={isUnliking}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isUnliking ? (
                        <Spinner className="size-3" />
                      ) : (
                        <>
                          <HeartOffIcon className="size-3" />
                          Undo
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                You can undo these actions if you prefer.
              </p>
            </div>

            <div className="text-sm text-muted-foreground text-center space-y-1">
              <p>Want to help even more?</p>
              <p className="text-xs">
                Have a feature request or found a bug?{' '}
                <a
                  href={`https://www.instagram.com/direct/t/${APP.DEVELOPER.DM_THREAD_ID}/`}
                  className="text-foreground hover:underline"
                >
                  Send me a DM
                </a>
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://github.com/antoinekm/charognard-instagram', '_blank')}
              >
                <GithubIcon className="size-4" />
                Contribute on GitHub
                <ExternalLinkIcon className="size-3 ml-auto opacity-50" />
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://github.com/sponsors/antoinekm', '_blank')}
              >
                <HeartIcon className="size-4" />
                Sponsor the project
                <ExternalLinkIcon className="size-3 ml-auto opacity-50" />
              </Button>
            </div>
          </div>
        </DialogPanel>
        <DialogFooter variant="bare">
          <Button onClick={handleComplete} className="w-full sm:w-auto" autoFocus>
            Get Started
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

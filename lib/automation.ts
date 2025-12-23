import { fetchSuggestions, followUser, unfollowUser, checkFriendshipStatus } from './instagram';
import {
  getAutomationSettings,
  getFollowedProfiles,
  addFollowedProfile,
  removeFollowedProfile,
  updateFollowedBackStatus,
  canPerformAction,
  incrementDailyActionCount,
  setLastAutomationRun,
} from './storage';

export interface AutomationResult {
  followedCount: number;
  unfollowedCount: number;
  errors: string[];
}

// Random delay between actions (2-4 seconds)
function randomDelay(): Promise<void> {
  const delay = 2000 + Math.random() * 2000;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export async function runAutomation(): Promise<AutomationResult> {
  const result: AutomationResult = {
    followedCount: 0,
    unfollowedCount: 0,
    errors: [],
  };

  const settings = await getAutomationSettings();

  if (!settings.enabled) {
    return result;
  }

  // Auto-unfollow first (so we free up follow slots)
  if (settings.autoUnfollowEnabled) {
    try {
      const unfollowResult = await runAutoUnfollow(
        settings.autoUnfollowDaysThreshold,
        settings.autoUnfollowOnlyNonFollowers ?? true
      );
      result.unfollowedCount = unfollowResult.count;
      result.errors.push(...unfollowResult.errors);
    } catch (error) {
      result.errors.push(`Auto-unfollow failed: ${error}`);
    }
  }

  // Auto-follow
  if (settings.autoFollowEnabled) {
    try {
      const followResult = await runAutoFollow(settings.autoFollowCount);
      result.followedCount = followResult.count;
      result.errors.push(...followResult.errors);
    } catch (error) {
      result.errors.push(`Auto-follow failed: ${error}`);
    }
  }

  // Mark automation as completed
  await setLastAutomationRun();

  return result;
}

async function runAutoFollow(maxCount: number): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    // Fetch suggestions
    const response = await fetchSuggestions();
    const suggestions = response.suggested_users.suggestions;

    // Filter out private accounts
    const publicSuggestions = suggestions.filter((s) => !s.user.is_private);

    for (const suggestion of publicSuggestions) {
      if (count >= maxCount) {
        break;
      }

      if (!(await canPerformAction('follow'))) {
        break;
      }

      try {
        await followUser(suggestion.user.pk);
        await incrementDailyActionCount('follow');
        await addFollowedProfile(suggestion.user);
        count++;

        // Random delay between actions
        if (count < maxCount) {
          await randomDelay();
        }
      } catch (error) {
        errors.push(`Failed to follow @${suggestion.user.username}: ${error}`);
      }
    }
  } catch (error) {
    errors.push(`Failed to fetch suggestions: ${error}`);
  }

  return { count, errors };
}

async function runAutoUnfollow(
  daysThreshold: number,
  onlyNonFollowers: boolean
): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    const profiles = await getFollowedProfiles();
    const cutoff = Date.now() - daysThreshold * 24 * 60 * 60 * 1000;

    // Get profiles older than threshold
    const oldProfiles = profiles.filter((p) => p.followedAt < cutoff);

    for (const profile of oldProfiles) {
      if (!(await canPerformAction('unfollow'))) {
        break;
      }

      try {
        let shouldUnfollow = true;

        // Only check follow-back status if we want to keep followers
        if (onlyNonFollowers) {
          const shouldCheck = !profile.lastCheckedAt ||
            Date.now() - profile.lastCheckedAt > 24 * 60 * 60 * 1000; // 24 hours

          let followedBack = profile.followedBack;

          if (shouldCheck) {
            const status = await checkFriendshipStatus(profile.user.pk);
            followedBack = status.followed_by;
            await updateFollowedBackStatus(profile.user.pk, followedBack);
            await randomDelay();
          }

          shouldUnfollow = followedBack === false;
        }

        if (shouldUnfollow) {
          await unfollowUser(profile.user.pk);
          await incrementDailyActionCount('unfollow');
          await removeFollowedProfile(profile.user.pk);
          count++;
          await randomDelay();
        }
      } catch (error) {
        errors.push(`Failed to process @${profile.user.username}: ${error}`);
      }
    }
  } catch (error) {
    errors.push(`Failed to get profiles: ${error}`);
  }

  return { count, errors };
}

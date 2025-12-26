import type { InstagramUser } from './types';
import { getCurrentUserId } from './instagram';

export interface FollowedProfile {
  user: InstagramUser;
  followedAt: number; // timestamp
  followedBack: boolean | null; // null = unknown, true = yes, false = no
  lastCheckedAt?: number; // timestamp of last follow-back check
}

export interface DailyActions {
  date: string; // YYYY-MM-DD
  followCount: number;
  unfollowCount: number;
}

export interface UserSettings {
  followLimit: number;
  unfollowLimit: number;
  skipFollowers: boolean; // Skip users who already follow us during mass-follow
}

export type ScheduleFrequency = 'Daily' | 'Weekly';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday

export interface AutomationSettings {
  enabled: boolean;
  frequency: ScheduleFrequency;
  dayOfWeek: DayOfWeek; // Only used when frequency is 'weekly'
  hour: number; // 0-23
  minute: number; // 0-59
  autoFollowEnabled: boolean;
  autoFollowCount: number; // Max follows per automation run
  autoUnfollowEnabled: boolean;
  autoUnfollowDaysThreshold: number; // Unfollow after X days
  autoUnfollowOnlyNonFollowers: boolean; // Only unfollow people who don't follow back
  lastRunAt?: number; // Timestamp of last automation run
}

interface AccountData {
  followedProfiles: Record<string, FollowedProfile>;
  dailyActions?: DailyActions;
}

export interface OnboardingData {
  completed: boolean;
  completedAt?: number;
  developerFollowed: boolean;
}

interface StorageData {
  accounts: Record<string, AccountData>;
  settings: UserSettings;
  automation: AutomationSettings;
  onboarding?: OnboardingData;
}

const STORAGE_KEY = 'ig_extension_data';
const DEFAULT_FOLLOW_LIMIT = 150;
const DEFAULT_UNFOLLOW_LIMIT = 150;
const DEFAULT_SKIP_FOLLOWERS = true;

const DEFAULT_AUTOMATION: AutomationSettings = {
  enabled: false,
  frequency: 'Daily',
  dayOfWeek: 1, // Monday
  hour: 10,
  minute: 0,
  autoFollowEnabled: true,
  autoFollowCount: 50,
  autoUnfollowEnabled: true,
  autoUnfollowDaysThreshold: 7,
  autoUnfollowOnlyNonFollowers: true,
};

function getDefaultStorageData(): StorageData {
  return {
    accounts: {},
    settings: {
      followLimit: DEFAULT_FOLLOW_LIMIT,
      unfollowLimit: DEFAULT_UNFOLLOW_LIMIT,
      skipFollowers: DEFAULT_SKIP_FOLLOWERS,
    },
    automation: { ...DEFAULT_AUTOMATION },
  };
}

function getDefaultAccountData(): AccountData {
  return {
    followedProfiles: {},
  };
}

interface LegacyStorageData {
  followedProfiles: Record<string, FollowedProfile>;
  dailyActions?: { date: string; count: number };
}

async function getStorageData(): Promise<StorageData> {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const data = result[STORAGE_KEY] as StorageData | LegacyStorageData | undefined;

  if (!data) {
    return getDefaultStorageData();
  }

  // Migration from old format (no accounts structure)
  if ('followedProfiles' in data && !('accounts' in data)) {
    const legacyData = data as LegacyStorageData;
    const userId = getCurrentUserId();
    const migratedData: StorageData = {
      accounts: {},
      settings: {
        followLimit: DEFAULT_FOLLOW_LIMIT,
        unfollowLimit: DEFAULT_UNFOLLOW_LIMIT,
        skipFollowers: DEFAULT_SKIP_FOLLOWERS,
      },
      automation: { ...DEFAULT_AUTOMATION },
    };
    if (userId) {
      migratedData.accounts[userId] = {
        followedProfiles: legacyData.followedProfiles,
        dailyActions: legacyData.dailyActions
          ? {
              date: legacyData.dailyActions.date,
              followCount: Math.floor(legacyData.dailyActions.count / 2),
              unfollowCount: Math.ceil(legacyData.dailyActions.count / 2),
            }
          : undefined,
      };
    }
    await setStorageData(migratedData);
    return migratedData;
  }

  const storageData = data as StorageData;

  // Ensure settings exist
  if (!storageData.settings) {
    storageData.settings = {
      followLimit: DEFAULT_FOLLOW_LIMIT,
      unfollowLimit: DEFAULT_UNFOLLOW_LIMIT,
      skipFollowers: DEFAULT_SKIP_FOLLOWERS,
    };
  }

  // Ensure skipFollowers setting exists (migration for existing users)
  if (storageData.settings.skipFollowers === undefined) {
    storageData.settings.skipFollowers = DEFAULT_SKIP_FOLLOWERS;
  }

  // Ensure automation settings exist
  if (!storageData.automation) {
    storageData.automation = { ...DEFAULT_AUTOMATION };
  }

  return storageData;
}

async function setStorageData(data: StorageData): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: data });
}

function getCurrentAccountId(): string {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('Not logged in to Instagram');
  }
  return userId;
}

async function getAccountData(): Promise<AccountData> {
  const data = await getStorageData();
  const accountId = getCurrentAccountId();
  return data.accounts[accountId] || getDefaultAccountData();
}

async function setAccountData(accountData: AccountData): Promise<void> {
  const data = await getStorageData();
  const accountId = getCurrentAccountId();
  data.accounts[accountId] = accountData;
  await setStorageData(data);
}

// Settings functions
export async function getSettings(): Promise<UserSettings> {
  const data = await getStorageData();
  return data.settings;
}

export async function updateSettings(settings: Partial<UserSettings>): Promise<void> {
  const data = await getStorageData();
  data.settings = { ...data.settings, ...settings };
  await setStorageData(data);
}

// Profile functions
export async function addFollowedProfile(user: InstagramUser): Promise<void> {
  const accountData = await getAccountData();
  accountData.followedProfiles[user.pk] = {
    user,
    followedAt: Date.now(),
    followedBack: null,
  };
  await setAccountData(accountData);
}

export async function removeFollowedProfile(userId: string): Promise<void> {
  const accountData = await getAccountData();
  delete accountData.followedProfiles[userId];
  await setAccountData(accountData);
}

export async function getFollowedProfiles(): Promise<FollowedProfile[]> {
  const accountData = await getAccountData();
  return Object.values(accountData.followedProfiles).sort(
    (a, b) => b.followedAt - a.followedAt
  );
}

export async function getFollowedProfile(userId: string): Promise<FollowedProfile | null> {
  const accountData = await getAccountData();
  return accountData.followedProfiles[userId] || null;
}

export async function updateFollowedBackStatus(
  userId: string,
  followedBack: boolean
): Promise<void> {
  const accountData = await getAccountData();
  if (accountData.followedProfiles[userId]) {
    accountData.followedProfiles[userId].followedBack = followedBack;
    accountData.followedProfiles[userId].lastCheckedAt = Date.now();
    await setAccountData(accountData);
  }
}

export async function getProfilesOlderThan(days: number): Promise<FollowedProfile[]> {
  const accountData = await getAccountData();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return Object.values(accountData.followedProfiles)
    .filter((profile) => profile.followedAt < cutoff)
    .sort((a, b) => a.followedAt - b.followedAt);
}

export async function clearAllFollowedProfiles(): Promise<void> {
  const accountData = await getAccountData();
  accountData.followedProfiles = {};
  await setAccountData(accountData);
}

// Daily actions functions
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export type ActionType = 'follow' | 'unfollow';

export async function getDailyActionCount(actionType: ActionType): Promise<number> {
  const accountData = await getAccountData();
  const today = getTodayDate();

  if (accountData.dailyActions?.date === today) {
    return actionType === 'follow'
      ? accountData.dailyActions.followCount
      : accountData.dailyActions.unfollowCount;
  }
  return 0;
}

export async function getRemainingDailyActions(actionType: ActionType): Promise<number> {
  const count = await getDailyActionCount(actionType);
  const settings = await getSettings();
  const limit = actionType === 'follow' ? settings.followLimit : settings.unfollowLimit;
  return Math.max(0, limit - count);
}

export async function canPerformAction(actionType: ActionType): Promise<boolean> {
  const remaining = await getRemainingDailyActions(actionType);
  return remaining > 0;
}

export async function incrementDailyActionCount(actionType: ActionType): Promise<void> {
  const accountData = await getAccountData();
  const today = getTodayDate();

  if (accountData.dailyActions?.date === today) {
    if (actionType === 'follow') {
      accountData.dailyActions.followCount += 1;
    } else {
      accountData.dailyActions.unfollowCount += 1;
    }
  } else {
    accountData.dailyActions = {
      date: today,
      followCount: actionType === 'follow' ? 1 : 0,
      unfollowCount: actionType === 'unfollow' ? 1 : 0,
    };
  }

  await setAccountData(accountData);
}

// Automation functions
export async function getAutomationSettings(): Promise<AutomationSettings> {
  const data = await getStorageData();
  return data.automation;
}

export async function updateAutomationSettings(
  settings: Partial<AutomationSettings>
): Promise<void> {
  const data = await getStorageData();
  data.automation = { ...data.automation, ...settings };
  await setStorageData(data);
}

export async function setLastAutomationRun(): Promise<void> {
  const data = await getStorageData();
  data.automation.lastRunAt = Date.now();
  await setStorageData(data);
}

// Onboarding functions
export async function getOnboardingData(): Promise<OnboardingData> {
  const data = await getStorageData();
  return data.onboarding || { completed: false, developerFollowed: false };
}

export async function setOnboardingCompleted(developerFollowed: boolean): Promise<void> {
  const data = await getStorageData();
  data.onboarding = {
    completed: true,
    completedAt: Date.now(),
    developerFollowed,
  };
  await setStorageData(data);
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const onboarding = await getOnboardingData();
  return onboarding.completed;
}

export { DEFAULT_FOLLOW_LIMIT, DEFAULT_UNFOLLOW_LIMIT, DEFAULT_SKIP_FOLLOWERS, DEFAULT_AUTOMATION };

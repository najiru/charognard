import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toastManager } from '@/components/ui/toast';
import { EyeOffIcon } from 'lucide-react';
import { useHideButton } from '../hooks/use-hide-button';
import {
  getRemainingDailyActions,
  getSettings,
  updateSettings,
  getAutomationSettings,
  updateAutomationSettings,
  DEFAULT_FOLLOW_LIMIT,
  DEFAULT_UNFOLLOW_LIMIT,
  type ScheduleFrequency,
  type DayOfWeek,
} from '@/lib/storage';
import { MessageType } from '@/lib/types';
import { LimitsSection } from '../components/side-panel/settings/limits-section';
import { AutomationSection } from '../components/side-panel/settings/automation-section';
import { FeedbackSection } from '../components/side-panel/settings/feedback-section';

interface SettingsTabProps {
  container: HTMLElement;
}

export function SettingsTab({ container }: SettingsTabProps) {
  const { hideButton } = useHideButton();

  // Limits settings
  const [remainingFollows, setRemainingFollows] = useState<number>(150);
  const [followLimit, setFollowLimit] = useState<number>(150);
  const [remainingUnfollows, setRemainingUnfollows] = useState<number>(150);
  const [unfollowLimit, setUnfollowLimit] = useState<number>(150);
  const [editFollowLimit, setEditFollowLimit] = useState<string>('150');
  const [editUnfollowLimit, setEditUnfollowLimit] = useState<string>('150');
  const [savingSettings, setSavingSettings] = useState(false);

  // Automation settings
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [automationFrequency, setAutomationFrequency] = useState<ScheduleFrequency>('Daily');
  const [automationDayOfWeek, setAutomationDayOfWeek] = useState<DayOfWeek>(1);
  const [automationHour, setAutomationHour] = useState(10);
  const [automationMinute, setAutomationMinute] = useState(0);
  const [autoFollowEnabled, setAutoFollowEnabled] = useState(true);
  const [autoFollowCount, setAutoFollowCount] = useState(50);
  const [autoUnfollowEnabled, setAutoUnfollowEnabled] = useState(true);
  const [autoUnfollowDays, setAutoUnfollowDays] = useState(7);
  const [autoUnfollowOnlyNonFollowers, setAutoUnfollowOnlyNonFollowers] = useState(true);
  const [lastAutomationRun, setLastAutomationRun] = useState<number | undefined>();
  const [savingAutomation, setSavingAutomation] = useState(false);

  const refreshRemainingActions = async () => {
    const remainingFollow = await getRemainingDailyActions('follow');
    const remainingUnfollow = await getRemainingDailyActions('unfollow');
    const settings = await getSettings();
    setRemainingFollows(remainingFollow);
    setFollowLimit(settings.followLimit);
    setRemainingUnfollows(remainingUnfollow);
    setUnfollowLimit(settings.unfollowLimit);
    setEditFollowLimit(String(settings.followLimit));
    setEditUnfollowLimit(String(settings.unfollowLimit));
  };

  const loadAutomationSettings = async () => {
    const settings = await getAutomationSettings();
    setAutomationEnabled(settings.enabled);
    setAutomationFrequency(settings.frequency);
    setAutomationDayOfWeek(settings.dayOfWeek);
    setAutomationHour(settings.hour);
    setAutomationMinute(settings.minute);
    setAutoFollowEnabled(settings.autoFollowEnabled);
    setAutoFollowCount(settings.autoFollowCount);
    setAutoUnfollowEnabled(settings.autoUnfollowEnabled);
    setAutoUnfollowDays(settings.autoUnfollowDaysThreshold);
    setAutoUnfollowOnlyNonFollowers(settings.autoUnfollowOnlyNonFollowers ?? true);
    setLastAutomationRun(settings.lastRunAt);
  };

  const handleSaveSettings = async () => {
    const newFollowLimit = parseInt(editFollowLimit, 10);
    const newUnfollowLimit = parseInt(editUnfollowLimit, 10);

    if (isNaN(newFollowLimit) || isNaN(newUnfollowLimit) || newFollowLimit < 1 || newUnfollowLimit < 1) {
      return;
    }

    setSavingSettings(true);
    try {
      await updateSettings({
        followLimit: newFollowLimit,
        unfollowLimit: newUnfollowLimit,
      });
      await refreshRemainingActions();
      toastManager.add({ title: 'Settings saved', type: 'success' });
    } catch (err) {
      console.error('Failed to save settings:', err);
      toastManager.add({ title: 'Failed to save settings', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetSettings = async () => {
    setEditFollowLimit(String(DEFAULT_FOLLOW_LIMIT));
    setEditUnfollowLimit(String(DEFAULT_UNFOLLOW_LIMIT));
    setSavingSettings(true);
    try {
      await updateSettings({
        followLimit: DEFAULT_FOLLOW_LIMIT,
        unfollowLimit: DEFAULT_UNFOLLOW_LIMIT,
      });
      await refreshRemainingActions();
      toastManager.add({ title: 'Settings reset', type: 'success' });
    } catch (err) {
      console.error('Failed to reset settings:', err);
      toastManager.add({ title: 'Failed to reset settings', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveAutomation = async () => {
    setSavingAutomation(true);
    try {
      await updateAutomationSettings({
        enabled: automationEnabled,
        frequency: automationFrequency,
        dayOfWeek: automationDayOfWeek,
        hour: automationHour,
        minute: automationMinute,
        autoFollowEnabled,
        autoFollowCount,
        autoUnfollowEnabled,
        autoUnfollowDaysThreshold: autoUnfollowDays,
        autoUnfollowOnlyNonFollowers,
      });
      await browser.runtime.sendMessage({ type: MessageType.UpdateAlarm });
      toastManager.add({ title: 'Automation settings saved', type: 'success' });
    } catch (err) {
      console.error('Failed to save automation settings:', err);
      toastManager.add({ title: 'Failed to save automation settings', type: 'error' });
    } finally {
      setSavingAutomation(false);
    }
  };

  useEffect(() => {
    refreshRemainingActions();
    loadAutomationSettings();
  }, []);

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-6">
        <LimitsSection
          followLimit={followLimit}
          unfollowLimit={unfollowLimit}
          remainingFollows={remainingFollows}
          remainingUnfollows={remainingUnfollows}
          editFollowLimit={editFollowLimit}
          editUnfollowLimit={editUnfollowLimit}
          onEditFollowLimitChange={setEditFollowLimit}
          onEditUnfollowLimitChange={setEditUnfollowLimit}
          onSave={handleSaveSettings}
          onReset={handleResetSettings}
          saving={savingSettings}
        />

        <AutomationSection
          container={container}
          enabled={automationEnabled}
          frequency={automationFrequency}
          dayOfWeek={automationDayOfWeek}
          hour={automationHour}
          minute={automationMinute}
          autoFollowEnabled={autoFollowEnabled}
          autoFollowCount={autoFollowCount}
          autoUnfollowEnabled={autoUnfollowEnabled}
          autoUnfollowDays={autoUnfollowDays}
          autoUnfollowOnlyNonFollowers={autoUnfollowOnlyNonFollowers}
          lastRunAt={lastAutomationRun}
          saving={savingAutomation}
          onEnabledChange={setAutomationEnabled}
          onFrequencyChange={setAutomationFrequency}
          onDayOfWeekChange={setAutomationDayOfWeek}
          onTimeChange={(h, m) => {
            setAutomationHour(h);
            setAutomationMinute(m);
          }}
          onAutoFollowEnabledChange={setAutoFollowEnabled}
          onAutoFollowCountChange={setAutoFollowCount}
          onAutoUnfollowEnabledChange={setAutoUnfollowEnabled}
          onAutoUnfollowDaysChange={setAutoUnfollowDays}
          onAutoUnfollowOnlyNonFollowersChange={setAutoUnfollowOnlyNonFollowers}
          onSave={handleSaveAutomation}
        />

        {/* Hide Button Section */}
        <div className="pt-6 border-t border-border">
          <Button variant="outline" size="sm" className="w-full" onClick={hideButton}>
            <EyeOffIcon className="size-4" />
            Hide button for this session
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            The button will reappear when you refresh the page.
          </p>
        </div>

        <FeedbackSection />
      </div>
    </ScrollArea>
  );
}

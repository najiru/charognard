import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { ScheduleFrequency, DayOfWeek } from '@/lib/storage';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface AutomationSectionProps {
  container: HTMLElement;
  enabled: boolean;
  frequency: ScheduleFrequency;
  dayOfWeek: DayOfWeek;
  hour: number;
  minute: number;
  autoFollowEnabled: boolean;
  autoFollowCount: number;
  autoUnfollowEnabled: boolean;
  autoUnfollowDays: number;
  autoUnfollowOnlyNonFollowers: boolean;
  lastRunAt?: number;
  saving: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onFrequencyChange: (frequency: ScheduleFrequency) => void;
  onDayOfWeekChange: (day: DayOfWeek) => void;
  onTimeChange: (hour: number, minute: number) => void;
  onAutoFollowEnabledChange: (enabled: boolean) => void;
  onAutoFollowCountChange: (count: number) => void;
  onAutoUnfollowEnabledChange: (enabled: boolean) => void;
  onAutoUnfollowDaysChange: (days: number) => void;
  onAutoUnfollowOnlyNonFollowersChange: (value: boolean) => void;
  onSave: () => void;
}

export function AutomationSection({
  container,
  enabled,
  frequency,
  dayOfWeek,
  hour,
  minute,
  autoFollowEnabled,
  autoFollowCount,
  autoUnfollowEnabled,
  autoUnfollowDays,
  autoUnfollowOnlyNonFollowers,
  lastRunAt,
  saving,
  onEnabledChange,
  onFrequencyChange,
  onDayOfWeekChange,
  onTimeChange,
  onAutoFollowEnabledChange,
  onAutoFollowCountChange,
  onAutoUnfollowEnabledChange,
  onAutoUnfollowDaysChange,
  onAutoUnfollowOnlyNonFollowersChange,
  onSave,
}: AutomationSectionProps) {
  const formatLastRun = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  return (
    <div className="pt-6 border-t border-border">
      <h3 className="font-heading font-semibold text-base mb-4">Automation</h3>

      {/* Enable Automation */}
      <label className="flex items-center gap-3 mb-4 cursor-pointer">
        <Checkbox checked={enabled} onCheckedChange={(checked) => onEnabledChange(checked === true)} />
        <span className="text-sm font-medium">Enable scheduled automation</span>
      </label>

      {enabled && (
        <div className="space-y-4 pl-6">
          {/* Schedule */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Schedule</label>
            <div className="flex gap-2">
              <Select
                value={frequency}
                onValueChange={(value) => onFrequencyChange(value as ScheduleFrequency)}
              >
                <SelectTrigger size="sm" className="flex-1 min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup container={container}>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                </SelectPopup>
              </Select>
              {frequency === 'Weekly' && (
                <Select
                  value={String(dayOfWeek)}
                  onValueChange={(value) => onDayOfWeekChange(Number(value) as DayOfWeek)}
                >
                  <SelectTrigger size="sm" className="flex-1 min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup container={container}>
                    {DAY_NAMES.map((day, i) => (
                      <SelectItem key={day} value={String(i)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              )}
            </div>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Time</label>
            <Select
              value={timeValue}
              onValueChange={(value) => {
                if (!value) return;
                const [h, m] = value.split(':').map(Number);
                onTimeChange(h, m);
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup container={container}>
                {Array.from({ length: 24 }, (_, h) =>
                  [0, 15, 30, 45].map((m) => {
                    const value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    return (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    );
                  })
                ).flat()}
              </SelectPopup>
            </Select>
          </div>

          {/* Auto-Follow */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={autoFollowEnabled}
                onCheckedChange={(checked) => onAutoFollowEnabledChange(checked === true)}
              />
              <span className="text-sm">Auto-follow suggestions</span>
            </label>
            {autoFollowEnabled && (
              <div className="pl-6">
                <label className="text-xs text-muted-foreground">Max follows per run</label>
                <Input
                  type="number"
                  min={1}
                  max={150}
                  value={autoFollowCount}
                  onChange={(e) => onAutoFollowCountChange(Number(e.target.value))}
                  size="sm"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Auto-Unfollow */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={autoUnfollowEnabled}
                onCheckedChange={(checked) => onAutoUnfollowEnabledChange(checked === true)}
              />
              <span className="text-sm">Auto-unfollow profiles</span>
            </label>
            {autoUnfollowEnabled && (
              <div className="pl-6 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Days to wait before unfollowing</label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={autoUnfollowDays}
                    onChange={(e) => onAutoUnfollowDaysChange(Number(e.target.value))}
                    size="sm"
                    className="mt-1"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={autoUnfollowOnlyNonFollowers}
                    onCheckedChange={(checked) => onAutoUnfollowOnlyNonFollowersChange(checked === true)}
                  />
                  <span className="text-xs text-muted-foreground">Only unfollow if not followed back</span>
                </label>
              </div>
            )}
          </div>

          {/* Last Run */}
          <p className="text-xs text-muted-foreground">Last run: {formatLastRun(lastRunAt)}</p>
        </div>
      )}

      {/* Save Automation Button */}
      <Button onClick={onSave} disabled={saving} size="sm" className="w-full mt-4">
        {saving ? <Spinner className="size-4" /> : 'Save Automation Settings'}
      </Button>

      {/* Info */}
      <p className="text-xs text-muted-foreground mt-3">
        Note: Automation requires the browser to be open. The extension will open Instagram
        automatically if needed.
      </p>
    </div>
  );
}

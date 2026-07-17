import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { Sprout, Trophy, Star, Clapperboard, Bell, Shield, HelpCircle, ChevronRight, LogOut, X, Mail, ClipboardCheck, CircleHelp, ImageUp, RotateCcw } from 'lucide-react';
import type { AuthUser } from '../types';
import { ACHIEVEMENT_BADGES, USER_AVATAR } from '../constants';

const PROVIDER_LABEL: Record<AuthUser['provider'], string> = {
  google: 'Google',
  apple: 'Apple',
  x: 'X',
  link: 'Magic Link',
  email: 'Email',
};

const PROFILE_SETTINGS_KEY = 'rooted_profile_settings';
const AVATAR_SIZE = 320;

type SettingsPanel = 'avatar' | 'notifications' | 'privacy' | 'support' | null;

type ProfileSettings = {
  plantReminders: boolean;
  streakAlerts: boolean;
  weeklyDigest: boolean;
  hideEmail: boolean;
  confirmSignOut: boolean;
};

const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
  plantReminders: false,
  streakAlerts: true,
  weeklyDigest: false,
  hideEmail: false,
  confirmSignOut: false,
};

function readProfileSettings(): ProfileSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_PROFILE_SETTINGS;

  try {
    const parsed = JSON.parse(localStorage.getItem(PROFILE_SETTINGS_KEY) ?? '{}');
    return { ...DEFAULT_PROFILE_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_PROFILE_SETTINGS;
  }
}

function notificationPermissionLabel() {
  if (typeof Notification === 'undefined') return 'Unsupported';
  if (Notification.permission === 'granted') return 'Allowed';
  if (Notification.permission === 'denied') return 'Blocked';
  return 'Ask on first reminder';
}

function avatarDataUrlFromFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Could not load that image.'));
      image.onload = () => {
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        const sx = Math.max(0, (image.naturalWidth - side) / 2);
        const sy = Math.max(0, (image.naturalHeight - side) / 2);
        const canvas = document.createElement('canvas');
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) {
          reject(new Error('Could not process that image.'));
          return;
        }

        context.drawImage(image, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function SettingToggle({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: () => void | Promise<void>;
}) {
  return (
    <button
      onClick={onChange}
      aria-pressed={checked}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-botanical-outline/10 bg-botanical-surface px-4 py-3 text-left active:scale-[0.99] transition-all"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-botanical-on-surface">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-botanical-on-surface-variant">{detail}</span>
      </span>
      <span className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${checked ? 'bg-botanical-primary' : 'bg-botanical-surface-high'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </span>
    </button>
  );
}

export function ProfileView({
  user,
  onLogout,
  onOpenGuide,
  onUpdateUser,
}: {
  user: AuthUser | null;
  onLogout: () => void;
  onOpenGuide: () => void;
  onUpdateUser: (user: AuthUser) => void;
}) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<ProfileSettings>(readProfileSettings);
  const [activePanel, setActivePanel] = useState<SettingsPanel>(null);
  const [notice, setNotice] = useState('');
  const [notificationStatus, setNotificationStatus] = useState(notificationPermissionLabel);
  const sheetDragControls = useDragControls();
  const earnedBadges = ACHIEVEMENT_BADGES.filter(badge => badge.earned).length;
  const stats = [
    { label: 'Plants', value: '7', icon: <Sprout className="w-5 h-5" /> },
    { label: 'Badges', value: String(earnedBadges), icon: <Trophy className="w-5 h-5" /> },
    { label: 'Streak', value: '30', icon: <Star className="w-5 h-5" /> },
  ];

  useEffect(() => {
    localStorage.setItem(PROFILE_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) => {
    setSettings(current => ({ ...current, [key]: value }));
  };

  const toggleNotificationSetting = async (key: 'plantReminders' | 'streakAlerts' | 'weeklyDigest') => {
    const next = !settings[key];
    setNotice('');

    if (next && typeof Notification === 'undefined') {
      setNotice('Notifications are not supported in this browser.');
      return;
    }

    if (next && Notification.permission === 'denied') {
      setNotice('Notifications are blocked in this browser.');
      return;
    }

    if (next && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationStatus(notificationPermissionLabel());
      if (permission === 'denied') {
        setNotice('Notifications are blocked in this browser.');
        return;
      }
    }

    updateSetting(key, next);
    setNotificationStatus(notificationPermissionLabel());
  };

  const copyDiagnostics = async () => {
    const payload = {
      app: 'Rooted',
      user: user ? { id: user.id, provider: user.provider, hasEmail: Boolean(user.email) } : null,
      settings,
      notificationStatus,
      generatedAt: new Date().toISOString(),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setNotice('Diagnostics copied.');
    } catch {
      setNotice('Clipboard access is unavailable in this browser.');
    }
  };

  const openEmailSupport = () => {
    const subject = encodeURIComponent('Rooted support');
    const body = encodeURIComponent(`Hi Rooted support,\n\nI need help with:\n\n\nUser: ${user?.id ?? 'guest'}\nProvider: ${user?.provider ?? 'none'}`);
    window.location.href = `mailto:support@rooted.app?subject=${subject}&body=${body}`;
  };

  const updateAvatar = (avatar: string) => {
    if (!user) {
      setNotice('Sign in before changing your avatar.');
      return;
    }

    onUpdateUser({ ...user, avatar });
    setNotice('Avatar updated.');
    setActivePanel(null);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setNotice('');
    try {
      updateAvatar(await avatarDataUrlFromFile(file));
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not update avatar.');
      setActivePanel('avatar');
    }
  };

  const handleLogoutClick = () => {
    if (settings.confirmSignOut && !window.confirm('Sign out of Rooted?')) return;
    onLogout();
  };

  const settingsRows: { icon: ReactNode; label: string; onClick: () => void }[] = [
    { icon: <Clapperboard className="w-5 h-5" />, label: 'Growing Guide', onClick: onOpenGuide },
    { icon: <Bell className="w-5 h-5" />, label: 'Notifications', onClick: () => { setNotice(''); setActivePanel('notifications'); } },
    { icon: <Shield className="w-5 h-5" />, label: 'Privacy', onClick: () => { setNotice(''); setActivePanel('privacy'); } },
    { icon: <HelpCircle className="w-5 h-5" />, label: 'Help & Support', onClick: () => { setNotice(''); setActivePanel('support'); } },
  ];

  return (
    <div className="relative z-10 p-6 pt-20 pb-36 max-w-md mx-auto">
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

      {/* ── White sticky header ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.10),0_2px_2px_rgba(0,0,0,0.06),0_0_2px_rgba(0,0,0,0.07)] px-6 py-4">
        <span className="text-xl font-bold text-botanical-primary tracking-tight">Profile</span>
      </header>

      {/* ── Avatar & identity ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 mt-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => { setNotice(''); setActivePanel('avatar'); }}
            className="block w-24 h-24 rounded-full border-2 border-botanical-secondary/25 overflow-hidden shadow-[0_0_0.5px_rgba(0,0,0,0.14),0_4px_8px_rgba(0,0,0,0.12)] active:scale-[0.98] transition-transform"
            title="Change avatar"
          >
            <img src={user?.avatar ?? USER_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
          </button>
          <button
            type="button"
            onClick={() => { setNotice(''); setActivePanel('avatar'); }}
            className="absolute -right-1 bottom-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-botanical-primary text-white shadow-lg active:scale-95 transition-transform"
            title="Change avatar"
          >
            <CircleHelp className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center">
          <h2 className="font-bold text-2xl text-botanical-primary tracking-tight">{user?.name ?? 'Botanist'}</h2>
          {user?.email && (
            <p className="text-botanical-on-surface-variant text-sm mt-0.5">
              {settings.hideEmail ? 'Email hidden' : user.email}
            </p>
          )}
          {user?.provider && (
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-botanical-light-green text-botanical-primary text-[11px] font-semibold uppercase tracking-widest">
              via {PROVIDER_LABEL[user.provider]}
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Stats row — three white cards ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3 mt-8">
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="glass-card rounded-xl p-4 flex flex-col items-center gap-1.5">
            <div className="text-botanical-secondary">{icon}</div>
            <span className="font-bold text-2xl text-botanical-primary">{value}</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-botanical-on-surface-variant">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Settings rows ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-botanical-on-surface-variant ml-1 mb-3">Settings</p>
        {settingsRows.map(({ icon, label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="w-full glass-card rounded-xl px-5 py-4 flex items-center justify-between hover:shadow-[0_0_0.5px_rgba(0,0,0,0.14),0_4px_8px_rgba(0,0,0,0.08)] active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-4 text-botanical-on-surface">
              <span className="text-botanical-secondary">{icon}</span>
              <span className="font-semibold text-sm">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-botanical-outline" />
          </button>
        ))}
      </motion.div>

      {/* ── Sign out — outlined red pill ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 active:scale-[0.98] transition-all text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </motion.div>

      <AnimatePresence>
        {activePanel && (
          <motion.div
            className="fixed inset-0 z-[80] bg-black/35 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePanel(null)}
          >
            <motion.div
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 28, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              drag="y"
              dragControls={sheetDragControls}
              dragListener
              dragConstraints={{ top: 0, bottom: 360 }}
              dragDirectionLock
              dragElastic={0.04}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                if (info.offset.y > 70 || info.velocity.y > 450) setActivePanel(null);
              }}
              onClick={(event) => event.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[88vh] max-w-md flex-col rounded-t-[28px] bg-white shadow-2xl"
            >
              <button
                type="button"
                onPointerDown={(event) => sheetDragControls.start(event)}
                className="mx-auto mt-3 flex h-7 w-full max-w-[140px] touch-none cursor-grab items-center justify-center active:cursor-grabbing"
                aria-label="Drag settings down to close"
              >
                <span className="h-1.5 w-12 rounded-full bg-botanical-outline/30" />
              </button>
              <div
                onPointerDown={(event) => sheetDragControls.start(event)}
                className="flex cursor-grab touch-none items-center justify-between gap-4 px-5 pb-4 active:cursor-grabbing"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-botanical-secondary">Settings</p>
                  <h3 className="mt-1 text-xl font-bold text-botanical-primary">
                    {activePanel === 'avatar' ? 'Avatar' : activePanel === 'notifications' ? 'Notifications' : activePanel === 'privacy' ? 'Privacy' : 'Help & Support'}
                  </h3>
                </div>
                <button
                  onClick={() => setActivePanel(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-botanical-surface text-botanical-outline"
                  title="Close settings"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">

              {activePanel === 'avatar' && (
                <div className="space-y-3">
                  <div className="flex flex-col items-center gap-3 rounded-xl bg-botanical-surface px-4 py-4">
                    <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-botanical-secondary/25">
                      <img src={user?.avatar ?? USER_AVATAR} alt="Current avatar" className="h-full w-full object-cover" />
                    </div>
                    <p className="text-center text-xs leading-relaxed text-botanical-on-surface-variant">
                      Upload a square-ish photo. Rooted will crop and resize it for your profile.
                    </p>
                  </div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-botanical-outline/10 bg-botanical-surface px-4 py-3 text-left active:scale-[0.99] transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <ImageUp className="h-5 w-5 text-botanical-secondary" />
                      <span className="text-sm font-semibold text-botanical-on-surface">Upload photo</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-botanical-outline" />
                  </button>
                  <button
                    onClick={() => updateAvatar(USER_AVATAR)}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-botanical-outline/10 bg-botanical-surface px-4 py-3 text-left active:scale-[0.99] transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <RotateCcw className="h-5 w-5 text-botanical-secondary" />
                      <span className="text-sm font-semibold text-botanical-on-surface">Use default avatar</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-botanical-outline" />
                  </button>
                </div>
              )}

              {activePanel === 'notifications' && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-botanical-light-green/45 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-botanical-secondary">Browser permission</p>
                    <p className="mt-1 text-sm font-semibold text-botanical-primary">{notificationStatus}</p>
                  </div>
                  <SettingToggle
                    label="Plant care reminders"
                    detail="Enable browser reminders for watering and care checks."
                    checked={settings.plantReminders}
                    onChange={() => toggleNotificationSetting('plantReminders')}
                  />
                  <SettingToggle
                    label="Streak alerts"
                    detail="Keep the 30-day care rhythm visible."
                    checked={settings.streakAlerts}
                    onChange={() => toggleNotificationSetting('streakAlerts')}
                  />
                  <SettingToggle
                    label="Weekly digest"
                    detail="Summarize plant progress and missed tasks."
                    checked={settings.weeklyDigest}
                    onChange={() => toggleNotificationSetting('weeklyDigest')}
                  />
                </div>
              )}

              {activePanel === 'privacy' && (
                <div className="space-y-3">
                  <SettingToggle
                    label="Hide email on profile"
                    detail="Show a private placeholder instead of your email address."
                    checked={settings.hideEmail}
                    onChange={() => updateSetting('hideEmail', !settings.hideEmail)}
                  />
                  <SettingToggle
                    label="Confirm before sign out"
                    detail="Ask before leaving the current Rooted session."
                    checked={settings.confirmSignOut}
                    onChange={() => updateSetting('confirmSignOut', !settings.confirmSignOut)}
                  />
                  <div className="rounded-xl bg-botanical-surface px-4 py-3">
                    <p className="text-sm font-semibold text-botanical-on-surface">Local scan storage</p>
                    <p className="mt-1 text-xs leading-relaxed text-botanical-on-surface-variant">Scans and plant guides are stored in this project workspace.</p>
                  </div>
                </div>
              )}

              {activePanel === 'support' && (
                <div className="space-y-3">
                  <button
                    onClick={() => { setActivePanel(null); onOpenGuide(); }}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-botanical-outline/10 bg-botanical-surface px-4 py-3 text-left active:scale-[0.99] transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <Clapperboard className="h-5 w-5 text-botanical-secondary" />
                      <span className="text-sm font-semibold text-botanical-on-surface">Open growing guide</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-botanical-outline" />
                  </button>
                  <button
                    onClick={copyDiagnostics}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-botanical-outline/10 bg-botanical-surface px-4 py-3 text-left active:scale-[0.99] transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <ClipboardCheck className="h-5 w-5 text-botanical-secondary" />
                      <span className="text-sm font-semibold text-botanical-on-surface">Copy diagnostics</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-botanical-outline" />
                  </button>
                  <button
                    onClick={openEmailSupport}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-botanical-outline/10 bg-botanical-surface px-4 py-3 text-left active:scale-[0.99] transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-botanical-secondary" />
                      <span className="text-sm font-semibold text-botanical-on-surface">Email support</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-botanical-outline" />
                  </button>
                </div>
              )}

              {notice && (
                <p className="mt-4 rounded-xl bg-botanical-light-green/45 px-4 py-3 text-xs font-semibold text-botanical-primary">{notice}</p>
              )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

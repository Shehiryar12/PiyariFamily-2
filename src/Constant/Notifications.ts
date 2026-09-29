export type AppNotification = {
  id: string;
  icon: string;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
  actionLabel?: string;
};

export const APP_NOTIFICATIONS: AppNotification[] = [
  {
    id: '1',
    icon: 'heart-outline',
    title: 'New Match Found',
    description: 'A profile matching your preferences is available.',
    time: '2m',
    unread: true,
  },
  {
    id: '2',
    icon: 'send-outline',
    title: 'Interest Received',
    description: 'Someone has sent interest in your profile.',
    time: '18m',
    unread: true,
  },
  {
    id: '3',
    icon: 'check-circle-outline',
    title: 'Interest Accepted',
    description: 'Your interest request has been accepted.',
    time: '1h',
    unread: true,
  },
  {
    id: '4',
    icon: 'eye-outline',
    title: 'Profile Viewed',
    description: 'A family has viewed your profile.',
    time: '5h',
  },
  {
    id: '5',
    icon: 'gift-outline',
    title: 'Package Reminder',
    description: 'Upgrade your package to view more profile details.',
    time: 'Yesterday',
    actionLabel: 'Upgrade Now',
  },
  {
    id: '6',
    icon: 'clock-outline',
    title: 'Package Expiring',
    description: 'Your package is ending soon. Renew to continue.',
    time: '2d',
  },
  {
    id: '7',
    icon: 'account-outline',
    title: 'Complete Profile',
    description: 'Complete your profile to get better match suggestions.',
    time: '3d',
  },
];

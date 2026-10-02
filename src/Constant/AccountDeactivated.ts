import { Strings } from './Strings';

export const ACCOUNT_DEACTIVATED_INFO_ITEMS = [
  {
    icon: 'lock-outline' as const,
    text: Strings.inactiveCannotUseApp,
  },
  {
    icon: 'email-outline' as const,
    text: Strings.inactiveSendAdminRequest,
  },
  {
    icon: 'check-circle-outline' as const,
    text: Strings.inactiveWaitForApproval,
  },
];

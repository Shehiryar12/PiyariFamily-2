export type HelpCategory = 'all' | 'account' | 'photos' | 'matches' | 'privacy' | 'plans';

export type HelpArticle = {
  id: string;
  category: Exclude<HelpCategory, 'all'>;
  question: string;
  answer: string;
};

export const HELP_CATEGORIES: Array<{ id: HelpCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'account', label: 'Account' },
  { id: 'photos', label: 'Photos' },
  { id: 'matches', label: 'Matches' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'plans', label: 'Plans' },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'hide-photos',
    category: 'photos',
    question: 'How do I hide my profile photo?',
    answer:
      'Go to Settings and turn on Hide Profile Picture or Hide Additional Photos. Other members will see a locked photo until you approve their request.',
  },
  {
    id: 'photo-request',
    category: 'photos',
    question: 'How do photo access requests work?',
    answer:
      'When your photos are hidden, another member can send a request. You will see it under View Profile Request. Accept to show photos only to that person, or reject to keep them hidden.',
  },
  {
    id: 'revoke-photo',
    category: 'privacy',
    question: 'How do I block someone who can already see my photos?',
    answer:
      'Open Settings → Approved Photo Access. Choose the person and tap Block. Their access is revoked immediately and they will need a new request.',
  },
  {
    id: 'verify-profile',
    category: 'account',
    question: 'How do I verify my profile?',
    answer:
      'Go to Settings → Verify Your Profile and confirm your phone number with the OTP we send. A verified badge helps other members trust your profile.',
  },
  {
    id: 'edit-profile',
    category: 'account',
    question: 'How do I update my profile details?',
    answer:
      'Open Settings → Edit Profile to change your photo, personal details, education, career, and about me. Save changes before leaving the screen.',
  },
  {
    id: 'change-password',
    category: 'account',
    question: 'How do I change my password?',
    answer:
      'Go to Settings → Change Password. Enter your current password and a strong new one. For your security, other devices may be signed out.',
  },
  {
    id: 'like-profile',
    category: 'matches',
    question: 'How do likes and shortlists work?',
    answer:
      'Tap the heart on a profile to shortlist them. You can review people you liked, and people who liked you, from the Shortlisted tab.',
  },
  {
    id: 'search-matches',
    category: 'matches',
    question: 'How do I find better matches?',
    answer:
      'Use Search to look by name, city, or profession. Open Filters to refine age, location, and other preferences, then review suggested matches.',
  },
  {
    id: 'subscription',
    category: 'plans',
    question: 'What is included in VIP and VVIP?',
    answer:
      'Open Choose Your Plan from Settings to compare features. Premium plans unlock extra visibility and matching benefits. Manage or change your plan anytime from My Plan.',
  },
  {
    id: 'referral',
    category: 'plans',
    question: 'How does Refer & Earn work?',
    answer:
      'Share your referral link from Settings. When someone joins with your link, you earn reward points that can be redeemed according to the referral program rules.',
  },
  {
    id: 'deactivate',
    category: 'account',
    question: 'How do I deactivate or delete my account?',
    answer:
      'Go to Settings → Deactivate / Delete Account. Deactivating pauses access until an admin reviews a reactivation request. Deleting permanently removes your data.',
  },
  {
    id: 'privacy-photos',
    category: 'privacy',
    question: 'Who can see my hidden photos?',
    answer:
      'Only members you approve. Hidden photos stay locked for everyone else, including people who send a request that you have not accepted yet.',
  },
];

export const SUPPORT_EMAIL = 'support@piyarifamily.com';

export const SUPPORT_TOPICS = [
  'Photo privacy',
  'Profile & verification',
  'Matches & shortlist',
  'Subscription & billing',
  'Account access',
  'Other',
];

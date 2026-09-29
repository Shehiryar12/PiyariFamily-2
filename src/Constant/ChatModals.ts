export type ReportReason = {
  id: string;
  title: string;
  description: string;
};

export const REPORT_REASONS: ReportReason[] = [
  {
    id: 'inappropriate',
    title: 'Inappropriate Messages',
    description: 'Sending offensive or vulgar content',
  },
  {
    id: 'fake',
    title: 'Fake Profile',
    description: 'Profile photos or details seem misleading',
  },
  {
    id: 'harassment',
    title: 'Harassment',
    description: 'Repeated unwanted contact or pressure',
  },
  {
    id: 'spam',
    title: 'Spam/Junk',
    description: 'Promotional or irrelevant messages',
  },
  {
    id: 'other',
    title: 'Other',
    description: 'Something else not listed above',
  },
];

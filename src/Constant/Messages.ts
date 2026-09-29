import { ImageSourcePropType } from 'react-native';
import { Images } from '../Assets';

export type ActiveUser = {
  id: string;
  name: string;
  image: ImageSourcePropType;
};

export type Conversation = {
  id: string;
  name: string;
  image: ImageSourcePropType;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  isVerified: boolean;
  isOnline: boolean;
};

export type ChatRequest = {
  id: string;
  name: string;
  age: number;
  location: string;
  image: ImageSourcePropType;
  education: string;
  profession: string;
  timeAgo: string;
  message: string;
  isVerified: boolean;
};

export type ChatMessage = {
  id: string;
  text: string;
  time: string;
  isMine: boolean;
  showAvatar?: boolean;
};

export const ACTIVE_USERS: ActiveUser[] = [
  { id: '1', name: 'Sundas', image: Images.femaleProfile },
  { id: '2', name: 'Fatima', image: Images.femaleProfile2 },
  { id: '3', name: 'Ayesha', image: Images.femaleProfile },
  { id: '4', name: 'Hira', image: Images.femaleProfile2 },
  { id: '5', name: 'Zara', image: Images.femaleProfile },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'Sundas Khan',
    image: Images.femaleProfile,
    lastMessage: 'You: Hey! Would love to know more about you',
    time: '2m',
    unreadCount: 2,
    isVerified: true,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Fatima Ali',
    image: Images.femaleProfile2,
    lastMessage: 'That sounds wonderful! When are you free?',
    time: '15m',
    unreadCount: 1,
    isVerified: true,
    isOnline: true,
  },
  {
    id: '3',
    name: 'Ayesha Khan',
    image: Images.femaleProfile,
    lastMessage: 'Walaikum assalam! Thank you so much 😊',
    time: '1h',
    isVerified: true,
    isOnline: true,
  },
  {
    id: '4',
    name: 'Hira Malik',
    image: Images.femaleProfile2,
    lastMessage: 'You: Assalamualaikum, hope you are doing well',
    time: 'Yesterday',
    isVerified: true,
    isOnline: false,
  },
  {
    id: '5',
    name: 'Zara Ahmed',
    image: Images.femaleProfile,
    lastMessage: 'Looking forward to meeting your family',
    time: 'Yesterday',
    isVerified: false,
    isOnline: false,
  },
  {
    id: '6',
    name: 'Rohan Ali',
    image: Images.maleProfile,
    lastMessage: 'You: Thanks for connecting!',
    time: 'Mon',
    isVerified: true,
    isOnline: false,
  },
];

export const CHAT_REQUESTS: ChatRequest[] = [
  {
    id: '1',
    name: 'M.Zeshan',
    age: 29,
    location: 'Lahore',
    image: Images.maleProfile,
    education: 'MBA',
    profession: 'IT Manager',
    timeAgo: '2h ago',
    message:
      'Hi! I came across your profile and would love to connect. I think we share similar values and interests.',
    isVerified: true,
  },
  {
    id: '2',
    name: 'Ahmed Raza',
    age: 31,
    location: 'Karachi',
    image: Images.maleProfile,
    education: 'BBA',
    profession: 'Banker',
    timeAgo: '5h ago',
    message:
      'Assalamualaikum! Your profile caught my attention. Would you be open to a conversation?',
    isVerified: true,
  },
  {
    id: '3',
    name: 'Usman Khan',
    age: 27,
    location: 'Islamabad',
    image: Images.maleProfile,
    education: 'BS CS',
    profession: 'Engineer',
    timeAgo: '1d ago',
    message:
      'Hello! I noticed we have a lot in common. I would love to get to know you better.',
    isVerified: true,
  },
];

export const AYESHA_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    text: 'Assalamualaikum! I really liked your profile and wanted to reach out.',
    time: '10:02 AM',
    isMine: false,
    showAvatar: true,
  },
  {
    id: '2',
    text: 'Your interests in reading and traveling really resonated with me.',
    time: '10:03 AM',
    isMine: false,
  },
  {
    id: '3',
    text: 'Walaikum assalam! Thank you so much 😊',
    time: '10:15 AM',
    isMine: true,
  },
  {
    id: '4',
    text: 'I enjoyed reading your profile too. Would love to chat more!',
    time: '10:16 AM',
    isMine: true,
  },
  {
    id: '5',
    text: 'That would be lovely! Are you free this weekend for a call?',
    time: '10:20 AM',
    isMine: false,
    showAvatar: true,
  },
];

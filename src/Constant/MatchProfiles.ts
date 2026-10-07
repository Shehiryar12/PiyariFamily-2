import { ImageSourcePropType } from 'react-native';
import { Images } from '../Assets';

export type QuickInfo = {
  icon?: string;
  iconSource?: ImageSourcePropType;
  title: string;
  subtitle: string;
};

export type BasicDetail = {
  icon?: string;
  iconSource?: ImageSourcePropType;
  label: string;
  value: string;
};

export type ProfileDetail = {
  id: string;
  fullName: string;
  age: number;
  location: string;
  image: ImageSourcePropType;
  tier: 'VIP' | 'VVIP';
  isVerified: boolean;
  about: string;
  quickInfo: QuickInfo[];
  basicDetails: BasicDetail[];
  languages: string[];
  interests: string[];
  photosNeedAccess?: boolean;
  pictureHidden?: boolean;
  additionalPhotosHidden?: boolean;
  isLiked?: boolean;
};

export const PROFILE_DETAILS: Record<string, ProfileDetail> = {
  '1': {
    id: '1',
    fullName: 'Ayesha Khan',
    age: 26,
    location: 'Lahore',
    image: Images.femaleProfile,
    tier: 'VIP',
    isVerified: true,
    about:
      'I am a family-oriented person who values honesty, kindness, and meaningful connections. I enjoy reading, traveling, and spending quality time with loved ones. Looking for a life partner who shares similar values and dreams of building a beautiful future together.',
    quickInfo: [
      { icon: 'school-outline', title: 'MBA', subtitle: 'Education' },
      {
        icon: 'briefcase-outline',
        title: 'Software Engineer',
        subtitle: 'Profession',
      },
      {
        iconSource: Images.religionIcon,
        title: 'Muslim',
        subtitle: 'Religion',
      },
      { icon: 'home-outline', title: 'Owned', subtitle: 'Residential Status' },
    ],
    basicDetails: [
      { icon: 'account-outline', label: 'Age', value: '26 years' },
      { icon: 'map-marker-outline', label: 'City', value: 'Lahore' },
      { icon: 'human-male-height', label: 'Height', value: '5 ft 4 inches' },
      {
        icon: 'heart-outline',
        label: 'Marital Status',
        value: 'Single',
      },
      {
        iconSource: Images.religionIcon,
        label: 'Religion',
        value: 'Muslim',
      },
      { icon: 'account-group-outline', label: 'Community', value: 'Rajput' },
      { icon: 'earth', label: 'Mother Tongue', value: 'Urdu' },
    ],
    languages: ['Urdu', 'English', 'Punjabi'],
    interests: ['Travel', 'Cooking', 'Reading', 'Yoga'],
  },
  '2': {
    id: '2',
    fullName: 'Rohan Ali',
    age: 29,
    location: 'Karachi',
    image: Images.maleProfile,
    tier: 'VVIP',
    isVerified: true,
    about:
      'Software engineer with a passion for technology and travel. I believe in balancing career ambitions with family values. Seeking a partner who is kind, ambitious, and ready to build a meaningful life together.',
    quickInfo: [
      { icon: 'school-outline', title: 'BS CS', subtitle: 'Education' },
      {
        icon: 'briefcase-outline',
        title: 'Software Engineer',
        subtitle: 'Profession',
      },
      {
        iconSource: Images.religionIcon,
        title: 'Muslim',
        subtitle: 'Religion',
      },
      { icon: 'home-outline', title: 'Rented', subtitle: 'Residential Status' },
    ],
    basicDetails: [
      { icon: 'account-outline', label: 'Age', value: '29 years' },
      { icon: 'map-marker-outline', label: 'City', value: 'Karachi' },
      { icon: 'human-male-height', label: 'Height', value: '5 ft 10 inches' },
      {
        icon: 'heart-outline',
        label: 'Marital Status',
        value: 'Single',
      },
      {
        iconSource: Images.religionIcon,
        label: 'Religion',
        value: 'Muslim',
      },
      { icon: 'account-group-outline', label: 'Community', value: 'Syed' },
      { icon: 'earth', label: 'Mother Tongue', value: 'Urdu' },
    ],
    languages: ['Urdu', 'English'],
    interests: ['Cricket', 'Music', 'Fitness', 'Travel'],
  },
};

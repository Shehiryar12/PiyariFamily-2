import { Images } from '../Assets';
import type { ViewProfileRequest } from '../API/mappers/photoAccessMapper';

export const DUMMY_VIEW_PROFILE_REQUESTS: ViewProfileRequest[] = [
  {
    id: '1',
    profileId: '1',
    name: 'Ayesha Khan',
    age: 26,
    location: 'Lahore, Pakistan',
    image: Images.femaleProfile,
    photos: [Images.femaleProfile],
    requestedAt: '2h',
    status: 'pending',
    statusLabel: 'Pending',
    isVerified: true,
  },
  {
    id: '2',
    profileId: '2',
    name: 'Taha',
    age: 28,
    location: 'Karachi, Pakistan',
    image: Images.maleProfile,
    photos: [Images.maleProfile],
    requestedAt: '1d',
    status: 'accepted',
    statusLabel: 'Approved',
    isVerified: true,
  },
  {
    id: '3',
    profileId: '3',
    name: 'Sara Malik',
    age: 24,
    location: 'Islamabad, Pakistan',
    image: Images.femaleProfile2,
    photos: [Images.femaleProfile2],
    requestedAt: '3d',
    status: 'declined',
    statusLabel: 'Rejected',
    isVerified: false,
  },
];

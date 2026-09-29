import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { ProfileStackParamList } from '../Navigation/ProfileStackNavigator';
import { getTabNavigation } from './tabNavigation';

type ProfileScreen = keyof ProfileStackParamList;

export const navigateToProfileScreen = <T extends ProfileScreen>(
  navigation: NavigationProp<ParamListBase>,
  screen: T,
  params?: ProfileStackParamList[T],
) => {
  const tabNavigation = getTabNavigation(navigation);

  if (tabNavigation) {
    tabNavigation.navigate('Profile', { screen, params });
    return;
  }

  navigation.getParent()?.navigate('Profile', { screen, params });
};

export const navigateToPhotoGallery = (
  navigation: NavigationProp<ParamListBase>,
  params: ProfileStackParamList['ViewProfileGallery'],
) => {
  navigateToProfileScreen(navigation, 'ViewProfileGallery', params);
};

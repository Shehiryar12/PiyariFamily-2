import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const resetRootTo = (name: string) => {
  const apply = () => {
    if (!navigationRef.isReady()) {
      return false;
    }

    navigationRef.resetRoot({
      index: 0,
      routes: [{ name }],
    });
    return true;
  };

  if (!apply()) {
    requestAnimationFrame(() => {
      apply();
    });
  }
};

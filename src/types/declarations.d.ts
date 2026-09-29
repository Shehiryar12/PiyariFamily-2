declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { Component } from 'react';
  import { IconProps } from 'react-native-vector-icons/Icon';

  export default class MaterialCommunityIcons extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/FontAwesome5' {
  import { Component } from 'react';
  import { IconProps } from 'react-native-vector-icons/Icon';

  export default class FontAwesome5 extends Component<IconProps> {}
}

declare module 'react-native-simple-toast' {
  const Toast: {
    show: (message: string, duration?: number) => void;
    SHORT: number;
    LONG: number;
  };

  export default Toast;
}

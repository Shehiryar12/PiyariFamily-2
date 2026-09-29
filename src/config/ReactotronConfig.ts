import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

const reactotron = Reactotron.setAsyncStorageHandler(AsyncStorage)
  .configure({
    name: 'PiyariFamily',
  })
  .useReactNative({
    asyncStorage: false,
    networking: {
      ignoreUrls: /symbolicate|127\.0\.0\.1|localhost/,
    },
  })
  .use(reactotronRedux())
  .connect();

export default reactotron;

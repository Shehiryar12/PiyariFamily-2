import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import appReducer from './slices/appSlice';
import homeReducer from './slices/homeSlice';
import shortlistReducer from './slices/shortlistSlice';
import referralReducer from './slices/referralSlice';
import filterReducer from './slices/filterSlice';

const reactotronEnhancer =
  __DEV__ && require('../config/ReactotronConfig').default.createEnhancer
    ? require('../config/ReactotronConfig').default.createEnhancer()
    : undefined;

const persistConfig = {
  key: 'root',
  version: 2,
  storage: AsyncStorage,
  whitelist: ['auth', 'profile', 'app'],
  migrate: async (state: any) => {
    if (!state?.app) {
      return state;
    }

    return {
      ...state,
      app: {
        ...state.app,
        lastAccountName: null,
        lastAccountEmail: null,
      },
    };
  },
};

const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
  app: appReducer,
  home: homeReducer,
  shortlist: shortlistReducer,
  referral: referralReducer,
  filter: filterReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
  enhancers: getDefaultEnhancers =>
    reactotronEnhancer
      ? getDefaultEnhancers().concat(reactotronEnhancer)
      : getDefaultEnhancers(),
});

export const persistor = persistStore(store);

export const waitForPersistor = () =>
  new Promise<void>(resolve => {
    if (persistor.getState().bootstrapped) {
      resolve();
      return;
    }

    const unsubscribe = persistor.subscribe(() => {
      if (persistor.getState().bootstrapped) {
        unsubscribe();
        resolve();
      }
    });
  });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

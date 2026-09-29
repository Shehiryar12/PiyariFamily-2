import type { User } from './types';
import { store, setUser } from '../Redux';

export const userStorage = {
  getUser: () => store.getState().auth.user,
  setUser: (user: User | null) => {
    store.dispatch(setUser(user));
  },
  clear: () => {
    store.dispatch(setUser(null));
  },
};

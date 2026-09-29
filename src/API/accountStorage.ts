import { store, setAccountStatus } from '../Redux';

export type AccountStatus = 'active' | 'inactive';

export const accountStorage = {
  getStatus: () => store.getState().profile.accountStatus,
  setStatus: (status: AccountStatus | null) => {
    store.dispatch(setAccountStatus(status));
  },
  clear: () => {
    store.dispatch(setAccountStatus(null));
  },
};

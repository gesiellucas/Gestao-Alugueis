import { useAppContext } from '../contexts/AppContext';

/**
 * Returns true if the current user has access to financial data
 * (permission 'financeiro_view' or unrestricted '*').
 */
export const useFinanceAccess = (): boolean => {
  const { user } = useAppContext();
  if (!user?.role?.permissions) return false;
  return user.role.permissions.includes('*') || user.role.permissions.includes('financeiro_view');
};

/**
 * Local SQLite unavailable vehicles API
 */
import { ipcInvoke } from '../../../lib/ipc';
import { UnavailableVehicle } from '../../../types';

function requireUserId(): string {
  const userId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('electron_user_id')
    : null;
  if (!userId) throw new Error('Usuário não autenticado no contexto local.');
  return userId;
}

export const localUnavailableVehiclesApi = {
  async getAll(): Promise<UnavailableVehicle[]> {
    return ipcInvoke<UnavailableVehicle[]>('db:unavailableVehicles:getAll', { user_id: requireUserId() });
  },

  async getById(id: string): Promise<UnavailableVehicle | null> {
    return ipcInvoke<UnavailableVehicle | null>('db:unavailableVehicles:getById', { id, user_id: requireUserId() });
  },

  async getByVehicle(vehicle_id: string): Promise<UnavailableVehicle | null> {
    return ipcInvoke<UnavailableVehicle | null>('db:unavailableVehicles:getByVehicle', { vehicle_id, user_id: requireUserId() });
  },

  async create(data: { vehicle_id: string; status_type: 'STOLEN' | 'TOTAL_LOSS'; reason: string }): Promise<UnavailableVehicle> {
    return ipcInvoke<UnavailableVehicle>('db:unavailableVehicles:create', { ...data, user_id: requireUserId() });
  },

  async delete(id: string): Promise<void> {
    await ipcInvoke('db:unavailableVehicles:delete', { id, user_id: requireUserId() });
  },
};

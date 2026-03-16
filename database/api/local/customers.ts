/**
 * Local SQLite customer API — mirrors services/api/customers.ts
 * All operations go through the IPC bridge to the main process.
 */
import { ipcInvoke } from '../../../lib/ipc';
import { Customer } from '../../../types';
import type { InsertDto, UpdateDto } from '../../client/types';

// user_id is read from the current session via Supabase auth in Electron
function requireUserId(): string {
  console.log('requireUserId');
  const userId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('electron_user_id')
    : null;
  if (!userId) throw new Error('Usuário não autenticado no contexto local.');
  return userId;
}

function toBool(row: Customer & { active_contract: number | boolean }): Customer {
  return { ...row, active_contract: Boolean(row.active_contract) };
}

export const localCustomersApi = {
  async getAll(): Promise<Customer[]> {
    console.log('getAll customers');
    const user_id = requireUserId();
    console.log(user_id);
    try {
      const rows = await ipcInvoke<(Customer & { active_contract: number })[]>(
        'db:customers:getAll'
      );
      return rows.map(toBool);
    } catch (err) {
      throw err;
    }
  },

  async getById(id: string): Promise<Customer | null> {
    const row = await ipcInvoke<(Customer & { active_contract: number }) | null>(
      'db:customers:getById',
      { id, user_id: requireUserId() }
    );
    return row ? toBool(row) : null;
  },

  async create(customer: Omit<InsertDto<'customers'>, 'user_id' | 'id' | 'device_id' | 'version' | 'is_deleted' | 'sync_status' | 'created_at' | 'updated_at'> & { user_id?: string }): Promise<Customer> {
    const row = await ipcInvoke<Customer & { active_contract: number }>(
      'db:customers:create',
      { ...customer, user_id: requireUserId() }
    );
    return toBool(row);
  },

  async update(id: string, updates: Omit<UpdateDto<'customers'>, 'user_id' | 'id' | 'device_id' | 'version' | 'is_deleted' | 'sync_status' | 'created_at' | 'updated_at'> & { user_id?: string }): Promise<Customer> {
    const row = await ipcInvoke<Customer & { active_contract: number }>(
      'db:customers:update',
      { ...updates, id, user_id: requireUserId() }
    );
    return toBool(row);
  },

  async delete(id: string): Promise<void> {
    await ipcInvoke('db:customers:delete', { id, user_id: requireUserId() });
  },

  async getWithActiveContract(): Promise<Customer[]> {
    const all = await this.getAll();
    return all.filter((c) => c.active_contract);
  },

  async getWithDebt(): Promise<Customer[]> {
    const all = await this.getAll();
    return all.filter((c) => c.balance_due > 0).sort((a, b) => b.balance_due - a.balance_due);
  },

  async updateBalance(id: string, balance_due: number): Promise<Customer> {
    return this.update(id, {
      balance_due,
      last_payment_date: new Date().toISOString().split('T')[0],
    });
  },

  async getByCpf(cpf: string): Promise<Customer | null> {
    const all = await this.getAll();
    return all.find((c) => c.cpf === cpf) ?? null;
  },
};

/**
 * Local SQLite customer API — mirrors services/api/customers.ts
 * All operations go through the IPC bridge to the main process.
 */
import { ipcInvoke } from '../../../lib/ipc';
import { Customer, PaginatedResult } from '../../../types';
import type { InsertDto, UpdateDto } from '../../client/types';

// user_id is read from the current session via Supabase auth in Electron
function requireUserId(): string | null {
  console.log('requireUserId');
  const userId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('electron_user_id')
    : null;
  return userId;
}

function toBool(row: Customer & { active_contract: number | boolean }): Customer {
  return { ...row, active_contract: Boolean(row.active_contract) };
}

export const localCustomersApi = {
  async getAll(): Promise<Customer[]> {
    console.log('getAll customers');
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
      { id }
    );
    return row ? toBool(row) : null;
  },

  async create(customer: Omit<InsertDto<'customers'>, 'user_id' | 'id' | 'device_id' | 'version' | 'is_deleted' | 'sync_status' | 'created_at' | 'updated_at'> & { user_id?: string }): Promise<Customer> {
    const user_id = requireUserId() || '00000000-0000-0000-0000-000000000000'; // Default if not logged in
    const row = await ipcInvoke<Customer & { active_contract: number }>(
      'db:customers:create',
      { ...customer, user_id: customer.user_id || user_id }
    );
    return toBool(row);
  },

  async update(id: string, updates: Omit<UpdateDto<'customers'>, 'user_id' | 'id' | 'device_id' | 'version' | 'is_deleted' | 'sync_status' | 'created_at' | 'updated_at'> & { user_id?: string }): Promise<Customer> {
    const row = await ipcInvoke<Customer & { active_contract: number }>(
      'db:customers:update',
      { ...updates, id }
    );
    return toBool(row);
  },

  async delete(id: string): Promise<void> {
    await ipcInvoke('db:customers:delete', { id });
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

  async getPaginated(page: number, pageSize: number): Promise<PaginatedResult<Customer>> {
    const result = await ipcInvoke<PaginatedResult<Customer & { active_contract: number }>>(
      'db:customers:getPaginated',
      { page, pageSize }
    );
    return { ...result, data: result.data.map(toBool) };
  },
};

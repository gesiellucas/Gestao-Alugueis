/**
 * Local SQLite customer API — mirrors services/api/customers.ts
 * All operations go through the IPC bridge to the main process.
 */
import { ipcInvoke } from '../../lib/ipc';
import { Customer } from '../../types';
import type { InsertDto, UpdateDto } from '../../types/database';

// userId is read from the current session via Supabase auth in Electron
function requireUserId(): string {
  // In Electron, Supabase auth still manages the user session in the renderer.
  // We read the cached user ID from localStorage (set after login).
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
    const rows = await ipcInvoke<(Customer & { active_contract: number })[]>(
      'db:customers:getAll',
      { userId: requireUserId() }
    );
    return rows.map(toBool);
  },

  async getById(id: string): Promise<Customer | null> {
    const row = await ipcInvoke<(Customer & { active_contract: number }) | null>(
      'db:customers:getById',
      { id, userId: requireUserId() }
    );
    return row ? toBool(row) : null;
  },

  async create(customer: InsertDto<'customers'>): Promise<Customer> {
    const row = await ipcInvoke<Customer & { active_contract: number }>(
      'db:customers:create',
      { ...customer, userId: requireUserId() }
    );
    return toBool(row);
  },

  async update(id: string, updates: UpdateDto<'customers'>): Promise<Customer> {
    const row = await ipcInvoke<Customer & { active_contract: number }>(
      'db:customers:update',
      { ...updates, id, userId: requireUserId() }
    );
    return toBool(row);
  },

  async delete(id: string): Promise<void> {
    await ipcInvoke('db:customers:delete', { id, userId: requireUserId() });
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

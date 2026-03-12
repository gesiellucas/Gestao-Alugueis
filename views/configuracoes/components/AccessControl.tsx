'use client';
import React, { useState, useEffect } from "react";
import { AppUser, Role } from "../../../types";
import { localUsersApi } from "../../../services/localApi/users";
import { localRolesApi } from "../../../services/localApi/roles";
import { Users, Shield, Plus, Edit2, Trash2, X, Check } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";

export const AccessControl: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Toggles for UI
  const [isEditingUser, setIsEditingUser] = useState<AppUser | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState<Role | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Form states
  const [formDataUser, setFormDataUser] = useState({ name: '', email: '', password: '', role_id: '' as string | number });
  const [formDataRole, setFormDataRole] = useState({ name: '', permissions: [] as string[] });

  const modules = [
    { id: 'dashboard', label: 'Dashboard Geral' },
    { id: 'veiculos_view', label: 'Frotas (Visualização)' },
    { id: 'veiculos_edit', label: 'Frotas (Edição)' },
    { id: 'oficina_view', label: 'Oficina / Manutenções (Visualização)' },
    { id: 'oficina_edit', label: 'Oficina / Manutenções (Edição)' },
    { id: 'clientes_view', label: 'Clientes (Visualização)' },
    { id: 'clientes_edit', label: 'Clientes (Edição)' },
    { id: 'financeiro_view', label: 'Financeiro / Aluguéis (Visualização)' },
    { id: 'financeiro_edit', label: 'Financeiro / Aluguéis (Edição)' },
    { id: 'configuracoes', label: 'Configurações e Acesso Geral' },
    { id: '*', label: 'Acesso Irrestrito (Admin)' }
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [u, r] = await Promise.all([localUsersApi.getAll(), localRolesApi.getAll()]);
      setUsers(u);
      setRoles(r);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveUser = async () => {
    if (!formDataUser.name || !formDataUser.email || !formDataUser.role_id) return alert('Preencha os campos.');
    const data = {
      ...formDataUser,
      role_id: Number(formDataUser.role_id),
    };
    if (isEditingUser) {
      await localUsersApi.update(isEditingUser.id, data);
      setIsEditingUser(null);
    } else {
      if (!formDataUser.password) return alert('Senha é obrigatória.');
      await localUsersApi.create(data);
      setIsCreatingUser(false);
    }
    loadData();
  };

  const handleSaveRole = async () => {
    if (!formDataRole.name) return alert('Nome do cargo obrigatório.');
    if (isEditingRole) {
      await localRolesApi.update(isEditingRole.id, formDataRole);
      setIsEditingRole(null);
    } else {
      await localRolesApi.create(formDataRole);
      setIsCreatingRole(false);
    }
    loadData();
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir o usuário?')) {
      await localUsersApi.delete(id);
      loadData();
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (confirm('Atenção! Ao excluir este cargo, os usuários com ele perderão os acessos até que outro seja atribuído. Confirmar?')) {
      await localRolesApi.delete(id);
      loadData();
    }
  };

  return (
    <div className="space-y-10 py-4">

      <ModuleHeader 
        title="Acesso & Segurança" 
        subtitle="Gerencie usuários, cargos e permissões do sistema."
        breadcrumbs={[
          { label: "Configurações", href: "/configuracoes" },
          { label: "Acesso" }
        ]} 
      />

      {/* ---------- USERS SECTION ---------- */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-black text-[#004AAD] uppercase">Membros de Equipe</h3>
          </div>
          <button
            onClick={() => { setIsCreatingUser(true); setFormDataUser({ name: '', email: '', password: '', role_id: roles[0]?.id || '' }); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition"
          >
            <Plus size={16} /> Novo Usuário
          </button>
        </div>

        {(isCreatingUser || isEditingUser) && (
          <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
              <input type="text" value={formDataUser.name} onChange={e => setFormDataUser(prev => ({...prev, name: e.target.value}))} className="w-full border-slate-300 rounded-xl p-2" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
              <input type="email" value={formDataUser.email} onChange={e => setFormDataUser(prev => ({...prev, email: e.target.value}))} className="w-full border-slate-300 rounded-xl p-2" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isEditingUser ? 'Nova Senha (deixe em branco se não quiser alterar)' : 'Senha'}</label>
              <input type="password" value={formDataUser.password} onChange={e => setFormDataUser(prev => ({...prev, password: e.target.value}))} className="w-full border-slate-300 rounded-xl p-2" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cargo</label>
              <select value={formDataUser.role_id} onChange={e => setFormDataUser(prev => ({...prev, role_id: e.target.value === "" ? "" : Number(e.target.value)}))} className="w-full border-slate-300 rounded-xl p-2 bg-white">
                <option value="">Selecione um cargo</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="col-span-full flex justify-end gap-3 mt-4">
              <button onClick={() => { setIsCreatingUser(false); setIsEditingUser(null); }} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold">Cancelar</button>
              <button onClick={handleSaveUser} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Salvar Usuário</button>
            </div>
          </div>
        )}

        {loading ? <p>Carregando...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-widest">
                  <th className="py-4 font-bold">Usuário</th>
                  <th className="py-4 font-bold">Cargo</th>
                  <th className="py-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                    <td className="py-4">
                      <p className="font-bold text-slate-700">{u.name}</p>
                      <p className="text-sm text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-4">
                      <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                        {u.role?.name || "Sem cargo"}
                      </span>
                    </td>
                    <td className="py-4 text-right flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setIsEditingUser(u); setFormDataUser({ name: u.name, email: u.email, password: '', role_id: u.role_id }); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------- ROLES SECTION ---------- */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-xl text-yellow-600">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-black text-[#004AAD] uppercase">Cargos e Permissões</h3>
          </div>
          <button
            onClick={() => { setIsCreatingRole(true); setFormDataRole({ name: '', permissions: [] }); }}
            className="bg-[#004AAD] hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition"
          >
            <Plus size={16} /> Novo Cargo
          </button>
        </div>

        {(isCreatingRole || isEditingRole) && (
          <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Cargo</label>
              <input type="text" value={formDataRole.name} onChange={e => setFormDataRole(prev => ({...prev, name: e.target.value}))} className="w-full max-w-md border-slate-300 rounded-xl p-2" placeholder="Ex: Vendedor" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Módulos Permitidos</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {modules.map(mod => {
                  const isChecked = formDataRole.permissions.includes(mod.id);
                  return (
                    <label key={mod.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isChecked ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          setFormDataRole(prev => {
                            const newPerms = e.target.checked
                              ? [...prev.permissions, mod.id]
                              : prev.permissions.filter(p => p !== mod.id);
                            return { ...prev, permissions: newPerms };
                          });
                        }}
                        className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-[#004AAD]"
                      />
                      <span className={`text-sm font-medium ${isChecked ? 'text-blue-900' : 'text-slate-600'}`}>{mod.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button onClick={() => { setIsCreatingRole(false); setIsEditingRole(null); }} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold">Cancelar</button>
              <button onClick={handleSaveRole} className="px-6 py-2 bg-[#004AAD] text-white rounded-xl font-bold">Salvar Cargo</button>
            </div>
          </div>
        )}

        {loading ? <p>Carregando...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map(r => (
              <div key={r.id} className="border border-slate-200 rounded-xl p-6 relative group">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setIsEditingRole(r); setFormDataRole({ name: r.name, permissions: r.permissions }); }} className="p-1.5 text-blue-500 bg-blue-50 rounded-md hover:bg-blue-100"><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteRole(r.id)} className="p-1.5 text-red-500 bg-red-50 rounded-md hover:bg-red-100"><Trash2 size={14} /></button>
                </div>

                <h4 className="text-lg font-black text-slate-800 mb-1">{r.name}</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">
                  {users.filter(u => u.role_id === r.id).length} Usuário(s)
                </p>

                <div className="flex flex-wrap gap-2">
                  {r.permissions.includes('*') ? (
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">Acesso Total (*)</span>
                  ) : (
                    r.permissions.map(p => (
                      <span key={p} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                        {modules.find(m => m.id === p)?.label || p}
                      </span>
                    ))
                  )}
                  {r.permissions.length === 0 && <span className="text-xs text-slate-400 italic">Nenhum acesso definido</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

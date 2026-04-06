// Pagination types
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


export interface SyncMetadata {
  created_at: string;
  updated_at: string;
  updated_by?: string | null;
  device_id: string;
  version: number;
  is_deleted: number;
  sync_status: 'pending' | 'synced' | 'error';
}

export interface Workshop extends SyncMetadata {
  id: string;
  name: string;
  address?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface VehicleStatusRecord extends SyncMetadata {
  id: string;
  name: string;
  code: string; // Stable semantic key: AVAILABLE, RENTED, MAINTENANCE, UNAVAILABLE, STOLEN, TOTALED
  color: string;
  is_default: boolean | number;
}

export interface Role extends SyncMetadata {
  id: string;
  name: string;
  permissions: string[]; // e.g. ['dashboard', 'veiculos', 'oficina', 'clientes', 'alugueis', 'financeiro', 'configuracoes']
}

export interface AppUser extends SyncMetadata {
  id: string;
  name: string;
  email: string;
  role_id: string;
  role?: Role; // Populated from join
  password?: string;
}

export interface Customer extends SyncMetadata {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  cpf: string;
  active_contract: boolean;
  balance_due: number;
  last_payment_date?: string | null;
}

export interface VehicleModel extends SyncMetadata {
  id: string;
  name: string;
  brand: string;
  status: 'ACTIVE' | 'INACTIVE';
  image_url?: string | null;
}

export interface Vehicle extends SyncMetadata {
  id: string;
  plate: string;
  model_id: string;
  model?: VehicleModel; // Populated from join
  year: number;
  status_id: string;
  vehicleStatus?: VehicleStatusRecord; // Populated from join
  mileage: number;
  current_renter_id?: string | null;
  default_monthly_rate: number;
}

export interface RentalContract extends SyncMetadata {
  id: string;
  user_id: string;
  vehicle_id: string;
  customer_id: string;
  start_date: string;
  end_date?: string | null;
  monthly_rate: number;
  status: 'ACTIVE' | 'ENDED';
}

export interface Contract extends SyncMetadata {
  id: string;
  rental_id: string;
}

export type MaintenanceType = 'Revisão Periódica' | 'Corretiva/Quebra' | 'Troca de Óleo' | 'Troca de Pneu' | 'Vistoria de Entrada';

export interface MaintenanceRecord extends SyncMetadata {
  id: string;
  user_id: string;
  vehicle_id: string;
  workshop_id?: string | null;
  vehicle_plate: string;
  entry_date: string;
  completion_date?: string | null;
  mechanic_name: string;
  description: string;
  type: MaintenanceType;
  cost: number;
  status: 'OPEN' | 'COMPLETED';
}

export type UnavailableStatusType = 'STOLEN' | 'TOTAL_LOSS';

export interface UnavailableVehicle extends SyncMetadata {
  id: string;
  user_id: string;
  vehicle_id: string;
  status_type: UnavailableStatusType;
  reason: string;
}

export interface Document extends SyncMetadata {
  id: string;
  parent_id: string;
  origin_type: 'CONTRACT' | 'WORKSHOP' | 'UNAVAILABLE_VEHICLE';
  file_url: string;
}

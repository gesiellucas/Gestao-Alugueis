// Pagination types
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Seed IDs for default vehicle statuses (match vehicle_statuses table)
// IDs devem corresponder aos registros no seed (vehicle_statuses)
export const VEHICLE_STATUS_IDS = {
  AVAILABLE: '6ef5a0d2-6744-4db9-b857-84476d3058a0',
  RENTED: 'ba4a4673-05ef-48ae-892e-4fae6619afb0',
  MAINTENANCE: 'ac5aa49d-fbb2-4291-8933-a82dd37f0e13',
  UNAVAILABLE: 'b3350b93-3765-4bca-becb-027072cc659b',
  RESERVED: 'c3d59d46-1af5-4c59-8cd5-b00be8460ee3',
} as const;

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
  type: `${MaintenanceType}`;
  cost: number;
  status: 'OPEN' | 'COMPLETED';
}

export interface Document extends SyncMetadata {
  id: string;
  parent_id: string;
  origin_type: 'CONTRACT' | 'WORKSHOP';
  file_url: string;
}

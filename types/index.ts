
// Seed IDs for default vehicle statuses (match vehicle_statuses table)
export const VEHICLE_STATUS_IDS = {
  AVAILABLE: 1,
  RENTED: 2,
  MAINTENANCE: 3,
  UNAVAILABLE: 4,
} as const;

export enum MaintenanceType {
  PREVENTIVE = 'Revisão Periódica',
  CORRECTIVE = 'Corretiva/Quebra',
  OIL_CHANGE = 'Troca de Óleo',
  TIRE_CHANGE = 'Troca de Pneu',
  CHECKUP = 'Vistoria de Entrada'
}

export interface Workshop {
  id: number;
  name: string;
  address?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export interface VehicleStatusRecord {
  id: number;
  name: string;
  color: string;
  is_default: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  workshop_id?: number | null;
  name: string;
  permissions: string[]; // e.g. ['dashboard', 'veiculos', 'oficina', 'clientes', 'alugueis', 'financeiro', 'configuracoes']
  created_at?: string;
  updated_at?: string;
}

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role?: Role; // Populated from join
  password?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  cpf: string;
  active_contract: boolean;
  balance_due: number;
  last_payment_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleModel {
  id: number;
  name: string;
  brand: string;
  status: 'ACTIVE' | 'INACTIVE';
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Vehicle {
  id: number;
  plate: string;
  model_id: number;
  model?: VehicleModel; // Populated from join
  year: number;
  status_id: number;
  vehicleStatus?: VehicleStatusRecord; // Populated from join
  mileage: number;
  current_renter_id?: number | null;
  default_monthly_rate: number;
  created_at?: string;
  updated_at?: string;
}

export interface RentalContract {
  id: number;
  user_id: number;
  vehicle_id: number;
  customer_id: number;
  start_date: string;
  end_date?: string | null;
  monthly_rate: number;
  status: 'ACTIVE' | 'ENDED';
  created_at?: string;
  updated_at?: string;
}

export interface Contract {
  id: number;
  rental_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceRecord {
  id: number;
  user_id: number;
  vehicle_id: number;
  workshop_id?: number | null;
  vehicle_plate: string;
  entry_date: string;
  completion_date?: string | null;
  mechanic_name: string;
  description: string;
  type: `${MaintenanceType}`;
  cost: number;
  status: 'OPEN' | 'COMPLETED';
  created_at?: string;
  updated_at?: string;
}

export interface Document {
  id: number;
  parent_id: number;
  origin_type: 'CONTRACT' | 'WORKSHOP';
  file_url: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

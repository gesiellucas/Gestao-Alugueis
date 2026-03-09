
export enum VehicleStatus {
  AVAILABLE = 'Disponível',
  RENTED = 'Alugada',
  MAINTENANCE = 'Em Manutenção',
  UNAVAILABLE = 'Indisponível'
}

export enum MaintenanceType {
  PREVENTIVE = 'Revisão Periódica',
  CORRECTIVE = 'Corretiva/Quebra',
  OIL_CHANGE = 'Troca de Óleo',
  TIRE_CHANGE = 'Troca de Pneu',
  CHECKUP = 'Vistoria de Entrada'
}

export interface Workshop {
  id: string;
  name: string;
  address?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: string;
  workshop_id?: string | null;
  name: string;
  permissions: string[]; // e.g. ['dashboard', 'veiculos', 'oficina', 'clientes', 'alugueis', 'financeiro', 'configuracoes']
  created_at?: string;
  updated_at?: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role_id: string;
  role?: Role; // Populated from join
  password?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
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
  id: string;
  name: string;
  brand: string;
  status: 'ACTIVE' | 'INACTIVE';
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model_id: string;
  model?: VehicleModel; // Populated from join
  year: number;
  status: `${VehicleStatus}`;
  mileage: number;
  current_renter_id?: string | null;
  default_monthly_rate: number;
  created_at?: string;
  updated_at?: string;
}

export interface RentalContract {
  id: string;
  vehicle_id: string;
  customer_id: string;
  start_date: string;
  end_date?: string | null;
  monthly_rate: number;
  status: 'ACTIVE' | 'ENDED';
  created_at?: string;
  updated_at?: string;
}

export interface Contract {
  id: string;
  rental_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceRecord {
  id: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface Document {
  id: string;
  parent_id: string;
  origin_type: 'CONTRACT' | 'WORKSHOP';
  file_url: string;
  created_at?: string;
  updated_at?: string;
}

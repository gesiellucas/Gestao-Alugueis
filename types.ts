
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

export enum UserRole {
  ADMIN = 'ADMIN',
  MECHANIC = 'MECHANIC',
  BILLING = 'BILLING'
}

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
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

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  status: `${VehicleStatus}`;
  mileage: number;
  image_url?: string | null;
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

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
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

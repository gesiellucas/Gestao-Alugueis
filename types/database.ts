export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      workshops: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          status: 'ACTIVE' | 'INACTIVE';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          status?: 'ACTIVE' | 'INACTIVE';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          status?: 'ACTIVE' | 'INACTIVE';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'ADMIN' | 'MECHANIC' | 'BILLING';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role?: 'ADMIN' | 'MECHANIC' | 'BILLING';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: 'ADMIN' | 'MECHANIC' | 'BILLING';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          cpf: string;
          active_contract: boolean;
          balance_due: number;
          last_payment_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          cpf: string;
          active_contract?: boolean;
          balance_due?: number;
          last_payment_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          cpf?: string;
          active_contract?: boolean;
          balance_due?: number;
          last_payment_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vehicle_models: {
        Row: {
          id: string;
          name: string;
          brand: string;
          image_url: string | null;
          status: 'ACTIVE' | 'INACTIVE';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          brand: string;
          image_url?: string | null;
          status?: 'ACTIVE' | 'INACTIVE';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          brand?: string;
          image_url?: string | null;
          status?: 'ACTIVE' | 'INACTIVE';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          plate: string;
          model_id: string;
          year: number;
          status: 'Disponível' | 'Alugada' | 'Em Manutenção' | 'Indisponível';
          mileage: number;
          current_renter_id: string | null;
          default_monthly_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plate: string;
          model_id: string;
          year: number;
          status?: 'Disponível' | 'Alugada' | 'Em Manutenção' | 'Indisponível';
          mileage?: number;
          current_renter_id?: string | null;
          default_monthly_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plate?: string;
          model_id?: string;
          year?: number;
          status?: 'Disponível' | 'Alugada' | 'Em Manutenção' | 'Indisponível';
          mileage?: number;
          current_renter_id?: string | null;
          default_monthly_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vehicles_model_id_fkey';
            columns: ['model_id'];
            isOneToOne: false;
            referencedRelation: 'vehicle_models';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicles_current_renter_id_fkey';
            columns: ['current_renter_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
        ];
      };
      rentals: {
        Row: {
          id: string;
          vehicle_id: string;
          customer_id: string;
          start_date: string;
          end_date: string | null;
          monthly_rate: number;
          status: 'ACTIVE' | 'ENDED';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          customer_id: string;
          start_date: string;
          end_date?: string | null;
          monthly_rate: number;
          status?: 'ACTIVE' | 'ENDED';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          customer_id?: string;
          start_date?: string;
          end_date?: string | null;
          monthly_rate?: number;
          status?: 'ACTIVE' | 'ENDED';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'rentals_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rentals_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
        ];
      };
      contracts: {
        Row: {
          id: string;
          rental_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rental_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rental_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contracts_rental_id_fkey';
            columns: ['rental_id'];
            isOneToOne: true;
            referencedRelation: 'rentals';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_records: {
        Row: {
          id: string;
          vehicle_id: string;
          workshop_id: string | null;
          vehicle_plate: string;
          entry_date: string;
          completion_date: string | null;
          mechanic_name: string;
          description: string;
          type: 'Revisão Periódica' | 'Corretiva/Quebra' | 'Troca de Óleo' | 'Troca de Pneu' | 'Vistoria de Entrada';
          cost: number;
          status: 'OPEN' | 'COMPLETED';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          workshop_id?: string | null;
          vehicle_plate: string;
          entry_date?: string;
          completion_date?: string | null;
          mechanic_name: string;
          description: string;
          type: 'Revisão Periódica' | 'Corretiva/Quebra' | 'Troca de Óleo' | 'Troca de Pneu' | 'Vistoria de Entrada';
          cost?: number;
          status?: 'OPEN' | 'COMPLETED';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          workshop_id?: string | null;
          vehicle_plate?: string;
          entry_date?: string;
          completion_date?: string | null;
          mechanic_name?: string;
          description?: string;
          type?: 'Revisão Periódica' | 'Corretiva/Quebra' | 'Troca de Óleo' | 'Troca de Pneu' | 'Vistoria de Entrada';
          cost?: number;
          status?: 'OPEN' | 'COMPLETED';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_records_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_records_workshop_id_fkey';
            columns: ['workshop_id'];
            isOneToOne: false;
            referencedRelation: 'workshops';
            referencedColumns: ['id'];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          parent_id: string;
          origin_type: 'CONTRACT' | 'WORKSHOP';
          file_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          origin_type: 'CONTRACT' | 'WORKSHOP';
          file_url: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          origin_type?: 'CONTRACT' | 'WORKSHOP';
          file_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      vehicle_status: 'Disponível' | 'Alugada' | 'Em Manutenção' | 'Indisponível';
      maintenance_type: 'Revisão Periódica' | 'Corretiva/Quebra' | 'Troca de Óleo' | 'Troca de Pneu' | 'Vistoria de Entrada';
      user_role: 'ADMIN' | 'MECHANIC' | 'BILLING';
      contract_status: 'ACTIVE' | 'ENDED';
      maintenance_status: 'OPEN' | 'COMPLETED';
    };
    CompositeTypes: {};
  };
}

// Atalhos de tipo para uso direto
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Tipos das entidades (Row)
export type DbAppUser = Tables<'app_users'>;
export type DbCustomer = Tables<'customers'>;
export type DbVehicle = Tables<'vehicles'>;
export type DbRentalContract = Tables<'rentals'>;
export type DbMaintenanceRecord = Tables<'maintenance_records'>;
export type DbWorkshop = Tables<'workshops'>;
export type DbContract = Tables<'contracts'>;
export type DbDocument = Tables<'documents'>;

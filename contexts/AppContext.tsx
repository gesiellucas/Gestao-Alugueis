'use client';
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Vehicle,
  MaintenanceRecord,
  Customer,
  VehicleStatus,
  AppUser,
  UserRole,
  RentalContract,
} from "../types";
import {
  getVehiclesApi,
  getCustomersApi,
  getRentalsApi,
  getMaintenanceApi,
} from "../lib/apiFactory";

interface AppContextType {
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  maintenanceRecords: MaintenanceRecord[];
  setMaintenanceRecords: React.Dispatch<
    React.SetStateAction<MaintenanceRecord[]>
  >;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  rentalContracts: RentalContract[];
  setRentalContracts: React.Dispatch<React.SetStateAction<RentalContract[]>>;
  handleAddMaintenanceRecord: (record: MaintenanceRecord) => Promise<void>;
  handleFinishMaintenance: (recordId: string) => Promise<void>;
  handleCreateRental: (vehicleId: string, customerId: string, monthlyRate: number, startDate: string) => Promise<void>;
  handleEndRental: (vehicleId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within AppProvider");
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceRecord[]
  >([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rentalContracts, setRentalContracts] = useState<RentalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Re-hydrate user from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("electron_user_id");
      if (storedId) {
        // Mocking the static users from Login.tsx
        if (storedId === "1") {
          setUser({ id: "1", name: "Gestor Master", role: UserRole.ADMIN, email: "admin@gclocamoto.com.br" });
        } else if (storedId === "2") {
          setUser({ id: "2", name: "Roberto Mecânico", role: UserRole.MECHANIC, email: "oficina@gclocamoto.com.br" });
        } else if (storedId === "3") {
          setUser({ id: "3", name: "Clara Financeiro", role: UserRole.BILLING, email: "financeiro@gclocamoto.com.br" });
        }
      }
    }
  }, []);

  // Função para carregar todos os dados do Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [vehiclesData, customersData, contractsData, maintenanceData] =
        await Promise.all([
          getVehiclesApi().getAll(),
          getCustomersApi().getAll(),
          getRentalsApi().getAll(),
          getMaintenanceApi().getAll(),
        ]);

      setVehicles(vehiclesData);
      setCustomers(customersData);
      setRentalContracts(contractsData);
      setMaintenanceRecords(maintenanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na montagem do componente
  useEffect(() => {
    loadData();
  }, []);

  const handleAddMaintenanceRecord = async (record: MaintenanceRecord) => {
    try {
      // Criar na API correspondente (Local ou Supabase)
      const newRecord = await getMaintenanceApi().create({
        vehicle_id: record.vehicle_id,
        vehicle_plate: record.vehicle_plate,
        entry_date: record.entry_date,
        mechanic_name: record.mechanic_name,
        description: record.description,
        type: record.type,
        cost: record.cost,
        status: record.status,
      });

      // Atualizar status do veículo para "Em Manutenção"
      await getVehiclesApi().updateStatus(
        record.vehicle_id,
        VehicleStatus.MAINTENANCE,
      );

      // Atualizar estado local
      setMaintenanceRecords((prev) => [newRecord, ...prev]);
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === record.vehicle_id
            ? { ...v, status: VehicleStatus.MAINTENANCE }
            : v,
        ),
      );
    } catch (err) {
      console.error("Error adding maintenance record:", err);
      throw err;
    }
  };

  const handleFinishMaintenance = async (recordId: string) => {
    try {
      const record = maintenanceRecords.find((r) => r.id === recordId);
      if (!record) return;

      // Finalizar manutenção
      await getMaintenanceApi().complete(recordId);

      // Atualizar status do veículo para "Disponível"
      await getVehiclesApi().updateStatus(
        record.vehicle_id,
        VehicleStatus.AVAILABLE,
      );

      // Atualizar estado local
      setMaintenanceRecords((prev) =>
        prev.map((r) =>
          r.id === recordId
            ? {
                ...r,
                status: "COMPLETED",
                completion_date: new Date().toISOString(),
              }
            : r,
        ),
      );

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === record.vehicle_id
            ? { ...v, status: VehicleStatus.AVAILABLE }
            : v,
        ),
      );
    } catch (err) {
      console.error("Error finishing maintenance:", err);
      throw err;
    }
  };

  const handleCreateRental = async (
    vehicleId: string,
    customerId: string,
    monthlyRate: number,
    startDate: string,
  ) => {
    try {
      // Criar contrato
      const newContract = await getRentalsApi().create({
        vehicle_id: vehicleId,
        customer_id: customerId,
        monthly_rate: monthlyRate,
        start_date: startDate,
        status: "ACTIVE",
      });

      // Atualizar veículo: status = Alugada e current_renter_id
      await getVehiclesApi().update(vehicleId, {
        status: VehicleStatus.RENTED,
        current_renter_id: customerId,
      });

      // Atualizar cliente: active_contract = true
      await getCustomersApi().update(customerId, { active_contract: true });

      // Atualizar estado local
      setRentalContracts((prev) => [newContract, ...prev]);
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId
            ? { ...v, status: VehicleStatus.RENTED, current_renter_id: customerId }
            : v,
        ),
      );
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, active_contract: true } : c,
        ),
      );
    } catch (err) {
      console.error("Error creating rental contract:", err);
      throw err;
    }
  };

  const handleEndRental = async (vehicleId: string) => {
    try {
      // Buscar contrato ativo desse veículo
      const activeContract = rentalContracts.find(
        (c) => c.vehicle_id === vehicleId && c.status === "ACTIVE",
      );
      if (!activeContract) return;

      // Encerrar contrato
      await getRentalsApi().end(activeContract.id);

      // Atualizar veículo: status = Disponível e limpar current_renter_id
      await getVehiclesApi().update(vehicleId, {
        status: VehicleStatus.AVAILABLE,
        current_renter_id: null,
      });

      // Verificar se o cliente tem outros contratos ativos
      const customerId = activeContract.customer_id;
      const otherActiveContracts = rentalContracts.filter(
        (c) =>
          c.customer_id === customerId &&
          c.status === "ACTIVE" &&
          c.id !== activeContract.id,
      );

      if (otherActiveContracts.length === 0) {
        await getCustomersApi().update(customerId, { active_contract: false });
      }

      // Atualizar estado local
      setRentalContracts((prev) =>
        prev.map((c) =>
          c.id === activeContract.id
            ? { ...c, status: "ENDED", end_date: new Date().toISOString().split("T")[0] }
            : c,
        ),
      );
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId
            ? { ...v, status: VehicleStatus.AVAILABLE, current_renter_id: null }
            : v,
        ),
      );
      if (otherActiveContracts.length === 0) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customerId ? { ...c, active_contract: false } : c,
          ),
        );
      }
    } catch (err) {
      console.error("Error ending rental contract:", err);
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        vehicles,
        setVehicles,
        maintenanceRecords,
        setMaintenanceRecords,
        customers,
        setCustomers,
        rentalContracts,
        setRentalContracts,
        handleAddMaintenanceRecord,
        handleFinishMaintenance,
        handleCreateRental,
        handleEndRental,
        loading,
        error,
        refreshData: loadData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

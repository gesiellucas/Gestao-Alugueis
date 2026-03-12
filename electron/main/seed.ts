import { sql } from 'drizzle-orm';
import { 
  customers, 
  vehicleModels, 
  vehicles, 
  workshops, 
  vehicleStatuses 
} from '../../db/schema';
import type { DrizzleDb } from '../../db/index';

export function runSeed(db: DrizzleDb): void {
  const now = new Date().toISOString();

  // 1. Oficinas (Workshops)
  const workshopCount = db.select({ n: sql<number>`count(*)` }).from(workshops).get();
  if ((workshopCount?.n ?? 0) < 5) {
    db.insert(workshops).values([
      { id: 'w1', name: 'Oficina Central Auto', address: 'Av. Principal, 100', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w2', name: 'Mecânica do Beto', address: 'Rua das Flores, 45', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w3', name: 'Flash Moto Service', address: 'Rua Veloz, 88', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w4', name: 'Centro Automotivo Silva', address: 'Av. Getúlio Vargas, 1200', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w5', name: 'Oficina Estrela', address: 'Rua Saturno, 33', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w6', name: 'Precision Mechanics', address: 'Industrial Park, Loja 4', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w7', name: 'Moto Master GCL', address: 'Rua das Motos, 10', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w8', name: 'Oficina do Povo', address: 'Bairro Operário, S/N', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w9', name: 'Elite Auto Repair', address: 'Shopping Center, P1', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w10', name: 'Mecânica Rápida', address: 'Posto BR Central', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w11', name: 'Auto Check-up', address: 'Av. Brasil, 500', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w12', name: 'Oficina do Zé', address: 'Rua da Lama, 20', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w13', name: 'Grand Prix Service', address: 'Av. Automobilista, 99', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w14', name: 'Moto Tech', address: 'Rua Eletrônica, 15', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w15', name: 'Oficina 24 Horas', address: 'Rodovia KM 12', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w16', name: 'Ponto da Manutenção', address: 'Rua de Baixo, 44', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w17', name: 'Auto Sul', address: 'Av. Sul, 202', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w18', name: 'Mecânica Norte', address: 'Av. Norte, 303', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w19', name: 'Garagem do Futuro', address: 'Rua High-Tech, 1', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'w20', name: 'Oficina do Bairro', address: 'Rua Amizade, 12', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
    ]).onConflictDoNothing().run();
  }

  // 2. Modelos de Veículos (Vehicle Models)
  const modelsCount = db.select({ n: sql<number>`count(*)` }).from(vehicleModels).get();
  if ((modelsCount?.n ?? 0) < 5) {
    db.insert(vehicleModels).values([
      { id: 'vm1', name: 'CG 160 Titan', brand: 'Honda', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm2', name: 'NMAX 160', brand: 'Yamaha', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm3', name: 'Bros 160', brand: 'Honda', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm4', name: 'PCX 150', brand: 'Honda', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm5', name: 'FZ25 Fazer', brand: 'Yamaha', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm6', name: 'XRE 300', brand: 'Honda', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm7', name: 'Lander 250', brand: 'Yamaha', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm8', name: 'Factor 150', brand: 'Yamaha', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm9', name: 'Biz 125', brand: 'Honda', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm10', name: 'Pop 110i', brand: 'Honda', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm11', name: 'Crosser 150', brand: 'Yamaha', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm12', name: 'MT-03', brand: 'Yamaha', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm13', name: 'CB 500X', brand: 'Honda', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm14', name: 'Versys 300', brand: 'Kawasaki', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm15', name: 'Ninja 400', brand: 'Kawasaki', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm16', name: 'Tiger 900', brand: 'Triumph', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm17', name: 'G 310 GS', brand: 'BMW', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm18', name: 'Scrambler 400X', brand: 'Triumph', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm19', name: 'R 1250 GS', brand: 'BMW', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'vm20', name: 'Himalayan 411', brand: 'Royal Enfield', status: 'ACTIVE', createdAt: now, updatedAt: now, dirty: 1 },
    ]).onConflictDoNothing().run();
  }

  // 3. Clientes (Customers) - Assumindo userId '1' para o administrador padrão
  const customersCount = db.select({ n: sql<number>`count(*)` }).from(customers).get();
  if ((customersCount?.n ?? 0) < 5) {
    db.insert(customers).values([
      { id: 'c1', userId: '1', name: 'João Silva', phone: '(11) 98888-7777', cpf: '123.456.789-00', activeContract: 1, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c2', userId: '1', name: 'Maria Oliveira', phone: '(11) 97777-6666', cpf: '234.567.890-11', activeContract: 1, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c3', userId: '1', name: 'Pedro Santos', phone: '(21) 96666-5555', cpf: '345.678.901-22', activeContract: 0, balanceDue: 150, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c4', userId: '1', name: 'Ana Souza', phone: '(31) 95555-4444', cpf: '456.789.012-33', activeContract: 1, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c5', userId: '1', name: 'Carlos Lima', phone: '(41) 94444-3333', cpf: '567.890.123-44', activeContract: 0, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c6', userId: '1', name: 'Fernanda Rocha', phone: '(51) 93333-2222', cpf: '678.901.234-55', activeContract: 1, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c7', userId: '1', name: 'Ricardo Alves', phone: '(61) 92222-1111', cpf: '789.012.345-66', activeContract: 1, balanceDue: 45.5, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c8', userId: '1', name: 'Juliana Costa', phone: '(71) 91111-0000', cpf: '890.123.456-77', activeContract: 0, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c9', userId: '1', name: 'Roberto Garcia', phone: '(81) 90000-9999', cpf: '901.234.567-88', activeContract: 1, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c10', userId: '1', name: 'Camila Martins', phone: '(91) 89999-8888', cpf: '012.345.678-99', activeContract: 1, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c11', userId: '1', name: 'Bruno Ferreira', phone: '(11) 88888-7777', cpf: '111.222.333-44', activeContract: 0, balanceDue: 200, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c12', userId: '1', name: 'Amanda Lima', phone: '(22) 87777-6666', cpf: '222.333.444-55', activeContract: 1, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c13', userId: '1', name: 'Lucas Pires', phone: '(33) 86666-5555', cpf: '333.444.555-66', activeContract: 1, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c14', userId: '1', name: 'Patrícia Gomes', phone: '(44) 85555-4444', cpf: '444.555.666-77', activeContract: 0, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c15', userId: '1', name: 'Gabriel Souza', phone: '(55) 84444-3333', cpf: '555.666.777-88', activeContract: 1, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c16', userId: '1', name: 'Bárbara Silva', phone: '(66) 83333-2222', cpf: '666.777.888-99', activeContract: 1, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c17', userId: '1', name: 'Rodrigo Melo', phone: '(77) 82222-1111', cpf: '777.888.999-00', activeContract: 0, balanceDue: 500, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c18', userId: '1', name: 'Tatiana Dias', phone: '(88) 81111-0000', cpf: '888.999.000-11', activeContract: 1, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c19', userId: '1', name: 'Hugo Ramos', phone: '(99) 80000-9999', cpf: '999.000.111-22', activeContract: 1, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'c20', userId: '1', name: 'Vanessa Luz', phone: '(11) 79999-8888', cpf: '000.111.222-33', activeContract: 0, balanceDue: 0, createdAt: now, updatedAt: now, dirty: 1 },
    ]).onConflictDoNothing().run();
  }

  // 4. Veículos (Vehicles)
  const vehiclesCount = db.select({ n: sql<number>`count(*)` }).from(vehicles).get();
  if ((vehiclesCount?.n ?? 0) < 5) {
    db.insert(vehicles).values([
      { id: 'v1', plate: 'ABC-1234', modelId: 'vm1', year: 2023, statusId: 'vs_available', mileage: 5000, defaultMonthlyRate: 550, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v2', plate: 'DEF-5678', modelId: 'vm2', year: 2024, statusId: 'vs_rented', mileage: 1200, currentRenterId: 'c1', defaultMonthlyRate: 750, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v3', plate: 'GHI-9012', modelId: 'vm3', year: 2022, statusId: 'vs_available', mileage: 15000, defaultMonthlyRate: 600, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v4', plate: 'JKL-3456', modelId: 'vm1', year: 2023, statusId: 'vs_maintenance', mileage: 8000, defaultMonthlyRate: 550, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v5', plate: 'MNO-7890', modelId: 'vm4', year: 2024, statusId: 'vs_rented', mileage: 500, currentRenterId: 'c2', defaultMonthlyRate: 800, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v6', plate: 'PQR-1122', modelId: 'vm5', year: 2021, statusId: 'vs_available', mileage: 25000, defaultMonthlyRate: 700, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v7', plate: 'STU-3344', modelId: 'vm2', year: 2023, statusId: 'vs_available', mileage: 4500, defaultMonthlyRate: 750, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v8', plate: 'VWX-5566', modelId: 'vm6', year: 2022, statusId: 'vs_rented', mileage: 12000, currentRenterId: 'c4', defaultMonthlyRate: 950, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v9', plate: 'YZA-7788', modelId: 'vm7', year: 2023, statusId: 'vs_available', mileage: 6000, defaultMonthlyRate: 850, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v10', plate: 'BBB-9900', modelId: 'vm8', year: 2020, statusId: 'vs_unavailable', mileage: 35000, defaultMonthlyRate: 450, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v11', plate: 'CCC-1212', modelId: 'vm1', year: 2024, statusId: 'vs_available', mileage: 100, defaultMonthlyRate: 550, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v12', plate: 'DDD-3434', modelId: 'vm9', year: 2023, statusId: 'vs_rented', mileage: 3500, currentRenterId: 'c6', defaultMonthlyRate: 400, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v13', plate: 'EEE-5656', modelId: 'vm10', year: 2022, statusId: 'vs_available', mileage: 12000, defaultMonthlyRate: 300, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v14', plate: 'FFF-7878', modelId: 'vm11', year: 2023, statusId: 'vs_maintenance', mileage: 9500, defaultMonthlyRate: 650, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v15', plate: 'GGG-9090', modelId: 'vm12', year: 2024, statusId: 'vs_available', mileage: 50, defaultMonthlyRate: 1200, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v16', plate: 'HHH-1111', modelId: 'vm13', year: 2023, statusId: 'vs_rented', mileage: 7800, currentRenterId: 'c7', defaultMonthlyRate: 1800, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v17', plate: 'III-2222', modelId: 'vm17', year: 2024, statusId: 'vs_available', mileage: 200, defaultMonthlyRate: 1500, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v18', plate: 'JJJ-3333', modelId: 'vm20', year: 2022, statusId: 'vs_maintenance', mileage: 15000, defaultMonthlyRate: 1100, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v19', plate: 'KKK-4444', modelId: 'vm18', year: 2024, statusId: 'vs_rented', mileage: 1500, currentRenterId: 'c9', defaultMonthlyRate: 1400, createdAt: now, updatedAt: now, dirty: 1 },
      { id: 'v20', plate: 'LLL-5555', modelId: 'vm19', year: 2023, statusId: 'vs_available', mileage: 5000, defaultMonthlyRate: 2500, createdAt: now, updatedAt: now, dirty: 1 },
    ]).onConflictDoNothing().run();
  }
}

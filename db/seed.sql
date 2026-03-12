-- Semeadura de dados mockados para Gestão de Alugueis
-- Compatível com SQLite e sincronização Supabase (dirty = 1)

-- 1. Oficinas (Workshops) - 20 registros
INSERT INTO workshops (id, name, address, status, created_at, updated_at, dirty) VALUES
('w1', 'Oficina Central Auto', 'Av. Principal, 100', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w2', 'Mecânica do Beto', 'Rua das Flores, 45', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w3', 'Flash Moto Service', 'Rua Veloz, 88', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w4', 'Centro Automotivo Silva', 'Av. Getúlio Vargas, 1200', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w5', 'Oficina Estrela', 'Rua Saturno, 33', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w6', 'Precision Mechanics', 'Industrial Park, Loja 4', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w7', 'Moto Master GCL', 'Rua das Motos, 10', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w8', 'Oficina do Povo', 'Bairro Operário, S/N', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w9', 'Elite Auto Repair', 'Shopping Center, P1', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w10', 'Mecânica Rápida', 'Posto BR Central', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w11', 'Auto Check-up', 'Av. Brasil, 500', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w12', 'Oficina do Zé', 'Rua da Lama, 20', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w13', 'Grand Prix Service', 'Av. Automobilista, 99', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w14', 'Moto Tech', 'Rua Eletrônica, 15', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w15', 'Oficina 24 Horas', 'Rodovia KM 12', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w16', 'Ponto da Manutenção', 'Rua de Baixo, 44', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w17', 'Auto Sul', 'Av. Sul, 202', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w18', 'Mecânica Norte', 'Av. Norte, 303', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w19', 'Garagem do Futuro', 'Rua High-Tech, 1', 'ACTIVE', datetime('now'), datetime('now'), 1),
('w20', 'Oficina do Bairro', 'Rua Amizade, 12', 'ACTIVE', datetime('now'), datetime('now'), 1);

-- 2. Modelos de Veículos (Vehicle Models) - 20 registros
INSERT INTO vehicle_models (id, name, brand, image_url, status, created_at, updated_at, dirty) VALUES
('vm1', 'CG 160 Titan', 'Honda', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm2', 'NMAX 160', 'Yamaha', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm3', 'Bros 160', 'Honda', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm4', 'PCX 150', 'Honda', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm5', 'FZ25 Fazer', 'Yamaha', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm6', 'XRE 300', 'Honda', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm7', 'Lander 250', 'Yamaha', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm8', 'Factor 150', 'Yamaha', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm9', 'Biz 125', 'Honda', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm10', 'Pop 110i', 'Honda', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm11', 'Crosser 150', 'Yamaha', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm12', 'MT-03', 'Yamaha', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm13', 'CB 500X', 'Honda', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm14', 'Versys 300', 'Kawasaki', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm15', 'Ninja 400', 'Kawasaki', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm16', 'Tiger 900', 'Triumph', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm17', 'G 310 GS', 'BMW', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm18', 'Scrambler 400X', 'Triumph', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm19', 'R 1250 GS', 'BMW', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
('vm20', 'Himalayan 411', 'Royal Enfield', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1);

-- 3. Clientes (Customers) - 20 registros (vinculados ao userId '1')
INSERT INTO customers (id, user_id, name, phone, cpf, active_contract, balance_due, last_payment_date, created_at, updated_at, dirty) VALUES
('c1', '1', 'João Silva', '(11) 98888-7777', '123.456.789-00', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
('c2', '1', 'Maria Oliveira', '(11) 97777-6666', '234.567.890-11', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
('c3', '1', 'Pedro Santos', '(21) 96666-5555', '345.678.901-22', 0, 150.00, NULL, datetime('now'), datetime('now'), 1),
('c4', '1', 'Ana Souza', '(31) 95555-4444', '456.789.012-33', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
('c5', '1', 'Carlos Lima', '(41) 94444-3333', '567.890.123-44', 0, 0, NULL, datetime('now'), datetime('now'), 1),
('c6', '1', 'Fernanda Rocha', '(51) 93333-2222', '678.901.234-55', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
('c7', '1', 'Ricardo Alves', '(61) 92222-1111', '789.012.345-66', 1, 45.50, datetime('now'), datetime('now'), datetime('now'), 1),
('c8', '1', 'Juliana Costa', '(71) 91111-0000', '890.123.456-77', 0, 0, NULL, datetime('now'), datetime('now'), 1),
('c9', '1', 'Roberto Garcia', '(81) 90000-9999', '901.234.567-88', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
('c10', '1', 'Camila Martins', '(91) 89999-8888', '012.345.678-99', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
('c11', '1', 'Bruno Ferreira', '(11) 88888-7777', '111.222.333-44', 0, 200.00, NULL, datetime('now'), datetime('now'), 1),
('c12', '1', 'Amanda Lima', '(22) 87777-6666', '222.333.444-55', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
('c13', '1', 'Lucas Pires', '(33) 86666-5555', '333.444.555-66', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
('c14', '1', 'Patrícia Gomes', '(44) 85555-4444', '444.555.666-77', 0, 0, NULL, datetime('now'), datetime('now'), 1),
('c15', '1', 'Gabriel Souza', '(55) 84444-3333', '555.666.777-88', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
('c16', '1', 'Bárbara Silva', '(66) 83333-2222', '666.777.888-99', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
('c17', '1', 'Rodrigo Melo', '(77) 82222-1111', '777.888.999-00', 0, 500.00, NULL, datetime('now'), datetime('now'), 1),
('c18', '1', 'Tatiana Dias', '(88) 81111-0000', '888.999.000-11', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
('c19', '1', 'Hugo Ramos', '(99) 80000-9999', '999.000.111-22', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
('c20', '1', 'Vanessa Luz', '(11) 79999-8888', '000.111.222-33', 0, 0, NULL, datetime('now'), datetime('now'), 1);

-- 4. Veículos (Vehicles) - 20 registros
-- Status IDs esperados: 'vs_available', 'vs_rented', 'vs_maintenance', 'vs_unavailable'
INSERT INTO vehicles (id, plate, model_id, year, status_id, mileage, current_renter_id, default_monthly_rate, created_at, updated_at, dirty) VALUES
('v1', 'ABC-1234', 'vm1', 2023, 'vs_available', 5000, NULL, 550.00, datetime('now'), datetime('now'), 1),
('v2', 'DEF-5678', 'vm2', 2024, 'vs_rented', 1200, 'c1', 750.00, datetime('now'), datetime('now'), 1),
('v3', 'GHI-9012', 'vm3', 2022, 'vs_available', 15000, NULL, 600.00, datetime('now'), datetime('now'), 1),
('v4', 'JKL-3456', 'vm1', 2023, 'vs_maintenance', 8000, NULL, 550.00, datetime('now'), datetime('now'), 1),
('v5', 'MNO-7890', 'vm4', 2024, 'vs_rented', 500, 'c2', 800.00, datetime('now'), datetime('now'), 1),
('v6', 'PQR-1122', 'vm5', 2021, 'vs_available', 25000, NULL, 700.00, datetime('now'), datetime('now'), 1),
('v7', 'STU-3344', 'vm2', 2023, 'vs_available', 4500, NULL, 750.00, datetime('now'), datetime('now'), 1),
('v8', 'VWX-5566', 'vm6', 2022, 'vs_rented', 12000, 'c4', 950.00, datetime('now'), datetime('now'), 1),
('v9', 'YZA-7788', 'vm7', 2023, 'vs_available', 6000, NULL, 850.00, datetime('now'), datetime('now'), 1),
('v10', 'BBB-9900', 'vm8', 2020, 'vs_unavailable', 35000, NULL, 450.00, datetime('now'), datetime('now'), 1),
('v11', 'CCC-1212', 'vm1', 2024, 'vs_available', 100, NULL, 550.00, datetime('now'), datetime('now'), 1),
('v12', 'DDD-3434', 'vm9', 2023, 'vs_rented', 3500, 'c6', 400.00, datetime('now'), datetime('now'), 1),
('v13', 'EEE-5656', 'vm10', 2022, 'vs_available', 12000, NULL, 300.00, datetime('now'), datetime('now'), 1),
('v14', 'FFF-7878', 'vm11', 2023, 'vs_maintenance', 9500, NULL, 650.00, datetime('now'), datetime('now'), 1),
('v15', 'GGG-9090', 'vm12', 2024, 'vs_available', 50, NULL, 1200.00, datetime('now'), datetime('now'), 1),
('v16', 'HHH-1111', 'vm13', 2023, 'vs_rented', 7800, 'c7', 1800.00, datetime('now'), datetime('now'), 1),
('v17', 'III-2222', 'vm17', 2024, 'vs_available', 200, NULL, 1500.00, datetime('now'), datetime('now'), 1),
('v18', 'JJJ-3333', 'vm20', 2022, 'vs_maintenance', 15000, NULL, 1100.00, datetime('now'), datetime('now'), 1),
('v19', 'KKK-4444', 'vm18', 2024, 'vs_rented', 1500, 'c9', 1400.00, datetime('now'), datetime('now'), 1),
('v20', 'LLL-5555', 'vm19', 2023, 'vs_available', 5000, NULL, 2500.00, datetime('now'), datetime('now'), 1);

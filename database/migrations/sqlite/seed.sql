-- Semeadura de dados mockados para Gestão de Alugueis
-- Compatível com SQLite e sincronização Supabase (dirty = 1)

-- 1. Oficinas (Workshops) - 20 registros
INSERT INTO workshops (id, name, address, status, created_at, updated_at, dirty) VALUES
(1, 'Oficina Central Auto', 'Av. Principal, 100', 'ACTIVE', datetime('now'), datetime('now'), 1),
(2, 'Mecânica do Beto', 'Rua das Flores, 45', 'ACTIVE', datetime('now'), datetime('now'), 1),
(3, 'Flash Moto Service', 'Rua Veloz, 88', 'ACTIVE', datetime('now'), datetime('now'), 1),
(4, 'Centro Automotivo Silva', 'Av. Getúlio Vargas, 1200', 'ACTIVE', datetime('now'), datetime('now'), 1),
(5, 'Oficina Estrela', 'Rua Saturno, 33', 'ACTIVE', datetime('now'), datetime('now'), 1),
(6, 'Precision Mechanics', 'Industrial Park, Loja 4', 'ACTIVE', datetime('now'), datetime('now'), 1),
(7, 'Moto Master GCL', 'Rua das Motos, 10', 'ACTIVE', datetime('now'), datetime('now'), 1),
(8, 'Oficina do Povo', 'Bairro Operário, S/N', 'ACTIVE', datetime('now'), datetime('now'), 1),
(9, 'Elite Auto Repair', 'Shopping Center, P1', 'ACTIVE', datetime('now'), datetime('now'), 1),
(10, 'Mecânica Rápida', 'Posto BR Central', 'ACTIVE', datetime('now'), datetime('now'), 1),
(11, 'Auto Check-up', 'Av. Brasil, 500', 'ACTIVE', datetime('now'), datetime('now'), 1),
(12, 'Oficina do Zé', 'Rua da Lama, 20', 'ACTIVE', datetime('now'), datetime('now'), 1),
(13, 'Grand Prix Service', 'Av. Automobilista, 99', 'ACTIVE', datetime('now'), datetime('now'), 1),
(14, 'Moto Tech', 'Rua Eletrônica, 15', 'ACTIVE', datetime('now'), datetime('now'), 1),
(15, 'Oficina 24 Horas', 'Rodovia KM 12', 'ACTIVE', datetime('now'), datetime('now'), 1),
(16, 'Ponto da Manutenção', 'Rua de Baixo, 44', 'ACTIVE', datetime('now'), datetime('now'), 1),
(17, 'Auto Sul', 'Av. Sul, 202', 'ACTIVE', datetime('now'), datetime('now'), 1),
(18, 'Mecânica Norte', 'Av. Norte, 303', 'ACTIVE', datetime('now'), datetime('now'), 1),
(19, 'Garagem do Futuro', 'Rua High-Tech, 1', 'ACTIVE', datetime('now'), datetime('now'), 1),
(20, 'Oficina do Bairro', 'Rua Amizade, 12', 'ACTIVE', datetime('now'), datetime('now'), 1);

-- 2. Modelos de Veículos (Vehicle Models) - 20 registros
INSERT INTO vehicle_models (id, name, brand, image_url, status, created_at, updated_at, dirty) VALUES
(1, 'CG 160 Titan', 'Honda', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(2, 'NMAX 160', 'Yamaha', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(3, 'Bros 160', 'Honda', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(4, 'PCX 150', 'Honda', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(5, 'FZ25 Fazer', 'Yamaha', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(6, 'XRE 300', 'Honda', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(7, 'Lander 250', 'Yamaha', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(8, 'Factor 150', 'Yamaha', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(9, 'Biz 125', 'Honda', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(10, 'Pop 110i', 'Honda', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(11, 'Crosser 150', 'Yamaha', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(12, 'MT-03', 'Yamaha', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(13, 'CB 500X', 'Honda', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(14, 'Versys 300', 'Kawasaki', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(15, 'Ninja 400', 'Kawasaki', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(16, 'Tiger 900', 'Triumph', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(17, 'G 310 GS', 'BMW', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(18, 'Scrambler 400X', 'Triumph', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(19, 'R 1250 GS', 'BMW', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1),
(20, 'Himalayan 411', 'Royal Enfield', NULL, 'ACTIVE', datetime('now'), datetime('now'), 1);

-- 3. Clientes (Customers) - 20 registros (vinculados ao userId 1)
INSERT INTO customers (id, user_id, name, phone, cpf, active_contract, balance_due, last_payment_date, created_at, updated_at, dirty) VALUES
(1, 1, 'João Silva', '(11) 98888-7777', '123.456.789-00', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
(2, 1, 'Maria Oliveira', '(11) 97777-6666', '234.567.890-11', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
(3, 1, 'Pedro Santos', '(21) 96666-5555', '345.678.901-22', 0, 150.00, NULL, datetime('now'), datetime('now'), 1),
(4, 1, 'Ana Souza', '(31) 95555-4444', '456.789.012-33', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
(5, 1, 'Carlos Lima', '(41) 94444-3333', '567.890.123-44', 0, 0, NULL, datetime('now'), datetime('now'), 1),
(6, 1, 'Fernanda Rocha', '(51) 93333-2222', '678.901.234-55', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
(7, 1, 'Ricardo Alves', '(61) 92222-1111', '789.012.345-66', 1, 45.50, datetime('now'), datetime('now'), datetime('now'), 1),
(8, 1, 'Juliana Costa', '(71) 91111-0000', '890.123.456-77', 0, 0, NULL, datetime('now'), datetime('now'), 1),
(9, 1, 'Roberto Garcia', '(81) 90000-9999', '901.234.567-88', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
(10, 1, 'Camila Martins', '(91) 89999-8888', '012.345.678-99', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
(11, 1, 'Bruno Ferreira', '(11) 88888-7777', '111.222.333-44', 0, 200.00, NULL, datetime('now'), datetime('now'), 1),
(12, 1, 'Amanda Lima', '(22) 87777-6666', '222.333.444-55', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
(13, 1, 'Lucas Pires', '(33) 86666-5555', '333.444.555-66', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
(14, 1, 'Patrícia Gomes', '(44) 85555-4444', '444.555.666-77', 0, 0, NULL, datetime('now'), datetime('now'), 1),
(15, 1, 'Gabriel Souza', '(55) 84444-3333', '555.666.777-88', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
(16, 1, 'Bárbara Silva', '(66) 83333-2222', '666.777.888-99', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
(17, 1, 'Rodrigo Melo', '(77) 82222-1111', '777.888.999-00', 0, 500.00, NULL, datetime('now'), datetime('now'), 1),
(18, 1, 'Tatiana Dias', '(88) 81111-0000', '888.999.000-11', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
(19, 1, 'Hugo Ramos', '(99) 80000-9999', '999.000.111-22', 1, 0, datetime('now'), datetime('now'), datetime('now'), 1),
(20, 1, 'Vanessa Luz', '(11) 79999-8888', '000.111.222-33', 0, 0, NULL, datetime('now'), datetime('now'), 1);

-- 4. Veículos (Vehicles) - 20 registros
-- Status IDs esperados: 1=available, 2=rented, 3=maintenance, 4=unavailable
INSERT INTO vehicles (id, plate, model_id, year, status_id, mileage, current_renter_id, default_monthly_rate, created_at, updated_at, dirty) VALUES
(1, 'ABC-1234', 1, 2023, 1, 5000, NULL, 550.00, datetime('now'), datetime('now'), 1),
(2, 'DEF-5678', 2, 2024, 2, 1200, 1, 750.00, datetime('now'), datetime('now'), 1),
(3, 'GHI-9012', 3, 2022, 1, 15000, NULL, 600.00, datetime('now'), datetime('now'), 1),
(4, 'JKL-3456', 1, 2023, 3, 8000, NULL, 550.00, datetime('now'), datetime('now'), 1),
(5, 'MNO-7890', 4, 2024, 2, 500, 2, 800.00, datetime('now'), datetime('now'), 1),
(6, 'PQR-1122', 5, 2021, 1, 25000, NULL, 700.00, datetime('now'), datetime('now'), 1),
(7, 'STU-3344', 2, 2023, 1, 4500, NULL, 750.00, datetime('now'), datetime('now'), 1),
(8, 'VWX-5566', 6, 2022, 2, 12000, 4, 950.00, datetime('now'), datetime('now'), 1),
(9, 'YZA-7788', 7, 2023, 1, 6000, NULL, 850.00, datetime('now'), datetime('now'), 1),
(10, 'BBB-9900', 8, 2020, 4, 35000, NULL, 450.00, datetime('now'), datetime('now'), 1),
(11, 'CCC-1212', 1, 2024, 1, 100, NULL, 550.00, datetime('now'), datetime('now'), 1),
(12, 'DDD-3434', 9, 2023, 2, 3500, 6, 400.00, datetime('now'), datetime('now'), 1),
(13, 'EEE-5656', 10, 2022, 1, 12000, NULL, 300.00, datetime('now'), datetime('now'), 1),
(14, 'FFF-7878', 11, 2023, 3, 9500, NULL, 650.00, datetime('now'), datetime('now'), 1),
(15, 'GGG-9090', 12, 2024, 1, 50, NULL, 1200.00, datetime('now'), datetime('now'), 1),
(16, 'HHH-1111', 13, 2023, 2, 7800, 7, 1800.00, datetime('now'), datetime('now'), 1),
(17, 'III-2222', 17, 2024, 1, 200, NULL, 1500.00, datetime('now'), datetime('now'), 1),
(18, 'JJJ-3333', 20, 2022, 3, 15000, NULL, 1100.00, datetime('now'), datetime('now'), 1),
(19, 'KKK-4444', 18, 2024, 2, 1500, 9, 1400.00, datetime('now'), datetime('now'), 1),
(20, 'LLL-5555', 19, 2023, 1, 5000, NULL, 2500.00, datetime('now'), datetime('now'), 1);

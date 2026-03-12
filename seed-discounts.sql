-- Deneme indirim anlaşmaları
INSERT INTO employee_discounts (id, company_name, category, discount_rate, description, contact_info, is_active, created_at, updated_at) VALUES
(gen_random_uuid()::text, 'Tavuk Dünyası', 'Gıda', 15, 'Tüm menülerde %15 indirim. Şantiye kimlik kartı gösterilmelidir.', '0850 222 0 444', true, NOW(), NOW()),
(gen_random_uuid()::text, 'Gloria Jeans Coffees', 'Gıda', 20, 'Tüm içeceklerde %20 indirim. Geçerli şubeler için iletişime geçiniz.', 'info@gloriajeanscoffees.com.tr', true, NOW(), NOW()),
(gen_random_uuid()::text, 'DS Damat', 'Giyim', 25, 'Takım elbise ve gömleklerde %25 indirim. Online ve mağazada geçerlidir.', '0212 331 00 00', true, NOW(), NOW()),
(gen_random_uuid()::text, 'Beymen', 'Giyim', 10, 'Seçili markalarda %10 indirim. Beymen Club üyeliği ile birlikte geçerlidir.', 'musteri@beymen.com', true, NOW(), NOW()),
(gen_random_uuid()::text, 'Big Chefs', 'Gıda', 20, 'Hafta içi öğle menülerinde %20 indirim. Tüm şubelerde geçerlidir.', '0212 999 00 00', true, NOW(), NOW());

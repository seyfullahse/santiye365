SET client_encoding TO 'UTF8';

INSERT INTO employee_discounts (id, company_name, category, discount_rate, description, contact_info, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Tavuk Dunyasi', 'Gida', 15, 'Tum menulerde %15 indirim. Santiye kimlik karti gosterilmelidir.', '0850 222 0 444', true, NOW(), NOW()),
  (gen_random_uuid(), 'Gloria Jeans Coffees', 'Gida', 20, 'Tum iceceklerde %20 indirim. Gecerli subeler icin iletisime geciniz.', 'info@gloriajeanscoffees.com.tr', true, NOW(), NOW()),
  (gen_random_uuid(), 'DS Damat', 'Giyim', 25, 'Takim elbise ve gomleklerde %25 indirim. Online ve magazada gecerlidir.', '0212 331 00 00', true, NOW(), NOW()),
  (gen_random_uuid(), 'Beymen', 'Giyim', 10, 'Secili markalarda %10 indirim. Beymen Club uyeligi ile birlikte gecerlidir.', 'musteri@beymen.com', true, NOW(), NOW()),
  (gen_random_uuid(), 'Big Chefs', 'Gida', 20, 'Hafta ici ogle menulerde %20 indirim. Tum subelerde gecerlidir.', '0212 999 00 00', true, NOW(), NOW());

-- Bağlanmış kullanıcıların worker durumu
SELECT u.name, u.email, u.role, u.employee_id,
       w.id as worker_id, w.first_name as w_name, w.last_name as w_surname
FROM users u
LEFT JOIN workers w ON w.employee_id = u.employee_id
WHERE u.employee_id IS NOT NULL
ORDER BY u.name;

-- Bağlantısız employee'ler (worker'ı olmayan)
SELECT e.id, e.first_name, e.last_name, e.email, e.employee_no
FROM employees e
LEFT JOIN workers w ON w.employee_id = e.id
WHERE w.id IS NULL
ORDER BY e.first_name;

-- Tüm employee sayısı vs worker-bağlantılı employee sayısı
SELECT
  (SELECT COUNT(*) FROM employees) as total_employees,
  (SELECT COUNT(*) FROM workers WHERE employee_id IS NOT NULL) as linked_workers,
  (SELECT COUNT(*) FROM workers WHERE employee_id IS NULL) as unlinked_workers,
  (SELECT COUNT(*) FROM users WHERE employee_id IS NOT NULL) as linked_users,
  (SELECT COUNT(*) FROM users WHERE employee_id IS NULL) as unlinked_users;

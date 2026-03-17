-- Worker-Employee bağlantısı kontrolü
SELECT w.id as worker_id, w.first_name, w.last_name, w.employee_id, w.team_id,
       e.id as emp_id, e.first_name as emp_first, e.last_name as emp_last
FROM workers w
LEFT JOIN employees e ON w.employee_id = e.id
WHERE w.employee_id IS NOT NULL
LIMIT 20;

-- Employee'lerin listesi (top 15)
SELECT e.id, e.first_name, e.last_name, e.email, e.employee_no
FROM employees e
ORDER BY e.first_name
LIMIT 15;

-- Workers listesi (top 15)
SELECT w.id, w.first_name, w.last_name, w.employee_id, w.team_id, w.is_active
FROM workers w
ORDER BY w.first_name
LIMIT 15;

-- User'lar ve Email eşleşmesi ile Employee bulma
SELECT u.id as user_id, u.name, u.email, u.role, u.employee_id,
       e.id as matched_emp_id, e.first_name as emp_first, e.last_name as emp_last
FROM users u
LEFT JOIN employees e ON (
  LOWER(TRIM(e.email)) = LOWER(TRIM(u.email))
  OR LOWER(TRIM(e.first_name) || ' ' || TRIM(e.last_name)) = LOWER(TRIM(u.name))
)
WHERE u.employee_id IS NULL
ORDER BY u.name;

SELECT u.id, u.name, u.email, u.role, u.employee_id,
       e.id as emp_id, e.first_name, e.last_name
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
ORDER BY u.name
LIMIT 20;

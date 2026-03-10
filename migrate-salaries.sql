-- Migrate existing worker dailyRate/overtimeRate into WorkerSalary records
-- MAIN company workers: MONTHLY type, amount = dailyRate * 30
-- SUBCONTRACTOR workers: DAILY type, amount = dailyRate

INSERT INTO worker_salaries (id, worker_id, salary_type, amount, overtime_rate, effective_from, effective_to, note, created_at, updated_at)
SELECT
  'ws_' || substr(md5(random()::text), 1, 22) || substr(md5(w.id), 1, 3),
  w.id,
  (CASE WHEN c.type = 'MAIN' THEN 'MONTHLY' ELSE 'DAILY' END)::"SalaryType",
  CASE WHEN c.type = 'MAIN' THEN w.daily_rate * 30 ELSE w.daily_rate END,
  COALESCE(w.overtime_rate, 0),
  COALESCE(w.start_date, '2024-01-01'),
  NULL,
  'Mevcut ücretlerden aktarıldı',
  NOW(),
  NOW()
FROM workers w
JOIN teams t ON w.team_id = t.id
JOIN companies c ON t.company_id = c.id
WHERE w.is_active = true AND w.daily_rate IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM worker_salaries ws WHERE ws.worker_id = w.id);

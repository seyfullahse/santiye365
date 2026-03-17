-- Portal'dan oluşturulan izinler (worker_leaves)
SELECT wl.id, wl.worker_id, wl.type, wl.start_date, wl.end_date, wl.total_days, wl.status, wl.reason, wl.created_at,
       w.first_name, w.last_name
FROM worker_leaves wl
JOIN workers w ON w.id = wl.worker_id
ORDER BY wl.created_at DESC
LIMIT 10;

-- İK izin talepleri (leave_requests)
SELECT lr.id, lr.employee_id, lr.type, lr.start_date, lr.end_date, lr.total_days, lr.status, lr.created_at,
       e.first_name, e.last_name
FROM leave_requests lr
JOIN employees e ON e.id = lr.employee_id
ORDER BY lr.created_at DESC
LIMIT 10;

-- Sayılar
SELECT 'worker_leaves' as tablo, COUNT(*) as kayit FROM worker_leaves
UNION ALL
SELECT 'leave_requests', COUNT(*) FROM leave_requests;

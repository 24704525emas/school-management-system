const express = require('express');
const router = express.Router();

// Sample audit logs (in a real application, this might come from a database)
let auditLogs = [
    // Sample log objects
    { id: 1, action: 'CREATE', user: 'user1', timestamp: '2026-03-22T07:00:00Z' },
    { id: 2, action: 'DELETE', user: 'user2', timestamp: '2026-03-22T07:01:00Z' },
];

// Endpoint to retrieve audit logs
router.get('/audit/logs', (req, res) => {
    res.json(auditLogs);
});

// Endpoint to export audit logs as JSON
router.get('/audit/export', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.json');
    res.json(auditLogs);
});

module.exports = router;
const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'audit_logs.json');
let logEntries = [];

// Load existing logs if any
if (fs.existsSync(logFilePath)) {
    const existingLogs = fs.readFileSync(logFilePath);
    logEntries = JSON.parse(existingLogs);
}

// Middleware function
const auditLoggingMiddleware = (req, res, next) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        userId: req.user.id, // Assuming user ID is stored in `req.user.id`
        username: req.user.username, // Assuming username is stored in `req.user.username`
        role: req.user.role, // Assuming user role is stored in `req.user.role`
        ipAddress: req.ip,
        httpMethod: req.method,
        endpoint: req.originalUrl,
        statusCode: res.statusCode,
    };

    logEntries.push(logEntry);

    if (logEntries.length >= 10000) {
        rotateLogs();
    }

    next();
};

// Function to save logs to a JSON file with error handling
const logAudit = () => {
    fs.writeFile(logFilePath, JSON.stringify(logEntries, null, 2), (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
}

// Function to rotate logs
const rotateLogs = () => {
    const oldLogPath = path.join(__dirname, `audit_logs_${Date.now()}.json`);
    fs.renameSync(logFilePath, oldLogPath);
    logEntries = [];
    logAudit(); // Save new entries to a new log file
};

module.exports = {
    auditLoggingMiddleware,
    logAudit
};

'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- DB helpers ---
function readDB() {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function generateId() {
    return Date.now();
}

// --- Auth ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    const db = readDB();
    const user = db.users.find(u => u.username === username && u.password === password);
    if (user) {
        return res.json({ success: true, user: { username: user.username, role: user.role, display: user.display } });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// --- School settings ---
app.get('/api/school', (req, res) => {
    const db = readDB();
    res.json(db.school);
});

app.put('/api/school', (req, res) => {
    const db = readDB();
    db.school = { ...db.school, ...req.body };
    writeDB(db);
    res.json(db.school);
});

// --- Meta settings ---
app.get('/api/meta', (req, res) => {
    const db = readDB();
    res.json(db.meta);
});

app.put('/api/meta', (req, res) => {
    const db = readDB();
    db.meta = { ...db.meta, ...req.body };
    writeDB(db);
    res.json(db.meta);
});

// --- Audit log ---
app.get('/api/auditLog', (req, res) => {
    const db = readDB();
    res.json(db.auditLog || []);
});

app.post('/api/auditLog', (req, res) => {
    const db = readDB();
    if (!db.auditLog) db.auditLog = [];
    const entry = { id: generateId(), ...req.body, when: new Date().toLocaleString() };
    db.auditLog.push(entry);
    writeDB(db);
    res.status(201).json(entry);
});

// --- Generic CRUD for array-based collections ---
const COLLECTIONS = [
    'students', 'teachers', 'assets', 'incomes', 'expenses', 'budgets',
    'fees', 'staff', 'audits', 'inspectorate', 'districts', 'links',
    'attendance', 'cashbook', 'approvals'
];

app.get('/api/:entity', (req, res) => {
    const { entity } = req.params;
    if (!COLLECTIONS.includes(entity)) {
        return res.status(404).json({ message: 'Unknown entity' });
    }
    const db = readDB();
    res.json(db[entity] || []);
});

app.post('/api/:entity', (req, res) => {
    const { entity } = req.params;
    if (!COLLECTIONS.includes(entity)) {
        return res.status(404).json({ message: 'Unknown entity' });
    }
    const db = readDB();
    if (!db[entity]) db[entity] = [];
    const newItem = { id: generateId(), ...req.body };
    db[entity].push(newItem);
    writeDB(db);
    res.status(201).json(newItem);
});

app.put('/api/:entity/:id', (req, res) => {
    const { entity, id } = req.params;
    if (!COLLECTIONS.includes(entity)) {
        return res.status(404).json({ message: 'Unknown entity' });
    }
    const db = readDB();
    if (!db[entity]) return res.status(404).json({ message: 'Not found' });
    const idx = db[entity].findIndex(item => String(item.id) === String(id));
    if (idx === -1) return res.status(404).json({ message: 'Item not found' });
    db[entity][idx] = { ...db[entity][idx], ...req.body, id: db[entity][idx].id };
    writeDB(db);
    res.json(db[entity][idx]);
});

app.delete('/api/:entity/:id', (req, res) => {
    const { entity, id } = req.params;
    if (!COLLECTIONS.includes(entity)) {
        return res.status(404).json({ message: 'Unknown entity' });
    }
    const db = readDB();
    if (!db[entity]) return res.status(404).json({ message: 'Not found' });
    const before = db[entity].length;
    db[entity] = db[entity].filter(item => String(item.id) !== String(id));
    if (db[entity].length === before) return res.status(404).json({ message: 'Item not found' });
    writeDB(db);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`EduFinance PNG server running at http://localhost:${PORT}`);
});

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const config = require('config');
const https = require('https');
const fs = require('fs');

const app = express();

// HANDLE CORS
app.use(express.json({ extended: false }));
app.options('*', cors());
app.use(cors());

// HANDLE HSTS
app.use(require('helmet')());

// ALLOW STATIC CONTENT
app.use(express.static('static'));

// ROUTES
app.get('/', (req, res) => res.send('API Running'));
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/accounts', require('./routes/api/accounts'));
app.use('/api/assets', require('./routes/api/assets'));
app.use('/api/budgetcategories', require('./routes/api/budgetCategories'));
app.use('/api/expenditures', require('./routes/api/expenditures'));
app.use('/api/income', require('./routes/api/income'));
app.use('/api/liabilities', require('./routes/api/liabilities'));
app.use('/api/transactions', require('./routes/api/transactions'));

connectDB();

const port = process.env.NODE_ENV === 'production' ? 80 : 7001;
app.listen(port, () => console.log(`Server running on port ${port}.`));

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const organisationRoutes = require('./routes/organisation');
const userRoutes = require('./routes/user');
const app = express();

const cors = require('cors');

// adding support for cross-origin
app.use(cors());
app.options('*', cors());


// app.use(bodyParser.json());

app.use(bodyParser.json({ limit: '50mb' })); // support json encoded bodies
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 1000000 })); 
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/api/organisations', organisationRoutes);
app.use('/api/users', userRoutes);

module.exports = app;
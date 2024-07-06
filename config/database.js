const { Sequelize } = require('sequelize');
const config = require('./config')
const { Pool } = require('pg');

// const sequelize = new Sequelize(config.DATABASE_URL) // Example for postgres
const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: 'localhost',
    dialect: 'postgres', // or 'mysql', 'sqlite', etc.
});

const pool = new Pool({
    user: config.username,
    host: 'localhost',
    database: config.database,
    password: config.password,
    port: 5432,
});
  

module.exports = {sequelize, pool}
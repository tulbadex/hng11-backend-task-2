require('dotenv').config();
module.exports = {
    database: 'stage_2_dev',
    username: 'postgres',
    password: 'password',
    host: 'localhost',
    dialect: 'postgres',
    secret: 'your_jwt_secret_key', // Replace with a secure key
    DATABASE_URL: process.env.APP_ENV == 'test' ? 'postgres://postgres:password@localhost:5432/stage_2_dev' : 'postgres://postgres:password@localhost:5432/stage_2_dev'
};
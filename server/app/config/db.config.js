require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

module.exports = {
  HOST: process.env.DB_HOST,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD,
  PORT: Number(process.env.DB_PORT) || 3306,
  DB: process.env.DB_NAME,
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 60000, // Increase wait time for a connection to 60s
    idle: 10000
  }
};

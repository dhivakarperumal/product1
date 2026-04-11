const mysql = require('mysql2/promise');
require('dotenv').config();
(async () => {
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
  const conn = await mysql.createConnection(config);
  try {
    const sql1 = `SELECT m.*, u.username, u.email FROM memberships m LEFT JOIN users u ON m.userId = u.id WHERE DATE(m.createdAt)=CURDATE() ORDER BY m.createdAt DESC`;
    const [rows1] = await conn.query(sql1);
    console.log('today rows count', rows1.length);
  } catch (err) {
    console.error('today error', err.code, err.sqlMessage || err.message);
  }
  try {
    const sql2 = `SELECT m.*, u.username, u.email FROM memberships m LEFT JOIN users u ON m.userId = u.id WHERE m.status='active' AND m.endDate >= CURDATE() AND m.endDate <= DATE_ADD(CURDATE(), INTERVAL 5 DAY) ORDER BY m.endDate ASC`;
    const [rows2] = await conn.query(sql2);
    console.log('expiring rows count', rows2.length);
  } catch (err) {
    console.error('expiring error', err.code, err.sqlMessage || err.message);
  }
  await conn.end();
})();

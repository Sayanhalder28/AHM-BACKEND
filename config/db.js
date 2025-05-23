const mysql = require("mysql2");
const fs = require("fs");
const startServerQueries = fs.readFileSync("db.sql", "utf8");

const pool = mysql
  .createPool({
    host: process.env.DB_Host,
    user: process.env.DB_User,
    password: process.env.DB_Password,
    port: process.env.DB_Port,
    database: "MY_AHM",
    // waitForConnections: true,
    connectionLimit: 100,
    multipleStatements: true,
    // queueLimit: 0,
    // idleTimeoutMillis: 30000,
  })
  .promise();

const DbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    try {
      const ping = await connection.ping();
      if (ping) {
        console.log("Database connection established");
        try {
          await connection.query(startServerQueries);
        } catch (error) {
          console.log("Error while checking databases\n", error);
          return false;
        }
        return true;
      } else {
        console.log("Database connection failed");
        return false;
      }
    } catch (error) {
      console.log("Failed to get the ping\n<Error Massage>\n", error.message);
      return false;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.log(
      "Failed to connect the database | Failed to get connection from the pool\n<Error Massage>\n",
      error.message
    );
    return false;
  }
};

module.exports = { pool, DbConnection };

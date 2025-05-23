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
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 5,
    multipleStatements: true,
    queueLimit: 10,
    idleTimeout: 30000,
  })
  .promise();

const DbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    try {
      const ping = await connection.ping();
      if (ping) {
        try {
          await connection.query(startServerQueries);
          console.log(
            "Schema Quaries Executed | connectionID :",
            connection.threadId
          );
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

// pool.on("connection", (connection) => {
//   console.log(
//     "Database connection established | connectionID :",
//     connection.threadId
//   );
// });

// pool.on("acquire", (connection) => {
//   console.log(
//     "Database connection acquired  | connectionID :",
//     connection.threadId
//   );
// });

// pool.on("release", (connection) => {
//   console.log(
//     "Database connection released | connectionID :",
//     connection.threadId
//   );
// });

// pool.on("enqueue", () => {
//   console.log("Waiting for available connection slot");
// });

// pool.on("error", (err) => {
//   console.error("Database connection error\n<Error Massage>\n", err.message);
// });

// process.on("beforeExit", async () => {
//   console.log("Closing the database connection pool");
//   if (pool) {
//     await pool.end((err) => {
//       if (err) {
//         console.log(
//           "Error while closing the database connection pool\n<Error Massage>\n",
//           err.message
//         );
//       } else {
//         console.log("Database connection pool closed");
//       }
//     });
//   }
// });


module.exports = { pool, DbConnection };

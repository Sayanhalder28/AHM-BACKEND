const pool = require("../config/db").pool;

const getUsersData = async (req, res, next) => {
  try {
    const [response] = await pool.query("SELECT * FROM users");
    res.success(200, "All users data fetched", response);
    res.error(400, "Error message");
    res.validation({ error: "error" });
  } catch (error) {
    next(error);
  }
};

const signUp = async (req, res, next) => {
  try {
    const { username, password, firstName, lastName, employeeId, phoneNumber } =
      req.body;
    if (
      !username ||
      !password ||
      !firstName ||
      !lastName ||
      !employeeId ||
      !phoneNumber
    )
      res.status(400).json({ error: "Input field missing." });
    else {
      const [insertDataResponse] = await pool.execute(
        "INSERT INTO users (username,password,first_name,last_name,employee_id,phone_number) VALUES (?,?,?,?,?,?);",
        [username, password, firstName, lastName, employeeId, phoneNumber]
      );
      res.status(200).json({ status: "success", data: insertDataResponse });
    }
  } catch (error) {
    next(error);
  }
};

const signIn = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Input field missing." });

    const [getDataResponse] = await pool.execute(
      "SELECT password FROM users WHERE username=(?)",
      [username]
    );

    if (getDataResponse.length > 0) {
      const matched = getDataResponse[0].password === password;
      if (!matched)
        res.status(400).json({ status: "error", message: "wrong password" });
      else
        res
          .status(200)
          .json({ status: "success", message: "password matched" });
    } else res.status(400).json({ status: "error", message: "user not found" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsersData, signUp, signIn };

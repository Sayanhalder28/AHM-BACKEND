const pool = require("../config/db").pool;
const bcrypt = require("bcryptjs");
const { generateToken } = require("../services/Authentication");

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
      //encrypting password
      const salt = await bcrypt.genSalt(10);
      const encryptedPassWord = await bcrypt.hash(req.body.password, salt);
      //inserting data into database
      const [insertDataResponse] = await pool.execute(
        "INSERT INTO users (username,password,first_name,last_name,employee_id,phone_number) VALUES (?,?,?,?,?,?);",
        [
          username,
          encryptedPassWord,
          firstName,
          lastName,
          employeeId,
          phoneNumber,
        ]
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
    if (!username || !password) return res.error(400, "Input field missing");

    const [userDataResponse] = await pool.execute(
      "SELECT * FROM users WHERE username=(?)",
      [username]
    );

    if (userDataResponse.length > 0) {
      const passwordCompare = await bcrypt.compare(
        password,
        userDataResponse[0].password
      );
      if (!passwordCompare) {
        return res.validation({ massage: "Password does not match" });
      } else {
        const data = {
          user: {
            id: userDataResponse[0].username,
          },
        };

        const authToken = generateToken(data);
        
        //set token to the response cookie
        res.cookie("token", authToken, {
          httpOnly: true,
          // secure: true,
          // sameSite: "none",
          // maxAge: 1000 * 60 * 60 * 24,
        });

        res.success(200, "Sign in granted. Session token is set succesfully", {
          profile: {
            token: authToken,
            userName: userDataResponse[0].username, //username or email
            firstName: userDataResponse[0].first_name,
            lastName: userDataResponse[0].last_name,
            employeeId: userDataResponse[0].employee_id,
            phone: userDataResponse[0].phone_number,
          },
          access: {
            role: "admin",
            permissions: {
              canViewClients: true,
              canViewAssets: true,
              xyz: true,
            },
          },
        });
      }
    } else res.validation({ massage: "Invalide User" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsersData, signUp, signIn };

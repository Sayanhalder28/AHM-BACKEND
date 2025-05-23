const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d", //or 60, "2 days", "10h", "7d"
  });
};

const verifyToken = (req, res, next) => {
  if (req.headers) {
    console.log(req.headers);
    next();
  } else {
    console.log("nei token");
    return res.validation({ massage: "validation failed" });
  }
  //     next();
  //   if (req.headers.authorization) {
  //     console.log(req.headers.authorization);
  //     const token = req.headers.authorization.split(" ")[1];

  //     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
  //       if (err) {
  //         res.validation(err);
  //       } else {
  //         req.user = user;
  //         next();
  //       }
  //     });
  //   } else {
  //     res.validation();
  //   }
};

module.exports = { generateToken, verifyToken };

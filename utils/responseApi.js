/**
 * @desc    This file contain Success and Error response for sending to client / user
 * @author  sayan halder
 * @since   13/10/2023
 */

//user manual
  // res.success(statusCode, massage, data);
  // res.error(statusCode, massage, data);
  // res.validation(errors, data);
//example
  // res.success(200, "All users data fetched", {data:"data"}});
  // res.error(400, "Error message");
  // res.validation({ error: "error" });

module.exports = (req, res, next) => {
  res.success = (statusCode, message, data) => {
    return res.status(statusCode).json({
      status: "success",
      code: statusCode,
      message,
      error: false,
      data,
    });
  };

  res.error = (statusCode, message, data) => {
    const codes = [200, 201, 400, 401, 404, 403, 422, 500];
    const findCode = codes.find((code) => code == statusCode);
    if (!findCode) statusCode = 500;
    else statusCode = findCode;

    return res.status(statusCode).json({
      status: "error",
      code: statusCode,
      message,
      error: true,
      data,
    });
  };

  res.validation = (errors,data) => {
    return res.status(422).json({
      status: "unauthorized",
      code: 422,
      message: "Validation errors",
      error: true,
      errors,
      data,
    });
  };

  next();
};

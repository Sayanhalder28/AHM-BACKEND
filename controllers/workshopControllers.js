const pool = require("../config/db").pool;

const registerWorkshop = async (req, res, next) => {
  try {
    const {
      workshop_code,
      workshop_name,
      workshop_address,
      workshop_description,
    } = req.body;
    if (
      !workshop_code ||
      !workshop_name ||
      !workshop_address ||
      !workshop_description
    )
      return res.status(400).json({ massage: "missing data" });

    const workshop_id = `WP-${workshop_code}`;

    //check workshop_code exixtance in database
    try {
      const [workshopCodeCheckResponse] = await pool.execute(
        "SELECT workshop_id FROM workshops WHERE workshop_id = ?;",
        [workshop_id]
      );
      if (workshopCodeCheckResponse.length)
        return res.status(400).json({ massage: "Workshop already exists" });
    } catch (error) {
      return res
        .status(500)
        .json({ massage: "internal error checking the workshop code" });
    }

    try {
      const [workshopInsertResponse] = await pool.execute(
        "INSERT INTO workshops (workshop_id, workshop_name, workshop_address, workshop_description) VALUES (?,?,?,?);",
        [workshop_id, workshop_name, workshop_address, workshop_description]
      );
      return res.status(200).json({ status: "success" });
    } catch (error) {
      return res.status(500).json({
        status: "internal error resgistering the form data",
        massage: error,
      });
    }
  } catch (error) {
    next(error);
  }
};

const WorkshopList = async (req, res, next) => {
  try {
    const [workshopListResponse] = await pool.execute(
      "SELECT * FROM workshops;"
    );
    return res.success(200, "All listed workshops", workshopListResponse);
  } catch (error) {
    next(error);
  }
};

module.exports = { WorkshopList, registerWorkshop };

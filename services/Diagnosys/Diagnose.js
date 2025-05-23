const { spawn } = require("child_process");

exports.diagnose = (req, res) => {

  

  var dataToSend = [];
  let isError = false;

  const pyProcess = spawn(
    "python",
    [
      "./process/predict.py", // Executing the python script
      -0.019892, //input values
      -0.056907, //input values
      0.045682,  //input values
      0.028208,  //input values
      -0.132476, //input values
      -0.195011, //input values
      0.001628,  //input values
    ],
    {
      cwd: __dirname,
    }
  );

  pyProcess.stdout.on("data", function (data) {
    dataToSend.push(data.toString());
    isError = false;
  });

  pyProcess.stderr.on("data", (data) => {
    dataToSend.push(data.toString());
    isError = true;
  });

  pyProcess.on("close", (code) => {
    if (isError) {
      res.error(500, "Error occurred", dataToSend);
    } else res.success(200, "Process completed", dataToSend);
  });
};

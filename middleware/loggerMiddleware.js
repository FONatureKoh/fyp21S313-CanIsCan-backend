// Required libraries
const chalk = require('chalk');
const datetime_T = require('date-and-time');

// Get runtime taken method
const getActualRequestDurationInMilliseconds = start => {
  const NS_PER_SEC = 1e9; // constant to convert to nanoseconds
  const NS_TO_MS = 1e6; // constant to convert to milliseconds
  const diff = process.hrtime(start);

  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

module.exports = function consoleLogger (req, res, next) {
  // Logger line variables
  let current_datetime = new Date();
  let formatted_date = datetime_T.format(current_datetime, 'YYYY-MM-DD HH:mm:ss');
  let method = req.method;
  let url = req.url;
  let status = res.statusCode;

  const start = process.hrtime();
  const durationInMilliseconds = getActualRequestDurationInMilliseconds(start);

  let log = `[${chalk.green(
    formatted_date
  )}] ${method}:${url} ${status} ${chalk.red(
    durationInMilliseconds.toLocaleString() + "ms"
  )}`;
  console.log(log);

  next();

  // Saves to file if necessary
  // fs.appendFile("request_logs.txt", log + "\n", err => {
  //   if (err) {
  //     console.log(err);
  //   }
  // });
};
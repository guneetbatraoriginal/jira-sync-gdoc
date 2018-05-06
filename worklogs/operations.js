const fs = require('fs');
const today = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate();
const file = __dirname + '/' + `${today}.json`;

var clean = () => {
  fs.writeFileSync(file, '');
}

var saveWorkLog = (worklog) => {
  var worklogs = fetchWorkLogs();
  worklogs.push(worklog);
  fs.writeFileSync(file, JSON.stringify(worklogs));
}

var fetchWorkLogs = () => {
  try{
    return JSON.parse(fs.readFileSync(file));
  }catch(e){
    return [];
  }
};

module.exports = {
  saveWorkLog,
  fetchWorkLogs,
  clean
}

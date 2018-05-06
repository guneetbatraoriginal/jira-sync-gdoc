const fs = require('fs');
const jiraApi = require('./jira/jira-access');
const worklog = require('./worklogs/operations');
const googleApi = require('./google/google-sheets-api');

const prompt = require('prompt');


var schema = {
    properties: {
      'jira-username': {
        required: true
      },
      'jira-password': {
        required: true,
        hidden: true
      }
    }
  };
prompt.start();
prompt.get(schema, (err, result) => {
  const auth = {
    user: result['jira-username'],
    pass: result['jira-password']
  };
  worklog.clean();
  jiraApi.findIssues(auth,(err,issues) => {
    if(err){
      return console.log(err);
    }
    issues.forEach((issue) => {
      jiraApi.getLoggedSeconds(auth, issue, (err,seconds) => {
        if(err){
          return console.log(err);
        }
        worklog.saveWorkLog([issue.key,'',issue.fields.summary,secondsToHm(seconds)])
      });
    });
    if(issues.length){
      console.log(`Found ${issues.length} issue(s).`);
      googleApi.authorize((err, auth)=>{
        if(err){
          return console.log(err);
        }
        googleApi.logWorkToSheet(auth);
      })
    }else{
      console.log('No issue(s) found. Better luck next time.')
    }
  })
})

var secondsToHm = (d) => {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour " : " hours ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute" : " minutes") : "";
    return hDisplay + mDisplay;
}

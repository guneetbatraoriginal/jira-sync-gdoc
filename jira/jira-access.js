const request = require('request');
const fs = require('fs');
const url = 'https://mhwconsulting.atlassian.net';
const jql = 'assignee = currentUser() AND worklogDate = now()';
const today = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate();
const badError = 'Unable to login to JIRA. Please check your internet connectivity.';

var findIssues = (auth,callback) => {
  request({
    url : url + '/rest/api/2/search?jql=' + encodeURIComponent(jql),
    method : 'GET',
    json: true,
    auth
  },(err,response)=>{
    if(err){
      callback(badError);
    }else if (response.statusCode == 401){
      callback('Invalid login access to JIRA. Please try again with valid credentials.');
    }else{
      callback(undefined,response.body.issues);
    }
  })
}

var getLoggedSeconds = (auth,issue,callback) => {
  request({
      url : url + '/rest/api/2/issue/' + issue.key + '/worklog',
      method : 'GET',
      json: true,
      auth
    }, (err,response) => {
      if(err){
        callback(badError)
      }else{
        var seconds = 0;
        response.body.worklogs.forEach((worklog) => {
          var created = new Date(worklog.created);
          created = created.getFullYear() + '-' + (created.getMonth() + 1) + '-' + created.getDate();
          if(created == today){
            seconds = seconds + worklog.timeSpentSeconds;
          }
        })
        callback(undefined,seconds);
      }
    })
}

module.exports = {
  getLoggedSeconds,
  findIssues
}

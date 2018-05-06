const fs = require('fs');
const {google} = require('googleapis');
const OAuth2Client = google.auth.OAuth2;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = __dirname + '/' + 'credentials.json';
const opener = require('opener');
const http = require('http');
const url = require('url');
const worklog = require('../worklogs/operations');
const today = (new Date().getMonth() + 1) + '/' + new Date().getDate() + '/' + new Date().getFullYear();

var readCredentials = () => {
  return JSON.parse(fs.readFileSync(__dirname + '/' + 'client_secret.json'));
}

function authorize(callback) {
  const {client_secret, client_id, redirect_uris} = readCredentials().web;
  const oAuth2Client = new OAuth2Client(client_id, client_secret,redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(undefined, oAuth2Client);
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Please authorize me to access your data. I will patiently wait till then....');
  var server = http.createServer((req,res)=>{
    var query = url.parse(req.url,true).query;
    if(query.code == undefined){
      return res.end();
    }
    res.end();
    server.close();
    oAuth2Client.getToken(query.code.toString(), (err, token) => {
      if (err) return callback('The API returned an error: ' + err);
      oAuth2Client.setCredentials(token);
      //fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
      console.log('Thank you for trusting me with your data. Expect no foulplay.');
      callback(undefined, oAuth2Client);
    });
  }).listen(8080);
  opener(authUrl);
}

function gatherRange(auth, callback) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '1bRC4RM6kMPmlwiRT1xn4Pk9hFgVcXo6vly70EtHI3OI',
    majorDimension: 'ROWS',
    range: 'Guneet!F:F',
  }, (err, response) => {
    if (err) return callback('The API returned an error: ' + err);
    const rows = response.data.values;
    if (rows.length) {
      var start = 0;
      var end = 0;
      var flag = false;
      for(var row = 0;row <= rows.length;row++){
        if(rows[row] == today && !flag){
          start = row + 1;
          flag = true;
        }
        if(flag && rows[row] != today){
          end = row;
          break;
        }
      }
      callback(undefined,`Guneet!B${start}:E${end}`);
    } else {
      callback('No data found.');
    }
  });
}

function logWorkToSheet(auth){
  gatherRange(auth, (err,range) => {
    if(err){
      return console.log(err);
    }
    const sheets = google.sheets({version: 'v4', auth});
    var request = {
      spreadsheetId: '1bRC4RM6kMPmlwiRT1xn4Pk9hFgVcXo6vly70EtHI3OI',
      range,
      valueInputOption: 'USER_ENTERED',
      resource:{
        values: worklog.fetchWorkLogs()
      }
    }
    sheets.spreadsheets.values.update(request, function(err, response) {
      if (err) {
        return console.error(err);
      }
      console.log(response);
    });
  });
}

module.exports = {
    authorize,
    logWorkToSheet
}

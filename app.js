
const express = require('express')
const AWS = require('aws-sdk');
const app = express();

const port = process.env.PORT || 8081;

AWS.config.update({ //make config
  region: 'us-east-1' 
});
const ddb = new AWS.DynamoDB();

require('./app/routes')(app, ddb);
app.listen(port, () => {
  console.log('We are live on ' + port);
});

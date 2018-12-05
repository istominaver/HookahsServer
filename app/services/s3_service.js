const AWS = require('aws-sdk');
const s3 = new AWS.S3();

//module.exports = function(tableId, method, params, res, callback) {
  
 var params = {
  Body: 'test.jpg', 
  Bucket: "smoke-app", 
  Key: "exampleobject.jpg"
 };

 s3.putObject(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else     console.log(data); });
//}

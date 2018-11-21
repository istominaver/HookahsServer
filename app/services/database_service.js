const AWS = require('aws-sdk');

AWS.config.update({ //make config
  region: 'us-east-1' 
});
const ddb = new AWS.DynamoDB();

function objectUnpack(item) { //make like library or module
            var tempObj = {};
            for(var k in item) {
              if(!k) { tempObj = item } 
              else {
                if(typeof item[k] == "object"){
                  if(k.length == 1) {tempObj = objectUnpack(item[k])}
                  else {
                    for(var k1 in item[k]) {
                      if(!k1) { tempObj =  item[k] } //?
                      else {
                        if (typeof item[k][k1] == "object") {
                          if (item[k][k1].length) {
                            tempObj[k] = item[k][k1].map(function(item) { return objectUnpack(item); });
                          }
                          else {
                            tempObj [k] = objectUnpack(item[k][k1]);
                          }
                        } 
                        else if (k1 == "N" && k == "price") {tempObj[k] = parseFloat(parseFloat(item[k][k1]).toFixed(2))}
                        else if (k1 == "N" && k == "likes") {tempObj[k] = parseInt(item[k][k1]);}
                        else {tempObj[k] = item[k][k1];}
                      }
                    }
                  }
                }
                else {
                  return item[k];
                }
              }
            }
            return tempObj;
          }

module.exports = function(method, params, res, callback) {
  if(method == 'scan') {
    ddb.scan(params, function(err, data) {
      if (err) callback([],err);
      else {
          resultArray = data.Items.map(function(item) { return objectUnpack(item); });
          callback(resultArray);
      };
  });
  } 
  else if (method == 'getItem') {
    ddb.getItem(params, function(err, data) { 
      if (err) callback({},err);
      else if (Object.keys(data).length == 0) {
        console.log(data);
        const err = "Нет данных по указанному заведению";
        callback({},err);
      }
      else  {
        resultObject = objectUnpack(data.Item); 
        callback(resultObject);
      }
    });
  }
  else if (method == 'putItem') {
    ddb.putItem(params, function(err, data) { 
      if (err) callback("ok",err);
      else callback();
    });
  }
  else if (method == 'updateItem') {
    ddb.updateItem(params, function(err, data) { 
      if (err) callback("ok",err);
      else callback();
    });
  }
}





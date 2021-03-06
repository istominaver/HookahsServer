const AWS = require('aws-sdk');

AWS.config.update({ //make config
  region: 'eu-central-1' 
});
const ddb = new AWS.DynamoDB();

const tableNames = {
  'restaurants' : 'Restaurants',
  'orders':'Orders',
  'mixes':'Mixes',
  'hookahMasters':'HookahMasters',
  'categories':'Categories',
  'clients': 'Clients'
};

function objectUnpack(item) { 
            var tempObj = {};
            for(var k in item) {
              if(!k) { tempObj = item; } 
              else {
                if(typeof item[k] == "object"){
                  if(k.length == 1) {tempObj = objectUnpack(item[k]);}
                  else {
                    for(var k1 in item[k]) {
                      if(!k1) { tempObj =  item[k]; }
                      else {
                        if (typeof item[k][k1] == "object") {
                          if (item[k][k1].length) {
                            tempObj[k] = item[k][k1].map(function(item) { return objectUnpack(item); });
                          }
                          else {
                            tempObj [k] = objectUnpack(item[k][k1]);
                          }
                        } 
                        else if (k1 == "N" && k == "price") {tempObj[k] = parseFloat(parseFloat(item[k][k1]).toFixed(2));}
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

module.exports = function(tableId, method, params, callback) {
  
  params.TableName = tableNames[tableId];

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





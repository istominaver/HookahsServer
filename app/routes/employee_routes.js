const validate = require('express-validation');
const validation = require('./validation/employee_routes');
const databaseService = require('../services/database_service');
const makeResponseService = require('../services/make_response_service');

function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;

}

module.exports = function(app) {

app.put('/startWorkingDay', function(req, res) {
//sort by likes
  const action = 'startWorkingDay';

  if(!req.query.hookahMasterId||!req.query.restaurantId) 
    makeResponseService(action, res, [], "Не верный запрос. Параметры hookahMasterId и restaurantId - обязательные");
  else {
    const params = {
    ExpressionAttributeNames: {
      "#AW": "atWork",
      "#R": "restaurantId"
    }, 
    ExpressionAttributeValues: {
      ":aw": {
        S: "true"
      },
      ":restaurantId": {
        S: req.query.restaurantId
      }
    }, 
    Key: {
      "hookahMasterId": {
        S: req.query.hookahMasterId
      }
    }, 
    UpdateExpression: "SET #AW = :aw, #R = :restaurantId"
    };
  
    databaseService('hookahMasters','updateItem', params, res, function(resultArray, err) {
      makeResponseService(action, res, {"dateTime": getDateTime()}, err);
    });
  }
}); 

app.put('/endWorkingDay', function(req, res) {
//sort by likes
  const action = 'endWorkingDay';

  if(!req.query.hookahMasterId) 
    makeResponseService(action, res, [], "Не верный запрос. Параметр hookahMasterId - обязательный");
  else {
    const params = {
      ExpressionAttributeNames: {
        "#AW": "atWork"
      }, 
      ExpressionAttributeValues: {
        ":aw": {
          S: "false"
        }
      }, 
      Key: {
        "hookahMasterId": {
          S: req.query.hookahMasterId
        }
      },  
      UpdateExpression: "SET #AW = :aw"
    };
  
    databaseService('hookahMasters', 'updateItem', params, res, function(resultArray, err) {
      makeResponseService(action, res, {"dateTime": getDateTime()}, err);
    });
  }
}); 

app.post('/hookahMix', validate(validation.hookahMix), function(req, res) {
  const action = 'hookahMix';
  let mixId;
  if(req.body.mixId) mixId = req.body.mixId;
  else mixId = (new Date().getTime()).toString();
  const tabacco = req.body.tabacco.map(function(item) {
      return {
              "M" : {
                      "brand" : {"S" : item.brand}, 
                      "sort" : {"S" : item.sort}
                    } 
            } 
    });
  const hookahsDDBItem = {
                      "hookahMasterId": {"S" : req.body.hookahMasterId},
                      "mixId" : {"S" : mixId}, 
                      "name" : {"S" : req.body.name}, 
                      "categoryId" : {"S" : req.body.categoryId},
                      "description" : {"S" : req.body.description},
                      "filling" : {"S" : req.body.filling},
                      "hookahBowl" : {"S" : req.body.hookahBowl},
                      "imageURL" : {"S" : req.body.imageURL},
                      "likes" : {"N" : '0'},
                      "price" : {"N" : req.body.price.toString()},
                      "strength" : {"S" : req.body.strength},
                      "tabacco" : {"L" : tabacco},
                      "restaurantId" : {"S" : req.body.restaurantId}
            } ;

  const params = {
    'Item': hookahsDDBItem
  };

  databaseService('mixes','putItem', params, function(result, err) {
    makeResponseService(action, res, { "mixId": mixId}, err);
  });
  });

}
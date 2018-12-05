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

}
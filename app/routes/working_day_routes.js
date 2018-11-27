const databaseService = require('../services/database_service');
const makeResponseService = require('../services/make_response_service');

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
      makeResponseService(action, res, {}, err);
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
      makeResponseService(action, res, {}, err);
    });
  }
}); 

}
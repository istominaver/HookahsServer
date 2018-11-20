const databaseService = require('./database_service');

function makeErrorResponse(action, err, res) {
    res.status(200).json(
    {
    "action" : action,
    "result" : "error",
    "reqId"  : new Date().getTime().toString(), 
    "error"    : err
    });
}

function makeSuccessfulResponse(action, data, res) {
    res.status(200).json(
    {
    "action" : action,
    "result" : "ok",
    "reqId"  : new Date().getTime().toString(), 
    "data"   : data
    });
}

module.exports = function(app) {

app.get('/restaurantsList', function(req, res) {
//sort by likes
  const action = 'restaurantsList';
  const params = { TableName: 'Restaurants' };
  
  databaseService('scan', params, res, function(resultArray, error) {
    if(databaseService.error) makeErrorResponse(action, databaseService.error, res);
    else      makeSuccessfulResponse(action, 
                                     { "restaurants" : databaseService.resultArray }, 
                                     res
                                    );
  });
});

app.get('/hookahMastersList', function(req, res) {
//sort by likes 
  const action = 'hookahMastersList';
  let restaurantId; 
  let params = { 
    TableName : "HookahMasters",
    // ExpressionAttributeNames: {
    //  "N": "name"
    // },
    ProjectionExpression: "atWork, description, hookahMasterId, imageURL, likes, restaurantId"  
  };

  if(req.query.restaurantId) {
    restaurantId = req.query.restaurantId;
    params.FilterExpression = "restaurantId = :restaurantId and atWork = :atWork";
    params.ExpressionAttributeValues = {
      ":restaurantId": {
        S: restaurantId
      },
      ":atWork": {
        S: "true"
      }
      };
  }
  else {
    params.ExpressionAttributeValues = {
      ":v1": { S: "true" }
    }; 
    params.FilterExpression = "atWork = :v1"; 
    params.TableName = "HookahMasters";
  }; 

  databaseService('scan', params, res, function(resultArray, error) {
    if(databaseService.error) makeErrorResponse(action, databaseService.error, res);
    else      makeSuccessfulResponse(action, { "hookahMasters" : databaseService.resultArray, "restaurantId" : restaurantId}, res);
  });
});

app.get('/ordersList', function(req, res) {
//sort by time 
  const action = 'ordersList';
  let hookahMasterId, clientId; 
  let params = { TableName : "Orders" };

  if(req.query.hookahMasterId) {
    hookahMasterId = req.query.hookahMasterId;
    params.FilterExpression = "hookahMasterId = :hookahMasterId"; //and date > :date
    params.ExpressionAttributeValues = {
      ":hookahMasterId": {
        S: hookahMasterId
      }
      // ":date": {
      //   N: new Date().getTime() - 4320000 // last 24 hours
      // }
      };
  }
  else if(req.query.clientId){
    clientId = req.query.clientId;
    params.FilterExpression = "clientId = :clientId";
    params.ExpressionAttributeValues = {
      ":clientId": {
        S: clientId
      }
    };
  }; 

  databaseService('scan', params, res, function(resultArray, error) {
    if(databaseService.error) makeErrorResponse(action, databaseService.error, res);
    else     
      //добавить проверку на дефолтные данные
      makeSuccessfulResponse(action, { "ordersList" : databaseService.resultArray, "clientId" : clientId, "hookahMasterId" : hookahMasterId }, res);
  });
});

app.get('/hookahMenu', function(req, res) {

  const action = 'hookahMenu';
  const restaurantId = req.query.restaurantId;

  const paramsCategories = {
    Key: {
        "restaurantId": {
          S: restaurantId
        }},
      TableName: 'categories'
  };

  const paramsMixes = {
      ExpressionAttributeValues: {
        ":v1": {
          S: restaurantId
        }
      }, 
      FilterExpression: "restaurantId = :v1", 
      TableName: "mixes"
  }; 

  databaseService('getItem', paramsCategories, res, function(resultObject, error) {
    if(databaseService.error) makeErrorResponse(action, databaseService.error, res);
    else {
      databaseService('scan', paramsMixes, res, function(resultArray, error) {
        if(databaseService.error) makeErrorResponse(action, databaseService.error, res);
        else {
          databaseService.resultObject.categories = 
          databaseService.resultObject.categories.map(function(itemCategory) { 
            itemCategory.mixes = [];
            databaseService.resultArray.map(function(item) { 
              if (item.categoryId == itemCategory.categoryId)
                itemCategory.mixes.push(item);
            });
            return itemCategory; 
          });
          makeSuccessfulResponse(action, databaseService.resultObject, res);
        }
      });
    }     
  });  
});  

app.post('/makeOrder', function(req, res) {

  const action = 'makeOrder';
  const orderId = (new Date().getTime()).toString();
  const hookahsDDBItem = 
  req.body.hookahs.map(function(item) { 
    return {"M" : { "mixId": {"S" : item.mixId}, "name": {"S" : item.name}} } 
  });
  let hookahMasterName = "Incognito";
  let hookahMasterImageURL = "https://static.vecteezy.com/system/resources/previews/000/014/628/original/hookahman-vector.jpg";

  let restaurantName = "Secret";
  let restaurantImageURL = "http://png.clipart-library.com/images/1/black-and-white-hookah-clip-art/tobacco-pipe-hookah-lounge-logo-hookah-5ac3a8eecc7100.9629897215227722068374.jpg";

  const paramsHookahMaster = {
    Key: {
        "hookahMasterId": {
          S: req.body.hookahMasterId
        }},
      TableName: 'HookahMasters'
  };

  const paramsRestaurant = {
    Key: {
        "restaurantId": {
          S: req.body.restaurantId
        }},
      TableName: 'Restaurants'
  };

  databaseService('getItem', paramsHookahMaster, res, function(resultObject, error) {
    if(!databaseService.error) {
      hookahMasterName = databaseService.resultObject.name;
      hookahMasterImageURL = databaseService.resultObject.imageURL;
    }
    databaseService('getItem', paramsRestaurant, res, function(resultObject, error) {
    if(!databaseService.error) {
      restaurantName = databaseService.resultObject.name;
      restaurantImageURL = databaseService.resultObject.photos[0];
    }
    const item = {
    "amount":               {'S': req.body.amount},
    "clientId":             {'S': req.body.clientId},
    "clientName":           {'S': req.body.clientName},
    "condition":            {'S': "new"},
    "peopleCount":          {'N': req.body.peopleCount},
    "hookahMasterId":       {'S': req.body.hookahMasterId},
    "hookahMasterName":     {'S': hookahMasterName},
    "hookahMasterImageURL": {'S': hookahMasterImageURL},
    "hookahs":              {'L': hookahsDDBItem},
    "orderId":              {'S': orderId},
    "payment":              {'S': "false"},
    "phoneNumber":          {'S': req.body.phoneNumber},
    "tableNumber":          {'S': req.body.tableNumber},
    "restaurantId":         {'S': req.body.restaurantId},
    "restaurantName":       {'S': restaurantName},
    "restaurantImageURL":   {'S': restaurantImageURL},
    "dueDate":              {'S': req.body.dueDate}
  }

  const params = {
    'TableName': "Orders",
    'Item': item
  };

  databaseService('putItem', params, res, function(result, error) {
    if(databaseService.error) makeErrorResponse(action, databaseService.error, res);
    else      makeSuccessfulResponse(action, 
                                     { "orderId": orderId}, 
                                     res);
  });
  });
  });


  
  });

app.put('/startWorkingDay', function(req, res) {
//sort by likes
  const action = 'startWorkingDay';

  const params = {
  ExpressionAttributeNames: {
   "#AW": "atWork",
   "#R": "restaurantId"
  }, 
  ExpressionAttributeValues: {
   ":aw": {
     S: "true"
    },
    ":r": {
     S: req.query.restaurantId
    }
  }, 
  Key: {
   "hookahMasterId": {
     S: req.query.hookahMasterId
    }
  }, 
 // ReturnValues: "ALL_NEW", 
  TableName: "HookahMasters", 
  UpdateExpression: "SET #AW = :aw, #R = :r"
 };

  
  databaseService('updateItem', params, res, function(resultArray, error) {
    if(databaseService.error) makeErrorResponse(action, databaseService.error, res);
    else      makeSuccessfulResponse(action, {}, 
                                     res
                                    );
  });
}); 

app.put('/endWorkingDay', function(req, res) {
//sort by likes
  const action = 'endWorkingDay';

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
 // ReturnValues: "ALL_NEW", 
  TableName: "HookahMasters", 
  UpdateExpression: "SET #AW = :aw"
 };

  
  databaseService('updateItem', params, res, function(resultArray, error) {
    if(databaseService.error) makeErrorResponse(action, databaseService.error, res);
    else      makeSuccessfulResponse(action, {}, 
                                     res
                                    );
  });
}); 

}
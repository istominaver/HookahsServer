var request = require('request');

request('http://localhost:8081/restaurantsList', function (error, response, body) {
  console.log('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  console.log('body:', body); // Print the HTML for the Google homepage.
});


[Тестируемый метод]_[Сценарий]_[Ожидаемое поведение]





app.get('/restaurantsList', function(req, res) {
//sort by likes
  const action = 'restaurantsList';
  const params = { TableName: 'Restaurants' };
  
  databaseService('scan', params, res, function(resultArray, err) {
    if(err) makeErrorResponse(action, err, res);
    else      makeSuccessfulResponse(action, 
                                     { "restaurants" : resultArray }, 
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
    ExpressionAttributeNames:
    {"#N":"name"},
    ProjectionExpression: "#N, atWork, description, hookahMasterId, imageURL, likes, restaurantId"  
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

  databaseService('scan', params, res, function(resultArray, err) {
    if(err) makeErrorResponse(action, err, res);
    else      makeSuccessfulResponse(action, { "hookahMasters" : resultArray, "restaurantId" : restaurantId}, res);
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
  }

  databaseService('scan', params, res, function(resultArray, err) {
    if(err) makeErrorResponse(action, err, res);
    else     
      //добавить проверку на дефолтные данные
      makeSuccessfulResponse(action, { "ordersList" : resultArray, "clientId" : clientId, "hookahMasterId" : hookahMasterId }, res);
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

  databaseService('getItem', paramsCategories, res, function(resultObject, err) {
    if(err) makeErrorResponse(action, err, res);
    else {
      databaseService('scan', paramsMixes, res, function(resultArray, err) {
        if(err) makeErrorResponse(action, err, res);
        else {
          resultObject.categories = 
          resultObject.categories.map(function(itemCategory) { 
            itemCategory.mixes = [];
            resultArray.map(function(item) { 
              if (item.categoryId == itemCategory.categoryId)
                itemCategory.mixes.push(item);
            });
            return itemCategory; 
          });
          makeSuccessfulResponse(action, resultObject, res);
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

  databaseService('getItem', paramsHookahMaster, res, function(resultObject, err) {
    if(!err) {
      hookahMasterName = resultObject.name;
      hookahMasterImageURL = resultObject.imageURL;
    }
    databaseService('getItem', paramsRestaurant, res, function(resultObject, err) {
    if(!err) {
      restaurantName = resultObject.name;
      restaurantImageURL = resultObject.photos[0];
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

  databaseService('putItem', params, res, function(result, err) {
    if(err) makeErrorResponse(action, err, res);
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

  
  databaseService('updateItem', params, res, function(resultArray, err) {
    if(err) makeErrorResponse(action, err, res);
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

  
  databaseService('updateItem', params, res, function(resultArray, err) {
    if(err) makeErrorResponse(action, err, res);
    else      makeSuccessfulResponse(action, {}, 
                                     res
                                    );
  });
}); 

}
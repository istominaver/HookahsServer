const databaseService = require('../services/database_service');
const makeResponseService = require('../services/make_response_service');

module.exports = function(app) {

app.get('/restaurantsList', function(req, res) {
//sort by likes
  const action = 'restaurantsList';
  const params = { TableName: 'Restaurants' };
  
  databaseService('scan', params, res, function(resultArray, err) {
    makeResponseService(action, res, { "restaurants" : resultArray }, err);
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
  } 

  databaseService('scan', params, res, function(resultArray, err) {
    makeResponseService(action, res, { "hookahMasters" : resultArray, "restaurantId" : restaurantId}, err);
    });
});

app.get('/ordersList', function(req, res) {
//sort by time 
  const action = 'ordersList';

  if(!req.query.hookahMasterId&&!req.query.clientId) 
    makeResponseService(action, res, [], "Не верный запрос. Один из параметров: hookahMasterId или clientId долен присутствовать в запросе");
  else {

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
      }
    }

    databaseService('scan', params, res, function(resultArray, err) {
      //добавить проверку на дефолтные данные
      makeResponseService(action, res, { "ordersList" : resultArray, "clientId" : clientId, "hookahMasterId" : hookahMasterId }, err);
    });
  }
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
    if(err) makeResponseService(action, res, {}, err);
    else {
      databaseService('scan', paramsMixes, res, function(resultArray, err) {
        if(err) makeResponseService(action, res, [], err);
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
          makeResponseService(action, res, resultObject);
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
    const tabacco = item.tabacco.map(function(item) {
      return {
              "M" : {
                      "brand" : {"S" : item.brand}, 
                      "sort" : {"S" : item.sort}
                    } 
            } 
    });
    return {
              "M" : {
                      "mixId" : {"S" : item.mixId}, 
                      "name" : {"S" : item.name}, 
                      "categoryId" : {"S" : item.categoryId},
                      "description" : {"S" : item.description},
                      "filling" : {"S" : item.filling},
                      "hookahBowl" : {"S" : item.hookahBowl},
                      "imageURL" : {"S" : item.imageURL},
                      "likes" : {"N" : item.likes.toString()},
                      "price" : {"N" : item.price.toString()},
                      "strength" : {"S" : item.strength},
                      "tabacco" : {"L" : tabacco},
                      "restaurantId" : {"S" : item.restaurantId}
                    } 
            } 
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
    makeResponseService(action, res, { "orderId": orderId}, err);
  });
  });
  });
  });
}
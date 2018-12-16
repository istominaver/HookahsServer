const randomStr = require('randomstring');
const validate = require('express-validation');
const validation = require('./validation/client_routes');
const databaseService = require('../services/database_service');
const makeResponseService = require('../services/make_response_service');

module.exports = function(app) {

app.get('/restaurantsList', function(req, res) {
//sort by likes
  const action = 'restaurantsList';
  
  databaseService('restaurants', 'scan', {}, function(resultArray, err) {
    makeResponseService(action, res, { "restaurants" : resultArray }, err);
  });
});

app.get('/hookahMastersList', function(req, res) {
//sort by likes 
  const action = 'hookahMastersList';
  let restaurantId; 
  let responseObject = { "hookahMasters" : []};
  let params = { 
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
      responseObject.restaurantId = restaurantId;
  }
  else {
    params.ExpressionAttributeValues = {
      ":v1": { S: "true" }
    }; 
    params.FilterExpression = "atWork = :v1"; 
    params.TableName = "HookahMasters";
  } 

  databaseService('hookahMasters', 'scan', params, function(resultArray, err) {
    responseObject.hookahMasters = resultArray;
    makeResponseService(action, res, responseObject, err);
    });
});

app.get('/ordersList', function(req, res) {
//sort by time 
  const action = 'ordersList';

  if(!req.query.hookahMasterId&&!req.query.clientId) 
    makeResponseService("400_ordersList", res);
  else {

    let hookahMasterId, clientId; 

    if(req.query.hookahMasterId) {
      hookahMasterId = req.query.hookahMasterId;
      var params = {
        FilterExpression : "hookahMasterId = :hookahMasterId", //and date > :date
        ExpressionAttributeValues : {
          ":hookahMasterId": {
            S: hookahMasterId
          }
          // ":date": {
          //   N: new Date().getTime() - 4320000 // last 24 hours
          // }
        }
      }
    }
    else if(req.query.clientId){
      clientId = req.query.clientId;
      var params = {
        FilterExpression : "clientId = :clientId",
        ExpressionAttributeValues : {
          ":clientId": {
            S: clientId
          }
        }
      }
    }

    databaseService('orders','scan', params, function(resultArray, err) {
      //добавить проверку на дефолтные данные
      makeResponseService(action, res, { "ordersList" : resultArray, "clientId" : clientId, "hookahMasterId" : hookahMasterId }, err);
    });
  }
});

app.get('/hookahMenu', validate(validation.hookahMenu), function(req, res) {

  const action = 'hookahMenu';
  const restaurantId = req.query.restaurantId;
    const paramsCategories = {
      Key: {
        "restaurantId": {
          S: restaurantId
        }}
    };

    const paramsMixes = {
      ExpressionAttributeValues: {
        ":v1": {
          S: restaurantId
        }
      }, 
      FilterExpression: "restaurantId = :v1"
    }; 

    databaseService('categories','getItem', paramsCategories, function(resultObject, err) {
      if(Object.keys(resultObject).length == 0) makeResponseService(action, res, {}, 'Нет данных по указанному заведению');
      else if(err) makeResponseService(action, res, {}, err);
      else {
        databaseService('mixes','scan', paramsMixes, function(resultArray, err) {
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

app.post('/makeOrder', validate(validation.makeOrder), function(req, res) {

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
        }}
  };

  const paramsRestaurant = {
    Key: {
        "restaurantId": {
          S: req.body.restaurantId
        }}
  };

  databaseService('hookahMasters','getItem', paramsHookahMaster, function(resultObject, err) {
    if(!err && Object.keys(resultObject).length != 0) {
      hookahMasterName = resultObject.name;
      hookahMasterImageURL = resultObject.imageURL;
    }
    databaseService('restaurants', 'getItem', paramsRestaurant, function(resultObject, err) {
    if(!err && Object.keys(resultObject).length != 0) {
      restaurantName = resultObject.name;
      restaurantImageURL = resultObject.photos[0];
    }
    const item = {
    "amount":               {'S': req.body.amount.toString()},
    "clientId":             {'S': req.body.clientId},
    "clientName":           {'S': req.body.clientName},
    "condition":            {'S': "new"},
    "peopleCount":          {'N': req.body.peopleCount.toString()},
    "hookahMasterId":       {'S': req.body.hookahMasterId},
    "hookahMasterName":     {'S': hookahMasterName},
    "hookahMasterImageURL": {'S': hookahMasterImageURL},
    "hookahs":              {'L': hookahsDDBItem},
    "orderId":              {'S': orderId},
    "payment":              {'S': "false"},
    "phoneNumber":          {'S': req.body.phoneNumber},
    "tableNumber":          {'S': req.body.tableNumber.toString()},
    "restaurantId":         {'S': req.body.restaurantId},
    "restaurantName":       {'S': restaurantName},
    "restaurantImageURL":   {'S': restaurantImageURL},
    "dueDate":              {'S': req.body.dueDate.toString()}
  }

  const params = {
    'Item': item
  };

  databaseService('orders','putItem', params, function(result, err) {
    makeResponseService(action, res, { "orderId": orderId}, err);
  });
  });
  });
  });

app.post('/clientAuth', validate(validation.clientAuth), function(req, res) {

  const action = 'clientAuth';
  const phone = req.body.phone;
  const name = req.body.name;

  const searchParams = {
    Key: {
      "phone": {
        S: phone
      }}
  };

    databaseService('clients', 'getItem', searchParams, function(resultObject, err) {
      if(err) makeResponseService(action, res, {}, err);
      else if (Object.keys(resultObject).length == 0) {

          const clientId = (new Date().getTime()).toString();
          const params = {
            'Item': {
              "phone":                       {'S': phone},
              "name":                        {'S': name},
              "clientId":                    {'S': clientId},              
              "code":                        {'N': randomStr.generate({length: 6, charset: 'numeric'})},
              "expires" :                    {'N': (new Date().getTime()/1000 + 300).toFixed(0)},
              "enterConfirmationCodeCounter": {'N': '0'},
              "confirmationCodeExpires": {'N': (new Date().getTime()/1000 + 300).toFixed(0)},
              "confirmed": {'S': "false"}
           }
          }

          databaseService('clients','putItem', params, function(result, err) {
            makeResponseService(action, res, { "clientId": clientId, "state": "new" }, err);
          });
      }
      else {
           const params = {
                ExpressionAttributeNames: {
                  "#code": "code",
                  "#confirmationCodeExpires": "confirmationCodeExpires",
                  "#enterConfirmationCodeCounter": "enterConfirmationCodeCounter",
                  "#confirmed": "confirmed"
                }, 
                ExpressionAttributeValues: {
                  ":code": {'N': randomStr.generate({length: 6, charset: 'numeric'})},
                  ":enterConfirmationCodeCounter": {'N': '0'},
                  ":confirmationCodeExpires": {'N': (new Date().getTime()/1000 + 300).toFixed(0)},
                  ":confirmed": {'S': 'false'}
                }, 
                Key: {
                  "phone": {
                    S: phone
                  }
                }, 
                UpdateExpression: "SET #code = :code, #enterConfirmationCodeCounter = :enterConfirmationCodeCounter, #confirmationCodeExpires = :confirmationCodeExpires, #confirmed = :confirmed"
              };

              databaseService('clients','updateItem', params, function(result, err) {});
              makeResponseService(action, res, { "clientId": resultObject.clientId, "state": "active" }, err);
         }     
    });
});

app.post('/checkConfirmationCode', validate(validation.checkConfirmationCode), function(req, res) {
  const action = 'checkConfirmationCode';
  const phone = req.body.phone;
  const confirmationCode = req.body.confirmationCode;

     const searchParams = {
      Key: {
        "phone": {
          S: phone
        }}
    };

    databaseService('clients', 'getItem', searchParams, function(resultObject, err) {
      if(err) makeResponseService(action, res, {}, err);
      else if(resultObject.confirmed == 'true') {makeResponseService(action, res, { "clientId": resultObject.clientId, "state":"authorized" }, err);}
      else if (Object.keys(resultObject).length == 0 || parseInt(resultObject.confirmationCodeExpires) < parseInt(new Date().getTime()/1000)) {
        makeResponseService(action, res, {}, {"errorType":"consumer","errorCode":"enterConfirmationCodeTimeout","errorText":'Срок действия временного кода истек.'});
      } 
      else if(resultObject.enterConfirmationCodeCounter >= 3) {
         makeResponseService(action, res, {}, {"errorType":"consumer","errorCode":"confirmationCodeInputLimit","errorText":'Вы превысили допустимое количество попыток ввода кода подтверждения.'});
      }
      else if(parseInt(confirmationCode) == resultObject.code) {
        const params = {
          'Item': {
            'phone': {'S':phone},
            'clientId': {'S':resultObject.clientId},
            'name': {'S':resultObject.name},
            'confirmed': {'S': 'true'}
          }
        };

        databaseService('clients','putItem', params, function(result, err) { 
          makeResponseService(action, res, { "clientId": resultObject.clientId, "state":"authorized" }, err);
       });
      }
      else if(resultObject.enterConfirmationCodeCounter < 3) {
        makeResponseService(action, res, {}, {"errorType":"consumer","errorCode":"confirmationCodeInputError","errorText":'Неверный код подтверждения, попробуйте снова.'});

        const params = {
          ExpressionAttributeNames: {
            "#eccc": "enterConfirmationCodeCounter"
          }, 
          ExpressionAttributeValues: {
            ":eccc": {
              N: (parseInt(resultObject.enterConfirmationCodeCounter) + 1).toString()
            }
          }, 
          Key: {
            "phone": {
              S: phone
            }
          }, 
          UpdateExpression: "SET #eccc = :eccc"
        };

        databaseService('clients','updateItem', params, function(result, err) {});
      }
    });
});

// app.use(function(err, req, res, next){
//   if (err instanceof validate.ValidationError) return res.status(err.status).json(err);
//   else {return res.status(500).send(err.stack);}
// });

}
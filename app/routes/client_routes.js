const databaseService = require('../services/database_service');
const makeResponseService = require('../services/make_response_service');
const randomStr = require('randomstring');


module.exports = function(app) {

app.get('/restaurantsList', function(req, res) {
//sort by likes
  const action = 'restaurantsList';
  
  databaseService('restaurants', 'scan', {}, res, function(resultArray, err) {
    makeResponseService(action, res, { "restaurants" : resultArray }, err);
  });
});

app.get('/hookahMastersList', function(req, res) {
//sort by likes 
  const action = 'hookahMastersList';
  let restaurantId; 
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
  }
  else {
    params.ExpressionAttributeValues = {
      ":v1": { S: "true" }
    }; 
    params.FilterExpression = "atWork = :v1"; 
    params.TableName = "HookahMasters";
  } 

  databaseService('hookahMasters', 'scan', params, res, function(resultArray, err) {
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

    databaseService('orders','scan', params, res, function(resultArray, err) {
      //добавить проверку на дефолтные данные
      makeResponseService(action, res, { "ordersList" : resultArray, "clientId" : clientId, "hookahMasterId" : hookahMasterId }, err);
    });
  }
});

app.get('/hookahMenu', function(req, res) {

  const action = 'hookahMenu';
  const restaurantId = req.query.restaurantId;

  if(!req.query.restaurantId) 
    makeResponseService(action, res, {}, "Не верный запрос. Параметр restaurantId обязательный");
  else {

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

    databaseService('categories','getItem', paramsCategories, res, function(resultObject, err) {
      if(Object.keys(resultObject).length == 0) makeResponseService(action, res, {}, 'Нет данных по указанному заведению');
      else if(err) makeResponseService(action, res, {}, err);
      else {
        databaseService('mixes','scan', paramsMixes, res, function(resultArray, err) {
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
  }
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
        }}
  };

  const paramsRestaurant = {
    Key: {
        "restaurantId": {
          S: req.body.restaurantId
        }}
  };

  databaseService('hookahMasters','getItem', paramsHookahMaster, res, function(resultObject, err) {
    if(!err && Object.keys(resultObject).length != 0) {
      hookahMasterName = resultObject.name;
      hookahMasterImageURL = resultObject.imageURL;
    }
    databaseService('restaurants', 'getItem', paramsRestaurant, res, function(resultObject, err) {
    if(!err && Object.keys(resultObject).length != 0) {
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
    'Item': item
  };

  databaseService('orders','putItem', params, res, function(result, err) {
    makeResponseService(action, res, { "orderId": orderId}, err);
  });
  });
  });
  });

app.post('/clientAuth', function(req, res) {

  const action = 'clientAuth';
  const phone = req.body.phone;
  const password = req.body.password;
  const name = req.body.name;

  if(!phone||!password||!name) {
    //add phone validation
    //password validation
    //namr char validation
     makeResponseService(action, res, {}, "Не верный запрос. Параметры phone, password и name обязательные");
  }
  else {
    const searchParams = {
      Key: {
        "phone": {
          S: phone
        }}
    };

    databaseService('clients', 'getItem', searchParams, res, function(resultObject, err) {
      if(err) makeResponseService(action, res, {}, err);
      else if (Object.keys(resultObject).length == 0) {

        const clientId = (new Date().getTime()).toString();
        const params = {
          'Item': {
            "phone":                       {'S': phone},
            "name":                        {'S': name},
            "clientId":                    {'S': clientId},              
            "password":                    {'S': password},
            "code":                        {'N': randomStr.generate({length: 6, charset: 'numeric'})},
            "expires" :                    {'N': (new Date().getTime()/1000 + 300).toFixed(0)},
            "enterConfirmationCodeCouner": {'N': '0'}
          }
        }

        databaseService('clients','putItem', params, res, function(result, err) {
            makeResponseService(action, res, { "clientId": clientId, "state": "new" }, err);
        });
      }
      else if(resultObject.confirmed != "true") {
        //change on expires attribute checking
        makeResponseService(action, res, { "clientId": resultObject.clientId, "state": "needPhoneConfirmation" }, err);
        if(resultObject.codeCreationTime < (new Date().getTime() - 300000)) {

          const updateParams = {
            ExpressionAttributeNames: {
              "#code": "code",
              "#codeCreationTime": "codeCreationTime"
            }, 
            ExpressionAttributeValues: {
              ":code": {
                N: randomStr.generate({length: 6, charset: 'numeric'})
              },
              ":codeCreationTime": {
                N: (new Date().getTime()).toString()
              }
            }, 
            Key: {
              "phone": {
                S: phone
              }
            }, 
            UpdateExpression: "SET #code = :code, #codeCreationTime = :codeCreationTime"
          };
  
        databaseService('clients','updateItem', updateParams, res, function(result, err) {});
        }

      }
      else if(password == resultObject.password) {
        makeResponseService(action, res, { "clientId": resultObject.clientId, "state":"authorized" }, err);
      }
      else {
        makeResponseService(action, res, {}, 'Не верный логин или пароль');
        //превышено количество попыток ввода пароля?
      }
    });

  }
});

app.post('/checkConfirmationCode', function(req, res) {
  const action = 'checkConfirmationCode';
  const phone = req.body.phone;
  const confirmationCode = req.body.confirmationCode;

  if(!phone||!confirmationCode) {
    //add phone validation
    //confirmationCode - numeric, 6 signs length
    makeResponseService(action, res, {}, "Не верный запрос. Параметры phone и confirmationCode обязательные");
  }
  else {
     const searchParams = {
      Key: {
        "phone": {
          S: phone
        }}
    };

    databaseService('clients', 'getItem', searchParams, res, function(resultObject, err) {
      if(err) makeResponseService(action, res, {}, err);
      else if (Object.keys(resultObject).length == 0) {
        makeResponseService(action, res, {}, 'Не найдены данные по указанному номеру телефона.');
      }
      else if(parseInt(confirmationCode) == resultObject.code) {
        makeResponseService(action, res, { "clientId": resultObject.clientId, "state":"authorized" }, err);
        const params = {
          'Item': {
            'phone': {'S':phone},
            'clientId': {'S':resultObject.clientId},
            'password': {'S':resultObject.password},
            'name': {'S':resultObject.name},
            'confirmed': {'S':'true'}
          }
        };

        databaseService('clients','putItem', params, res, function(result, err) {});
      }
      else if(resultObject.enterConfirmationCodeCouner < 3) {
        makeResponseService(action, res, {}, 'Не верный код подтверждения.');
// обновить значение каунтера в базе
      }
      else if(resultObject.enterConfirmationCodeCouner > 3) {
         makeResponseService(action, res, {}, 'Вы превысили допустимое количество попыток ввода кода подтверждения');
// обновить значение каунтера в базе
      }
    });

}
});

}
module.exports = function(app, ddb) {

function objectUnpack(item) { //make like library or module
            var tempObj = {};
            for(var k in item) {
              if(typeof item[k] == "object"){
                if(k.length == 1) {tempObj = objectUnpack(item[k])}
                else {
                for(var k1 in item[k]) {
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
              else {
                return item[k];
              }
            }
            return tempObj;
          }

function makeResponse(action, data, res) {
    res.status(200).json({"action":action,"result":"ok","reqId":new Date().getTime().toString(), "data": data});//add result ok/err + errCode + errDescr
}

app.get('/restaurantsList', function(req, res) {
//sort by likes
  const params = {
      TableName: 'Restaurants'
  };

  ddb.scan(params, function(err, data) {
      if (err) res.status(500).json({"err":err});
      else {
          const tempArray = data.Items.map(function(item) { return objectUnpack(item); });
          makeResponse("restaurantsList", {"restaurants":tempArray}, res);
      }
  });
});

app.get('/hookahMastersList', function(req, res) {
//sort by likes 
  let restaurantId; 
  let params = {TableName: "HookahMasters"}

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
      ":v1": {
        S: "true"
      }
    }; 
    params.FilterExpression = "atWork = :v1"; 
    params.TableName = "HookahMasters";
  }; 

  ddb.scan(params, function(err, data) {
      if (err) res.status(500).json({"err":err});
      else {
          const tempArray = data.Items.map(function(item) { return objectUnpack(item); });
          makeResponse("hookahMastersList", {"hookahMasters":tempArray,"restaurantId":restaurantId}, res);
      }
  });
});

app.get('/ordersList', function(req, res) {

//sort by time 
  let hookahMastersId, clientId; 
  let params = {TableName: "Orders"}

  if(req.query.hookahMastersId) {
    hookahMastersId = req.query.hookahMastersId;
    params.FilterExpression = "hookahMastersId = :hookahMastersId and time > :time";
    params.ExpressionAttributeValues = {
      ":restaurantId": {
        S: restaurantId
      },
      ":time": {
        N: new Date().getTime() - 4320000
      }
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

  ddb.scan(params, function(err, data) {
      if (err) res.status(500).json({"err":err});
      else {
          const tempArray = data.Items.map(function(item) { return objectUnpack(item); });
          makeResponse("hookahMastersList", {"ordersList":tempArray,"clientId":clientId,"hookahMastersId":hookahMastersId}, res);
      }
  });
});


app.get('/hookahMenu', function(req, res) {

  const restaurantId = "0";
  //req.query.restaurantId;

  const paramsMixes = {
      ExpressionAttributeValues: {
        ":v1": {
          S: restaurantId
        }
      }, 
      FilterExpression: "restaurantId = :v1", 
      TableName: "mixes"
  }; 

  const paramsCategories = {
    Key: {
        "restaurantId": {
          S: restaurantId
        }},
      TableName: 'categories'
  };

ddb.getItem(paramsCategories, function(err, data) { 
    if (err) res.status(500).json({"err":err + ", restaurantId : " + restaurantId});
    else  {
      let tempObj = objectUnpack(data.Item); //  проверка на пустоту
      ddb.scan(paramsMixes, function(err, data) {
        if (err) res.status(500).json({"err":err+ ", restaurantId : " + restaurantId}); 
        else  {          
          const tempArray = data.Items.map(function(item) { return objectUnpack(item); });

          tempObj.categories = tempObj.categories.map(function(itemCategory) { 
            itemCategory.mixes = [];
            for(let i = 0; i < tempArray.length; i++)
            {
              if(tempArray[i].categoryId == itemCategory.categoryId)
              itemCategory.mixes.push(tempArray[i]);
            }

            return itemCategory; 
          });
          makeResponse("mixesList", tempObj, res)
        }
      });
    }
 });
});

app.post('/makeOrder', function(req, res) {

  const orderId = (new Date().getTime()).toString();
  const hookahsDDBItem = req.body.hookahs.map(function(item) { return {"M":{"mixId": {"S":item.mixId},"number":{"S":item.number}} }});

  const item = {
    "amount":          {'S': req.body.amount},
    "clientId":        {'S': req.body.clientId},
    "clientName":      {'S': req.body.clientName},
    "condition":       {'S': "new"},
    "guestsNumber":    {'S': req.body.guestsNumber},
    "hookahMastersId": {'S': req.body.hookahMastersId},
    "hookahs":         {'L': hookahsDDBItem},
    "orderId":         {'S': orderId},
    "payment":         {'S': "false"},
    "phone":           {'S': req.body.phone},
    "placeId":         {'S': req.body.placeId},
    "restaurantId":    {'S': req.body.restaurantId},
    "time":            {'S': req.body.time}
  }

  ddb.putItem({
    'TableName': "Orders",
    'Item': item
  }, function(err, data) {
    if (err) res.status(500).json({"err":err,"orderId":orderId}); 
    else makeResponse("makeOrder", {"orderId": orderId, "reqData": req.body}, res)
      //res.status(200).json({"requestData":req.body,"data": {"orderId": orderId}});                
  });
 });


};
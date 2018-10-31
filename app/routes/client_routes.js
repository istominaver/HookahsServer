module.exports = function(app, ddb) {

const bodyParser = require('body-parser');

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

app.use(bodyParser.json());

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
//add filter by city by restId
//sort by likes
  const params = {
      ExpressionAttributeValues: {
        ":v1": {
          S: "true"
        }
      }, 
      FilterExpression: "atWork = :v1", 
      TableName: "HookahMakers"
  }; 

  ddb.scan(params, function(err, data) {
      if (err) res.status(500).json({"err":err});
      else {
          const tempArray = data.Items.map(function(item) { return objectUnpack(item); });
          makeResponse("hookahMastersList", {"hookahMakers":tempArray}, res);
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
//if !req.body.phone shouldAuthorised
//else order is got to handling

  var hookahs = req.body.hookahs;
  //mixes = ["2", "23"]
  var orderId = (new Date().getTime()).toString();
  var hookahsDDBItem = [];
  var tempObj;
  for(var i=0;i<hookahs.length;i++) {
    tempObj = {"M":{"mixId": {"S":hookahs[i].mixId},"number":{"S":hookahs[i].number}}};
    hookahsDDBItem.push(tempObj);
  } 

        var item = {
            'phone': {'S': req.body.phone},
            'clientName': {'S': req.body.clientName},
            'hookahs': {'L': hookahsDDBItem},//form with count
            'hookahMakerId': {'S': req.body.hookahMakerId},
            'time': {'S': req.body.time},
            'restaurantId': {'S': req.body.restaurantId},
            'guestsNumber': {'S': req.body.guestsNumber},
            'orderId':{'S': orderId}
        };

//form and return orderId - unixtime

        ddb.putItem({
            'TableName': "Orders",
            'Item': item
        }, function(err, data) {
            if (err) res.status(500).json({"err":err,"orderId":orderId}); 
            else res.status(200).json({"action":"makeOrder","result":"ok","reqestId":new Date().getTime(),"requestData":req.body,"data": {"orderId": orderId}});                
            }
        );
 });


  // app.get('/ordersList', function(req, res) {

  //    var phone = req.body.phone;
  //    //hookahs = [{"mixId": "2", "number":2},{"mixId": "23", "number":2}]
  //    var orderId = new Date().getTime();
  //    var hookahsDDBItem = [];
  //    var tempObj;
  //    for(var i = 0; i < hookahs.length; i++) {
  //      tempObj = {"M":{"mixId": {"S":hookahs[i].mixId},"number":{"S":hookahs[i].number}}};
  //      hookahsDDBItem.push(tempObj);
  //    } 

  //         var item = {
  //             'phone': {'S': req.body.phone},
  //             'clientName': {'S': req.body.clientName},
  //             'hookahs': {'L': hookahsDDBItem},//form with count
  //             'hookahMakerId': {'S': req.body.hookahMakerId},
  //             'time': {'S': req.body.time},
  //             'restaurantId': {'S': req.body.restaurantId},
  //             'guestsNumber': {'S': req.body.guestsNumber},
  //             'orderId':{'S': orderId},
  //             'state':{'S': "new"}
  //         };

  // //form and return orderId - unixtime

  //         ddb.putItem({
  //             'TableName': "Orders",
  //             'Item': item
  //         }, function(err, data) {
  //             if (err) res.status(500).json({"err":err,"orderId":orderId}); 
  //             else res.status(200).json({"action":"makeOrder","result":"ok","reqestId":new Date().getTime(),"requestData":req.body,"data": {"orderId": orderId}});                
  //             }
  //         );
  //  });


  // app.get('/hookahMakersList', function(req, res) {

  //    var phone = req.body.phone;
  //    //hookahs = [{"mixId": "2", "number":2},{"mixId": "23", "number":2}]
  //    var orderId = new Date().getTime();
  //    var hookahsDDBItem = [];
  //    var tempObj;
  //    for(var i = 0; i < hookahs.length; i++) {
  //      tempObj = {"M":{"mixId": {"S":hookahs[i].mixId},"number":{"S":hookahs[i].number}}};
  //      hookahsDDBItem.push(tempObj);
  //    } 

  //         var item = {
  //             'phone': {'S': req.body.phone},
  //             'clientName': {'S': req.body.clientName},
  //             'hookahs': {'L': hookahsDDBItem},//form with count
  //             'hookahMakerId': {'S': req.body.hookahMakerId},
  //             'time': {'S': req.body.time},
  //             'restaurantId': {'S': req.body.restaurantId},
  //             'guestsNumber': {'S': req.body.guestsNumber},
  //             'orderId':{'S': orderId},
  //             'state':{'S': "new"}
  //         };

  // //form and return orderId - unixtime

  //         ddb.putItem({
  //             'TableName': "Orders",
  //             'Item': item
  //         }, function(err, data) {
  //             if (err) res.status(500).json({"err":err,"orderId":orderId}); 
  //             else res.status(200).json({"action":"makeOrder","result":"ok","reqestId":new Date().getTime(),"requestData":req.body,"data": {"orderId": orderId}});                
  //             }
  //         );
  //  });


};
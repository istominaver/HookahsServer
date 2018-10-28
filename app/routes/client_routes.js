module.exports = function(app, ddb) {

const bodyParser = require('body-parser');

function objectUnpack(item) {
            var tempObj = {};
            for(var k in item) {
              if(typeof item[k] == "object"){
                if(k.length == 1) {tempObj = objectUnpack(item[k])}
                else {
                for(var k1 in item[k]) {
                  if (typeof item[k][k1] == "object") {
                    if (item[k][k1].length) {
                      var tempArray = [];
                      for(var i = 0; i < item[k][k1].length; i++) {
                        tempArray.push(objectUnpack(item[k][k1][i]));
                      }
                      tempObj[k] = tempArray;
                    }
                    else {
                      tempObj [k] = objectUnpack(item[k][k1]);
                    }
                  }
                  else tempObj[k] = item[k][k1];
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
  var params = {
      //TableName: process.env.TABLE
      TableName: 'Restaurants'
  };

  ddb.scan(params, function(err, data) {
      if (err) res.status(500).json({"err":err});
      else {
          // var tempArray = [];
          // for(var i = 0; i < data.Items.length; i++) {
          //   tempArray.push(objectUnpack(data.Items[i]));
          // }

          // const tempArray = data.Items.map{item => objectUnpack(item)}

          const tempArray = data.Items.map(function(item) { return objectUnpack(item); });

          makeResponse("restaurantsList", {"restaurantsList":tempArray}, res)

          //res.status(200).json({"action":"restaurantsList","result":"ok","reqestId":new Date().getTime().toString(), "data": {"restaurantsList":tempArray}});//add result ok/err + errCode + errDescr
      }
  });
});




app.post('/mixesList', function(req, res) {
  var restaurantId = req.body.restaurantId;

  var paramsMixes = {
      ExpressionAttributeValues: {
        ":v1": {
          S: restaurantId
        }
      }, 
      FilterExpression: "restaurantId = :v1", 
      TableName: "mixes"
  }; 

  var paramsCategories = {
    Key: {
        "restaurantId": {
          S: restaurantId
        }},
      TableName: 'categories'
  };

ddb.getItem(paramsCategories, function(err, data) { //использовать мапы при редактировании
    if (err) res.status(500).json({"err":err,"restaurantId":restaurantId});
    else  {
      var categoriesList = objectUnpack(data.Item);
      ddb.scan(paramsMixes, function(err, data) {
        if (err) res.status(500).json({"err":err,"restaurantId":restaurantId}); // an error occurred
        else  {
          var tempArray = [];
            for(var i = 0; i < data.Items.length; i++) {
              tempArray.push(objectUnpack(data.Items[i]));
            }
          res.status(200).json({"action":"mixesList","result":"ok","reqestId":new Date().getTime(),"requestData":req.body,"data":{"categoriesList":categoriesList}, "mixesList": tempArray});
        }
      });
    }
 });
});

app.put('/makeOrder', function(req, res) {

  var hookahs = req.body.hookahs;
  //hookahs = [{"mixId": "2", "number":2},{"mixId": "23", "number":2}]
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
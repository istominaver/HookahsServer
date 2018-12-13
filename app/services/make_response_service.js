module.exports = function(action, res, data, err) {
  if(err) res.status(200).json(
    {
    "action" : action,
    "result" : "error",
    "reqId"  : new Date().getTime().toString(), 
    "error"  : err
    });
  else if (action == "400_ordersList") {
    res.status(400).json({"errors": 
        [{
        "field":["hookahMasterId"],
        "location":"query",
        "messages":["One of the parameters: hookahMasterId or clientId should be included in the request"],
        "types":["any.required"]
        },
        {
        "field":["clientId"],
        "location":"query",
        "messages":["One of the parameters: hookahMasterId or clientId should be included in the request"],
        "types":["any.required"]
        }]});
  }
  else res.status(200).json(
    {
    "action" : action,
    "result" : "ok",
    "reqId"  : new Date().getTime().toString(), 
    "data"   : data
    });
}



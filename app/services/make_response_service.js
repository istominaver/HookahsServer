module.exports = function(action, res, data, err) {
  if(err) res.status(200).json(
    {
    "action" : action,
    "result" : "error",
    "reqId"  : new Date().getTime().toString(), 
    "error"    : err
    });
  else res.status(200).json(
    {
    "action" : action,
    "result" : "ok",
    "reqId"  : new Date().getTime().toString(), 
    "data"   : data
    });
}

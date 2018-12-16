const express = require('express')
const app = express();
const port = process.env.PORT || 8081;
const bodyParser = require('body-parser');
const ev = require('express-validation');

app.use(bodyParser.json());

app.use(function(err, req, res, next){
  if (err instanceof ev.ValidationError) return res.status(err.status).json(err);
  else {return res.status(500).send({"type":"application/json", "body":err.stack});}
});

require('./app/routes/client_routes')(app);
require('./app/routes/employee_routes')(app);

app.listen(port, () => {
  console.log('We are live on ' + port);
});

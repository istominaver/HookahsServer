const express = require('express')
const app = express();
const port = process.env.PORT || 8081;
const bodyParser = require('body-parser');

app.use(bodyParser.json());

require('./app/routes/client_routes')(app);

app.listen(port, () => {
  console.log('We are live on ' + port);
});

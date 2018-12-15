const randomStr = require('randomstring');
const bcrypt = require('bcrypt');
const validate = require('express-validation');
const validation = require('./validation/employee_routes');
const databaseService = require('../services/database_service');
const makeResponseService = require('../services/make_response_service');
module.exports = function(app) {
// module.exports = function(app) {

//   app.post('/auth', validate(validation.auth), function(req, res) {

//   const action = req.body.action;
//   const phone = req.body.phone;
//   const password = req.body.password;
//   const name = req.body.name;

//   const searchParams = {
//     Key: {
//       "phone": {
//         S: phone
//       }}
//   };

//     databaseService('clients', 'getItem', searchParams, function(resultObject, err) {
//       if(err) makeResponseService(action, res, {}, err);
//       else if (Object.keys(resultObject).length == 0) {
//         bcrypt.hash(password, 12, function(err, hash) {

//           const id = (new Date().getTime()).toString();
//           let params = {
//             'Item': {
//               "phone":                       {'S': phone},             
//               "password":                    {'S': hash},
//               "id":                          {'S': id},
//               "code":                        {'N': randomStr.generate({length: 6, charset: 'numeric'})},
//               "expires" :                    {'N': (new Date().getTime()/1000 + 300).toFixed(0)},
//               "enterConfirmationCodeCounter": {'N': '0'}
//             }
//           }
//           if(action == 'clientAuth') {
//             params.Item.name = {'S': name};
//           }

//           databaseService('clients','putItem', params, function(result, err) {
//             makeResponseService(action, res, {"id": id,"state": "needPhoneConfirmation"}, err);
//           });
//        });
//       }
//       else if(resultObject.confirmedPhone != "true") {
//         makeResponseService(action, res, {"id": resultObject.id,"state": "needPhoneConfirmation"}, err);

//         if(action == 'clientAuth') {
          
//           bcrypt.compare(password, resultObject.password, function(err, isEqual) {
//           if(name != resultObject.name || isEqual != true){
//             bcrypt.hash(password, 12, function(err, hash) {
//               const params = {
//                 ExpressionAttributeNames: {
//                   "#name": "name",
//                   "#password": "password"
//                 }, 
//                 ExpressionAttributeValues: {
//                   ":name": {
//                   S: name
//                   },
//                   ":password": {
//                     S: hash
//                   }
//                 }, 
//                 Key: {
//                   "phone": {
//                     S: phone
//                   }
//                 }, 
//                 UpdateExpression: "SET #name = :name, #password = :password"
//               };

//               databaseService('clients','updateItem', params, function(result, err) {});
//             });
//           }
//         });
//       }
//       }
//       else bcrypt.compare(password, resultObject.password, function(err, isEqual) {
//         if(isEqual == true) { 
//           //создать сессию для работника, определить роль, 
//           makeResponseService(action, res, { "id": resultObject.id, "state":"authorized" }, err);
//           if(action == 'clientAuth' && name != resultObject.name){
//             const params = {
//               ExpressionAttributeNames: {
//                 "#name": "name"
//               }, 
//               ExpressionAttributeValues: {
//                 ":name": {
//                   S: name
//                 }
//               }, 
//               Key: {
//                 "phone": {
//                   S: phone
//                 }
//               }, 
//               UpdateExpression: "SET #name = :name"
//             };

//             databaseService('clients','updateItem', params, function(result, err) {});
//           }
//         }
//         else {
//           makeResponseService(action, res, {}, {"errorType":"consumer","errorCode":"authIncomingDataError","errorText":'Не верный логин или пароль.'});
//         }
//       });      
//     });
//   });

//   app.post('/checkConfirmationCode', validate(validation.checkConfirmationCode), function(req, res) {
//   const action = 'checkConfirmationCode';
//   const phone = req.body.phone;
//   const confirmationCode = req.body.confirmationCode;

//      const searchParams = {
//       Key: {
//         "phone": {
//           S: phone
//         }}
//     };

//     databaseService('clients', 'getItem', searchParams, function(resultObject, err) {
//       if(err) makeResponseService(action, res, {}, err);
//       else if (Object.keys(resultObject).length == 0) {
//         makeResponseService(action, res, {}, {"errorType":"consumer","errorCode":"enterConfirmationCodeTimeout","errorText":'Срок действия временного кода истек.'});
//       }
//       else if(resultObject.confirmedPhone == "true") {
//         makeResponseService(action, res, {}, {"errorType":"consumer","errorCode":"alreadyСonfirmed","errorText":'Телефон подтвержден ранее, необходимо пройти авторизацию.'});
//       } 
//       else if(parseInt(confirmationCode) == resultObject.code) {
//         let params = {
//           'Item': {
//             'phone': {'S':phone},
//             'id': {'S':resultObject.id},
//             'password': {'S':resultObject.password},
//             'confirmedPhone': {'S':'true'}
//           }
//         };

//         if (resultObject.name) params.Item.name =  {'S':resultObject.name};

//         databaseService('clients','putItem', params, function(result, err) { 
//           makeResponseService(action, res, { "clientId": resultObject.clientId, "state":"authorized" }, err);
//        });
//       }
//       else if(resultObject.enterConfirmationCodeCounter < 3) {
//         makeResponseService(action, res, {}, {"errorType":"consumer","errorCode":"confirmationCodeInputError","errorText":'Неверный код подтверждения, попробуйте снова.'});

//         const params = {
//           ExpressionAttributeNames: {
//             "#eccc": "enterConfirmationCodeCounter"
//           }, 
//           ExpressionAttributeValues: {
//             ":eccc": {
//               N: (parseInt(resultObject.enterConfirmationCodeCounter) + 1).toString()
//             }
//           }, 
//           Key: {
//             "phone": {
//               S: phone
//             }
//           }, 
//           UpdateExpression: "SET #eccc = :eccc"
//         };

//         databaseService('clients','updateItem', params, function(result, err) {});
//       }
//       else if(resultObject.enterConfirmationCodeCounter >= 3) {
//          makeResponseService(action, res, {}, {"errorType":"consumer","errorCode":"confirmationCodeInputLimit","errorText":'Вы превысили допустимое количество попыток ввода кода подтверждения.'});
//       }
//     });

//   });

}


//профиль кальянщика + подтверждение

//в подтверждении телефона кальянщика получить профиль, роль и рест - отправить подтверждение админу - создать галочку confirmed roule
//добавление роли в последствии??
  
var smsc = require('./smsc_api.js');

smsc.configure({
    login : 'veronika.istomina',
    password : 'Yanika555555)',
    //ssl : true/false,
    //charset : 'utf-8',
});

// Проверка авторизации
smsc.test(function (err) {
    if (err) return console.log('error: ' + err);
    
});

// // Отправка e-mail
// smsc.send('mail', {
//     phones : 'alex@mysite.ru',
//     mes : 'Тестовое сообщение',
//     subj : 'Тема сообщения',
//     sender : 'alex2@mysite.ru',
// }, function (data, raw, err, code) {
//     if (err) return console.log(err, 'code: '+code);
//     console.log(data); // object
//     // console.log(raw); // string in JSON format
// });

// // Отправка MMS
// smsc.send('mms', {
//     phones : '79999999999',
//     mes : 'Тестовое сообщение',
//     fmt : 2,
//     files : [
//         'files/123.png'
//     ]
// }, function (data, raw, err, code) {
//     if (err) return console.log(err, 'code: '+code);
//     console.log(data); // object
//     // console.log(raw); // string in JSON format
// });

//Отправка списка SMS сообщений
smsc.send_sms({
    list : {
        '380504511016' : 'Hello, Alex!'
    }
}, function (data, raw, err, code) {
    if (err) return console.log(err, 'code: '+code);
    console.log(data); // object
    console.log(raw); // string in JSON format
});

// // Отправка SMS
// smsc.send_sms({
//     phones : ['380504511016'],
//     mes : 'Привет!',
//     cost : 1
// }, function (data, raw, err, code) {
//     if (err) return console.log(err, 'code: '+code);
//     console.log(data); // object
//     console.log(raw); // string in JSON format
// });

// // Обращение к скриптам API
// smsc.raw('send.php', {
//     phones : '79999999999,79999999999',
//     mes : 'Hello!'
// }, function (data, raw, err, code) {
// if (err) return console.log(err, 'code: '+code);
//     console.log(data); // object
//     console.log(raw); // string in JSON format
// });

// // Получение баланса
// smsc.get_balance(function (balance, raw, err, code) {
// if (err) return console.log(err, 'code: '+code);
//     console.log(balance);
// });

// // Получение статуса сообщений
// smsc.get_status({
//     phones : 79999999999,
//     id : 111,
//     all : 1
// }, function (status, raw, err, code) {
// if (err) return console.log(err, 'code: '+code);
//     console.log(status);
// });

// // Получение стоимости сообщений
// smsc.get_sms_cost({
//     phones : '79999999999',
//     mes : 'Hello, World!',
//     // cost : 1 // default 1
// }, function (status, raw, err, code) {
// if (err) return console.log(err, 'code: '+code);
//     console.log(raw);
// });

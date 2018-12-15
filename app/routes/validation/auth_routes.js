const Joi = require('joi');
 
module.exports = {
	auth: {
		body: {
		  phone : Joi.string().regex(/^(\d{6,14})$/).required(),
  	      password : Joi.string().regex(/^.\S{3,30}$/).required(), //что угодно без пробелов
		  name : Joi.string().regex(/^[а-яёa-z]{1,30}$/i).when('action',{is: 'client', then: Joi.string().required()}),
		  action : Joi.string().valid(['clientAuth', 'employeeAuth']).required()
		}
	},
	checkConfirmationCode: {
		body: {
  	  		phone : Joi.string().regex(/^(\d{6,14})$/).required(),
  	  		confirmationCode : Joi.string().regex(/^(\d{6})$/).required()
  		}
	}
}



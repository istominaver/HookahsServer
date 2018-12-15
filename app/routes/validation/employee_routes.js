const Joi = require('joi');
 
module.exports = {
	employeeAuth: {
		body: {
		  phone : Joi.string().regex(/^(\d{6,14})$/).required(),
  	      password : Joi.string().regex(/^.\S{3,30}$/).required(), //что угодно без пробелов
		}

	}
}
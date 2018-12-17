const Joi = require('joi');
 
module.exports = {
  hookahMenu: {
    query: {
      restaurantId: Joi.string().required()
    }
  },
  makeOrder: {
  	body: {
  		hookahs : Joi.array().items(
  					Joi.object().keys({
  						mixId : Joi.string().required(),
  						name : Joi.string().required(), 
  						categoryId : Joi.string().required(),
  						description : Joi.string().required(),
  						hookahBowl : Joi.string().required(),
  						imageURL : Joi.string().uri().trim().required(),
  						likes : Joi.number().positive().integer().required(),
  						price : Joi.number().positive().precision(2).required(),
  						strength : Joi.string().valid(['light', 'middle', 'strong']).required(), 
  						restaurantId : Joi.string().required(),
  						tabacco : Joi.array().items(
  									Joi.object().keys({
         								brand : Joi.string().required(),
         								sort : Joi.string().required()
                                           })) })),
  		hookahMasterId : Joi.string().required(), 
  		restaurantId : Joi.string().required(), 
  		amount : Joi.number().positive().precision(2).required(),
  		clientId : Joi.string().required(), 
  		clientName : Joi.string().required(), 
  		peopleCount : Joi.number().positive().integer().required(),
  		phoneNumber : Joi.string().regex(/^380(\d{9})$/).required(),
  		tableNumber : Joi.number().positive().integer().required(),
  		dueDate : Joi.date().min('now')
                                       
  	}
  },
  clientAuth: {
  	body: {
  	  phone : Joi.string().regex(/^380(\d{9})$/).required(), 
  	  name : Joi.string().regex(/^[а-яёa-z]{1,30}$/i).required()
  	}
  },
  checkConfirmationCode: {
    body: {
  	  phone : Joi.string().regex(/^380(\d{9})$/).required(),
  	  confirmationCode : Joi.string().regex(/^(\d{6})$/).required()
  	}
  }
};

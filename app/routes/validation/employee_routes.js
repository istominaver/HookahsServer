const Joi = require('joi');
 
module.exports = {
	hookahMix: {
		body: {
			mixId : Joi.string().optional(),
  			name : Joi.string().required(), 
  			categoryId : Joi.string().required(),
  			description : Joi.string().required(),
  			hookahBowl : Joi.string().required(),
  			imageURL : Joi.string().uri().trim().required(),
  			price : Joi.number().positive().precision(2).required(),
  			strength : Joi.string().valid(['light', 'middle', 'strong']).required(), 
  			restaurantId : Joi.string().required(),
  			tabacco : Joi.array().items(
  				Joi.object().keys({
         			brand : Joi.string().required(),
         			sort : Joi.string().required()
                                           })),
  			hookahMasterId : Joi.string().required()
		 }

	}
}
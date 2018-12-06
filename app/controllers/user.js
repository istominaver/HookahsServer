const User = require('./models/user')
exports.createUser = (req, res, next) => {
  /** Here you need to validate user input. 
   Let's say only Name and email are required field
 */
  
  const { userName, email, phone, status } = req.body
  if (userName && email &&  isValidEmail(email)) { 
    
    // isValidEmail is some custom email function to validate email which you might need write on your own or use npm module
    User.create({
      userName,
      email,
      phone,
      status,   
    })
    .then(user => res.json(user))
    .catch(next)
  }
}
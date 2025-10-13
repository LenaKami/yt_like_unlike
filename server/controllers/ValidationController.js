const { check, validationResult } = require('express-validator')

exports.validationRegister = [
    check('login').trim().not().isEmpty().withMessage('Name is required.'),
    check('password').trim().isLength({ min: 7 }).withMessage('Password must be at least 7 characters long.'),
    check('password').trim().not().isEmpty().withMessage('Password is required.'),
    check('password').trim().isLength({ min: 7 }).withMessage('Password must be at least 7 characters long.'),
    check('email').trim().not().isEmpty().withMessage('E-mail is required.'),
    check('email').trim().isEmail().withMessage('Invalid e-mail address.')
];

exports.checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            data: req.body,
            errors: errors.mapped()
        });
    }
    next();
};
var jwt = require("jsonwebtoken");
var dotenv = require("dotenv");
dotenv.config();
var jwksRsa = require("jwks-rsa");
const REGION = "us-east-1";
const USER_POOL_ID = "us-east-1_ABC123XYZ";

const client = jwksRsa({
  jwksUri: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
});

module.exports = {
  async authenticate(req, res, next) {
    const authHeader = req.headers;
    const token = authHeader["authorization"];
    if (token == null || token == "")
      return res.status(401).json({ message: "Unauthorized" });

    const db = require("../database/db");
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, user) => {
      if (err) return res.status(403).json({ message: "Token is not valid" });
      req.user = user;
      // Aktualizacja daty ostatniej aktywności
      if (user && user.email) {
        try {
          await db
            .promise()
            .query("UPDATE Users SET last_active = NOW() WHERE email = ?", [
              user.email,
            ]);
        } catch (e) {
          console.error("Błąd aktualizacji last_active:", e.message);
        }
      }
      next();
    });
  },
};

// // Ustaw swój region i user pool id

// function getKey(header, callback) {
//   client.getSigningKey(header.kid, function (err, key) {
//     const signingKey = key.getPublicKey();
//     callback(null, signingKey);
//   });
// }

// function verifyCognitoToken(req, res, next) {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) return res.status(401).json({ message: 'Brak tokena' });

//   jwt.verify(token, getKey, {
//     algorithms: ['RS256'],
//   }, (err, decoded) => {
//     if (err) return res.status(403).json({ message: 'Token nieważny' });

//     req.user = decoded;
//     next();
//   });
// }

// module.exports = verifyCognitoToken;
// var jwt = require('jsonwebtoken')
// var dotenv = require('dotenv')
// dotenv.config()
// var jwksRsa = require('jwks-rsa');
// const REGION = 'us-east-1';
// const USER_POOL_ID = 'us-east-1_aiVs7MIrU';

// const client = jwksRsa({
//   jwksUri: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`,
//   cache: true,
//   rateLimit: true,
// });

// module.exports = {
//     async authenticate(req, res, next) {
//         const authHeader = req.headers
//         const token = authHeader['authorization']
//         if (token == null || token == '') return res.status(401).json({ message: 'Unauthorized' })

//             jwt.verify(token, getKey, {
//                 algorithms: ['RS256'],
//               }, (err, decoded) => {
//                 if (err) return res.status(403).json({ message: 'Token nieważny' });

//                 req.user = decoded;
//                 next();
//               });
//     }
// }

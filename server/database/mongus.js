const mongoose = require("mongoose")

const a = mongoose.connect("mongodb://localhost:27017/yt"
, { useNewUrlParser: true })
    .then((result) => {
    console.log("Połączono z bazą")
    }).catch((err) => {
    console.log("Nie można połączyć się z MongoDB. Błąd: " + err)
   })

   module.exports = a;
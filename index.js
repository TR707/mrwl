const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const multer  = require('multer');
const mimeParser = multer();
app.use(cors());

const MongoClient = require('mongodb').MongoClient;
const mongoURL = 'mongodb://localhost:27017/mrwldb';
const collectionName = 'suscriptores';
const collectionName2 = 'sugerencias';
var db, colSubscriptions, colSuggestions;
MongoClient.connect(mongoURL)
  .then(
     client => {
      db = client.db();
      colSubscriptions = db.collection(collectionName);
      colSuggestions = db.collection(collectionName2); 
     }
  )

const port= process.env.PORT || 3000;;

app.use(express.static(__dirname + '/public'));

app.post('/subscribe/',mimeParser.none(),async (req,res) => {
  var email= req.body.email;
  console.log(`email: ${req.body.email}`)
  var nuevoSuscriptor = {email: email};
  var response = await colSubscriptions.insertOne(nuevoSuscriptor);
  console.log('** Suscriptor insertado...');
  res.send('Gracias por unirte')
})

app.post('/suggest/',mimeParser.none(),async (req,res) => {
  var propuesta= req.body.propuesta;
  console.log(`propuesta: ${req.body.propuesta}`)
  var nuevaSugerencia = {propuesta: propuesta};
  var response = await colSuggestions.insertOne(nuevaSugerencia);
  console.log('** Sugerencia insertada...');
  res.send('Gracias por tu sugerencia')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})


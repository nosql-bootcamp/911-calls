const {
    MongoClient
} = require('mongodb');
const csv = require('csv-parser');
const fs = require('fs');
const {
    mainModule
} = require('process');

const MONGO_URL = 'mongodb://localhost:27017/';
const DB_NAME = '911-calls';
const COLLECTION_NAME = 'calls';

MongoClient.connect(MONGO_URL, {
    useUnifiedTopology: true
}, (err, client) => {
    if (err) {
        console.error(err);
        throw err;
    }
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    console.log("QUESTION 1: Compter le nombre d'appels par catégorie")
    collection.find({title: {$regex: /EMS/}}).count().then((data) => console.log("EMS: " + data))
    collection.find({title: {$regex: /Fire/}}).count().then((data) => console.log("Fire: " + data))
    collection.find({title: {$regex: /Traffic/}}).count().then((data) => console.log("Traffic: " + data))



    //End connection
    client.close();
});
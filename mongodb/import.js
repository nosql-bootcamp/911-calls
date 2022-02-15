const {
  MongoClient
} = require('mongodb');
const csv = require('csv-parser');
const fs = require('fs');
const {
  mainModule
} = require('process');

const MONGO_URL = 'mongodb+srv://quentin:quentin@nosqlbootcamp.doc1p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
const DB_NAME = '911-calls';
const COLLECTION_NAME = 'calls';

const insertCalls = async function (db, callback) {
  const collection = db.collection(COLLECTION_NAME);
  await dropCollectionIfExists(db, collection);

  const calls = [];
  fs.createReadStream('../911.csv')
    .pipe(csv())
    .on('data', data => {
      const call = {
        ... data
      };
      call.location = {type: "Point", coordinates: [parseFloat(call.lng), parseFloat(call.lat)]}
      delete(call.lng)
      delete(call.lat)
      calls.push(call);
    })
    .on('end', () => {
      collection.insertMany(calls, (err, result) => {
        console.log(err)
        console.log("Creating index...")
        collection.createIndex({ location: "2dsphere"}, (err, result2) => {
          if(err) {
            console.log("Failed to create index", err)
          } else {
            console.log("index created")
          }
          callback(result)
        })
      });
    });
}

MongoClient.connect(MONGO_URL, {
  useUnifiedTopology: true
}, (err, client) => {
  if (err) {
    console.error(err);
    throw err;
  }
  const db = client.db(DB_NAME);
  insertCalls(db, result => {
    console.log(`${result.insertedCount} calls inserted`);
    client.close();
  });
});

async function dropCollectionIfExists(db, collection) {
  const matchingCollections = await db.listCollections({name: COLLECTION_NAME}).toArray();
  if (matchingCollections.length > 0) {
    console.log("dropping collection...")
    await collection.drop();
    console.log("collection dropped")
  }
}

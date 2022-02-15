const {
  MongoClient
} = require('mongodb');

const MONGO_URL = 'mongodb+srv://quentin:quentin@nosqlbootcamp.doc1p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
const DB_NAME = '911-calls';
const COLLECTION_NAME = 'calls';

const getCallsGroupedByCategory = async (collection) => {
  const result = await collection.aggregate([
    {$project: {
      category: {$first: { $split: ["$title", ":"] }},
    }},
    {$group: { 
      _id: "$category",
      occurences: { $sum: 1}
    }}
  ]).toArray()
  console.log("Calls by category:")
  console.log(result)
}

const get3MaxCallMonths = async collection => {
  const result = await collection.aggregate([
    {$project: {
      month: {$substr: ["$timeStamp", 0, 7]},
    }},
    {$group: { 
       _id: "$month",
       occurences: { $sum: 1}
    }}
  ])
    .sort({occurences: -1})
    .limit(3)
    .toArray()
  console.log("3 months with the most calls:")
  console.log(result)
}

const get3TownsWithMaxOverdoses = async collection => {
  const result = await collection.aggregate([
    {$match: { title: "EMS: OVERDOSE"}},
    {$project: {
      twp: 1
    }},
    {$group: { 
       _id: "$twp",
       occurences: { $sum: 1}
    }}
  ])
    .sort({occurences: -1})
    .limit(3)
    .toArray()
  console.log("3 towns with the most overdoses:")
  console.log(result)
}

const getCallsAroundLansdale = async collection => {
  const result = await collection.find({
    location: { 
      $near: { 
        $geometry: { type: "Point",  coordinates: [ -75.283783, 40.241493 ] },
        $minDistance: 0,
        $maxDistance: 500
      }
    }
  }).count();
  console.log("Number off call around Lansdale:")
  console.log(result)
}

const runQueries = async (db, callback) => {
  const collection = db.collection(COLLECTION_NAME);

  await getCallsGroupedByCategory(collection);
  await get3MaxCallMonths(collection);
  await get3TownsWithMaxOverdoses(collection)
  await getCallsAroundLansdale(collection)


  callback();
}


  MongoClient.connect(MONGO_URL, {
    useUnifiedTopology: true
  }, async (err, client) => {
    if (err) {
      console.error(err);
      throw err;
    }
    const db = client.db(DB_NAME);
    await runQueries(db, result => {
      client.close();
    });
  });
const csv = require('csv-parser');
const fs = require('fs');
const { Client } = require('@elastic/elasticsearch');
const { cp } = require('fs/promises');
const ELASTIC_SEARCH_URI = 'https://moisanimt.es.us-east4.gcp.elastic-cloud.com:9243';
const INDEX_NAME = '911-calls';
async function run() {
  const client = new Client({ node: ELASTIC_SEARCH_URI, auth: { username: "elastic", password: "f6103hE44GIaPCZem1cnpUx3" } });
  // Drop index if exists
  await client.indices.delete({
    index: INDEX_NAME,
    ignore_unavailable: true
  });
  await client.indices.create({
    index: INDEX_NAME,
    body: {
      "mappings": {
        "properties": {
          "geo": { "type": "geo_point" },
          "timeStamp": {
            "type": "date",
            "format": "yyyy-MM-dd"
          },
          "title": { "type": "keyword" },
          "twp": { "type": "keyword" }
        }
      }
    }
  });
  let callz = [];
  let calls = [];
  fs.createReadStream('../911.csv')
    .pipe(csv())
    .on('data', data => {
      calls.push({
        //lat,lng,desc,zip,title,timeStamp,twp,addr,e
        geo: { lat: Number(data.lat), lon: Number(data.lng) },
        timeStamp: data.timeStamp.split(" ")[0],
        title: data.title,
        twp: data.twp
      });
      // TODO créer l'objet call à partir de la ligne
    })
    .on('end', async () => {
      console.log(calls[0])
      for (let i = 0; i < 160; i++) {
        callz.push(calls.slice(i * 1000, (i + 1) * 1000));
        console.log(i)
      }
      total = 0;
      for (i in callz) {
        await client.bulk(createBulkInsertQuery(callz[i]));
        console.log("Inserted " + i);
      }
      client.close();
    });
  function createBulkInsertQuery(calls) {
    const body = calls.reduce((acc, call) => {
      const { geo, timeStamp, title, twp } = call;
      acc.push({ index: { _index: INDEX_NAME } })
      acc.push({ call })
      return acc
    }, []);
    return { body };
  }
}
run().catch(console.log);
const csv = require('csv-parser');
const fs = require('fs');
const { Client } = require('@elastic/elasticsearch');
const { Readable } = require('stream');

const ELASTIC_SEARCH_URI = 'http://localhost:9200';
const INDEX_NAME = '911-calls';

async function run() {
  const client = new Client({ node: ELASTIC_SEARCH_URI});

  // Drop index if exists
  await client.indices.delete({
    index: INDEX_NAME,
    ignore_unavailable: true
  });

  await client.indices.create({
    index: INDEX_NAME,
    body : {
      // TODO configurer l'index https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html
      mappings: {
        properties: {
          "location": { "type": "geo_point" }
        }
      }
    }
  });

  let calls = [];
  fs.createReadStream('../911.csv')
    .pipe(csv())
    .on('data', data => {
      calls.push({
        type: data.title.split(':')[0],
        overdose: data.title.startsWith('EMS: OVERDOSE'),
        location: {
          lat: data.lat,
          lon: data.lng,
        },
        desc: data.desc,
        zip: data.zip,
        title: data.title,
        timeStamp: data.timeStamp.split(' ')[0],
        twp: data.twp,
        addr: data.addr
      });
    })
    .on('end', async () => {
      const result = await client.helpers.bulk({
        datasource: Readable.from(calls),
        onDocument (doc) {
          return {
            index: { _index: INDEX_NAME },
            create: { doc }
          }
        }
      });
    
      console.log(result);
      client.close();
    });
}

run().catch(console.log);

// Fonction utilitaire permettant de formatter les données pour l'insertion "bulk" dans elastic
function createBulkInsertQuery(calls) {
  const body = calls.reduce((acc, call) => {
    acc.push({ index: { _index: INDEX_NAME } })
    acc.push(call)
    return acc
  }, []);

  return { body };
}

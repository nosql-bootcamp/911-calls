//const elasticsearch = require('elasticsearch');
const csv = require('csv-parser');
const fs = require('fs');
const {
  Readable
} = require('stream');
const {
  Client
} = require('@elastic/elasticsearch');

const ELASTIC_SEARCH_URI = 'http://localhost:9200';
const INDEX_NAME = '911-calls';

async function run() {
  const client = new Client({
    node: ELASTIC_SEARCH_URI
  });

  // Drop index if exists
  await client.indices.delete({
    index: INDEX_NAME,
    ignore_unavailable: true
  });

  await client.indices.create({
    index: INDEX_NAME,
    body: {
      // TODO configurer l'index https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html
      mappings: {
        properties: {
          title: {
            "type": 'keyword'
          },
          date: {
            "type": 'date',
            "format": "yyyy-MM-dd"
          },
          location: {
            "type": "geo_point"
          }
        }
      }
    }
  });

  let calls = [];

  fs.createReadStream('../911.csv')
    .pipe(csv())
    .on('data', data => {

      const cat = data.title.split(':');
      const date = data.timeStamp.split(' ');

      const call = {
        description: data.desc,
        city: data.twp,
        title: cat[1],
        cat: cat[0],
        date: date[0],
        location: {
          lon: Number(data.lng),
          lat: Number(data.lat)
        }
      };

      calls.push(call);
      // TODO créer l'objet call à partir de la ligne
    })
    .on('end', async () => {
      // TODO insérer les données dans ES en utilisant l'API de bulk https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-bulk.html
      const client = new Client({
        node: ELASTIC_SEARCH_URI
      })

      const result = await client.helpers.bulk({
        datasource: Readable.from(calls),
        onDocument(doc) {
          return {
            index: {
              _index: INDEX_NAME
            }
          }
        }
      });

      const {
        body: count
      } = await client.count();
      console.log(count)
    });

}

run().catch(console.log);
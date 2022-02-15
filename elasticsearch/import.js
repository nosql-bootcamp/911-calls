//const elasticsearch = require('elasticsearch');
const csv = require('csv-parser');
const fs = require('fs');
const { Client } = require('@elastic/elasticsearch');

const ELASTIC_SEARCH_URI = 'http://localhost:9200';
const INDEX_NAME = '911-calls';

async function run() {
  const client = new Client({ node: ELASTIC_SEARCH_URI });
  await client.deleteByQuery({
    index: INDEX_NAME,
    body: { query: { match_all: {} } },
    ignore_unavailable: true
  })
  // Drop index if exists
  await client.indices.delete({
    index: INDEX_NAME,
    ignore_unavailable: true
  });

  await client.indices.create({
    index: INDEX_NAME,
    // TODO configurer l'index https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html
    body: {
      mappings: {
        properties: {
          yearMonth: { type: 'keyword' },
          title: { type: 'keyword' },
          twp: { type: 'keyword' },
          category: { type: 'keyword' },
          location: { type: 'geo_point' },
          timeStamp: { type: 'date' }
        }
      }
    }
  });

  const calls = []
  fs.createReadStream('../911.csv')
    .pipe(csv())
    .on('data', data => {
      // TODO créer l'objet call à partir de la ligne
      const date = new Date(data.timeStamp)
      const call = {
        ...data,
        category: data.title.split(':')[0],
        yearMonth: `${date.getFullYear()}-${date.getMonth() + 1}`,
        location: [parseFloat(data.lng), parseFloat(data.lat)],
        timeStamp: new Date(data.timeStamp).toJSON().replace('.000Z', 'Z')
      }
      calls.push(call)
    })
    .on('end', async () => {
      // TODO insérer les données dans ES en utilisant l'API de bulk https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-bulk.html
      const data = [...calls.slice(0, 10000), ...calls.slice(50000, 60000), ...calls.slice(100000, 110000)]
      client.bulk(createBulkInsertQuery(data), (err, resp) => {
        if (err) console.trace(err.message)
        else console.log(`Inserted ${resp.body.items.length} lines`)
        client.close()
      })
    });
}

function createBulkInsertQuery(rows) {
  const body = rows.reduce((acc, row) => {
    acc.push({ index: { _index: INDEX_NAME /*, _type: '_doc'*/ } })
    acc.push({ ...row })
    return acc
  }, [])

  return { body }
}

run().catch(console.log);



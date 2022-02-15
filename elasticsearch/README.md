# 911 Calls avec ElasticSearch

## Import du jeu de données

Pour importer le jeu de données, complétez le script `import.js` (ici aussi, cherchez le `TODO` dans le code :wink:).

Exécutez-le ensuite :

```bash
npm install
node import.js
```

Vérifiez que les données ont été importées correctement grâce au shell (le nombre total de documents doit être `153194`) :

```
GET <nom de votre index>/_count
```

## Requêtes

À vous de jouer ! Écrivez les requêtes ElasticSearch permettant de résoudre les problèmes posés.

```
TODO : ajouter les requêtes ElasticSearch ici

```
1)

GET 911-calls/_count?q=cat:EMS
GET 911-calls/_count?q=cat:Fire
GET 911-calls/_count?q=cat:Traffic


2)

GET /911-calls/_search
{
  "size": 0,
  "aggs": {
    "calls_per_month": {
      "date_histogram": {
        "field": "date",
        "calendar_interval": "month",
        "format": "MM/yyyy",
           "order": {
          "_count": "desc"
        }
      },
      "aggs": {
        "bucket_truncate": {
          "bucket_sort": {
            "size": 3
          }
        }
      }
    }
  }
}

3)

GET /911-calls/_search
{
  "size": 0,
  "query": {
    "match": {
      "title": {
        "query": " OVERDOSE"
      }
    }
  },
  "aggs":{
    "cities":{
      "terms": {
        "field": "city.keyword",
        "size": 3,
        "order": {
          "_count": "desc"
      }
      }
    
    }
  }
}


4)

GET /911-calls/_count
{
  "query": {
    "bool": {
      "must": {
        "match_all": {}
      },
      "filter": {
        "geo_distance": {
          "distance": "500m",
          "location": "40.241493, -75.283783"
        }
      }
    }
  }
}



## Kibana

Dans Kibana, créez un dashboard qui permet de visualiser :

* Une carte de l'ensemble des appels
* Un histogramme des appels répartis par catégories
* Un Pie chart réparti par mois, par catégories et par canton (township)

Pour nous permettre d'évaluer votre travail, ajoutez une capture d'écran du dashboard dans ce répertoire [images](images).

### Bonus : Timelion
Timelion est un outil de visualisation des timeseries accessible via Kibana à l'aide du bouton : ![](images/timelion.png)

Réalisez le diagramme suivant :
![](images/timelion-chart.png)

Envoyer la réponse sous la forme de la requête Timelion ci-dessous:  

```
TODO : ajouter la requête Timelion ici
```

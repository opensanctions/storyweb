# StoryWeb

StoryWeb is a project aimed to extract networks of entities from journalistic reporting. The idea is to reverse engineer stories into structured graphs of the persons and companies involved, and to capture the relationships between them.

https://storyweb.opensanctions.org


## Install

`spaCy` models: 

```bash
python -m spacy download en_core_web_trf
```


## Queries


```sql
SELECT MAX(x.label), SUM(x.count)
	FROM tag t LEFT JOIN tag x ON x.article = t.article AND x.fingerprint <> t.fingerprint
	WHERE t.fingerprint = 'putin-vladimir'
	GROUP BY x.fingerprint
	ORDER BY SUM(x.count) DESC;
```
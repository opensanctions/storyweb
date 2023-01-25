# StoryWeb

StoryWeb is a project aimed to extract networks of entities from journalistic reporting. The idea is to reverse engineer stories into structured graphs of the persons and companies involved, and to capture the relationships between them.

https://storyweb.opensanctions.org

StoryWeb consumes news articles as input data. Individual articles can be imported via the web interface, but there's also a possibility for bulk import using the [`articledata`](https://github.com/pudo/articledata) micro-format. One producer of `articledata` files is [`mediacrawl`](), which can be used to crawl news websites and harvest all of their articles.


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

Co-occurrence-based overlap:
```sql
SELECT lt.article, ot.article, ARRAY_AGG(DISTINCT oi.label), COUNT(oi.id) FROM tag lt
	JOIN tag li ON lt.article = li.article AND lt.fingerprint <> li.fingerprint
	JOIN tag oi ON oi.fingerprint = li.fingerprint AND oi.article <> li.article
	JOIN tag ot ON oi.article = ot.article AND ot.fingerprint = lt.fingerprint
	WHERE lt.fingerprint = 'joseph-kabila'
		AND lt.article = '952b219a70f0d2b77c599ea29194afaa371cd6ca'
		--- or use cluster ID :) 
		AND ot.article IS NOT NULL
	GROUP BY lt.article, ot.article
	ORDER BY COUNT(oi.id) DESC;
```

Super slow for big clusters:
```sql
SELECT ot.article, ARRAY_AGG(DISTINCT oi.label), COUNT(oi.id)
	FROM tag lt
	JOIN tag li ON lt.article = li.article AND lt.fingerprint <> li.fingerprint
	JOIN tag oi ON oi.fingerprint = li.fingerprint AND oi.article <> li.article
	JOIN tag ot ON oi.article = ot.article AND ot.fingerprint = lt.fingerprint
	WHERE lt.cluster = 'fd92409b09f910d3a943820621cd56d90e3faacc'
	GROUP BY ot.article
	ORDER BY COUNT(oi.id) DESC;
```

```sql
SELECT ot.article, ARRAY_AGG(DISTINCT oi.label), COUNT(oi.id)
	FROM tag lt
	JOIN tag li ON lt.article = li.article
	JOIN tag oi ON oi.fingerprint = li.fingerprint
	JOIN tag ot ON oi.article = ot.article AND ot.fingerprint = lt.fingerprint
	WHERE
		lt.cluster = 'fd92409b09f910d3a943820621cd56d90e3faacc'
		AND lt.fingerprint <> li.fingerprint
		AND oi.article <> li.article
	GROUP BY ot.article
	ORDER BY COUNT(oi.id) DESC;
```

```sql
WITH corefs AS (
	SELECT li.fingerprint AS fingerprint, SUM(li.frequency * idf.frequency) AS weight
		FROM tag lt
		JOIN tag li ON lt.article = li.article
		JOIN fingerprint_idf idf ON idf.fingerprint = li.fingerprint
		WHERE
			lt.cluster = 'fd92409b09f910d3a943820621cd56d90e3faacc'
			AND lt.fingerprint <> li.fingerprint
		GROUP BY li.fingerprint
		ORDER BY AVG(li.frequency) DESC
),
fps AS (
	SELECT DISTINCT t.fingerprint AS fp FROM tag t WHERE t.cluster = 'fd92409b09f910d3a943820621cd56d90e3faacc'
)
SELECT ot.cluster, SUM(r.weight) FROM corefs r
	JOIN tag oi ON oi.fingerprint = r.fingerprint
	JOIN tag ot ON oi.article = ot.article
	JOIN fps f ON ot.fingerprint = f.fp
		WHERE ot.cluster <> 'fd92409b09f910d3a943820621cd56d90e3faacc'
	GROUP BY ot.cluster
	ORDER BY SUM(r.weight * (oi.frequency * f.frequency)) DESC;
```
```sql
SELECT ARRAY_AGG(DISTINCT t.text), MAX(t.category), t.key, COUNT(DISTINCT t.ref_id) FROM tag t LEFT JOIN ref r ON r.id = t.ref_id WHERE r.site = 'occrp' AND t.category = 'PERSON' GROUP BY t.key ORDER BY COUNT(DISTINCT t.ref_id) DESC;
```

```sql
SELECT ARRAY_AGG(DISTINCT t.text), MAX(t.category), t.key, COUNT(DISTINCT t.ref_id) FROM tag t LEFT JOIN ref r ON r.id = t.ref_id LEFT JOIN tag o ON o.ref_id = r.id WHERE r.site = 'occrp' AND o.key <> t.key AND t.category IN ('PERSON', 'ORG') AND o.key = 'person:eliza-hannon-ronalds' GROUP BY t.key ORDER BY COUNT(DISTINCT t.ref_id) DESC;
```

```sql
WITH RECURSIVE connected(node) AS (
	SELECT l.target AS node FROM link AS l WHERE l.source = 'ed8dbdf78cd14397a89d25f0b1f68185' AND l.type = 'SAME'
	UNION
	SELECT l.source AS node FROM link AS l WHERE l.target = 'ed8dbdf78cd14397a89d25f0b1f68185' AND l.type = 'SAME'
	-- UNION
	-- SELECT l.source AS node FROM link AS l JOIN connected AS c ON c.node = l.target WHERE l.type = 'SAME'
	UNION
	SELECT l.target AS node FROM link AS l JOIN connected AS c ON c.node = l.source WHERE l.type = 'SAME'
)
SELECT connected.node FROM connected;
```

```sql
SELECT MAX(label), SUM(count) FROM tag GROUP BY fingerprint ORDER BY SUM(count) DESC;
```


```sql
WITH RECURSIVE connected(node) AS
(
SELECT l.target AS node FROM link AS l WHERE l.source = '0736c0b50a0008527a6a880bbc88aff04cfc067c' AND l.type = 'SAME'
UNION
SELECT l.source AS node FROM link AS l WHERE l.target = '0736c0b50a0008527a6a880bbc88aff04cfc067c' AND l.type = 'SAME'
UNION
SELECT l.target AS node FROM link AS l JOIN connected AS c ON c.node = l.source WHERE l.type = 'SAME'
)
SELECT connected.node
FROM connected;
```

```sql
WITH RECURSIVE connected(source, target) AS
(
SELECT l.source AS source, l.target AS target
	FROM link AS l
	WHERE (l.source = '0736c0b50a0008527a6a880bbc88aff04cfc067c' OR l.target = 'c0b50a0008527a6a880bbc88aff04cfc067c')
		AND l.type = 'SAME'
UNION
SELECT l.source AS source, l.target AS target
	FROM link AS l JOIN connected AS c ON (c.source = l.source OR c.target = l.source OR c.source = l.target OR c.target = l.target)
	WHERE l.type = 'SAME'
)
SELECT *
FROM connected;
```

```sql
SELECT x.fingerprint, SUM(x.frequency * idf.frequency)
	FROM tag t
		LEFT JOIN tag x ON x.article = t.article AND x.fingerprint <> t.fingerprint
		LEFT JOIN fingerprint_idf idf ON idf.fingerprint = x.fingerprint
	WHERE t.fingerprint = 'joseph-kabila'
	GROUP BY x.fingerprint
	ORDER BY SUM(x.frequency * idf.frequency) DESC;
```

```sql
SELECT ot.article, ARRAY_AGG(DISTINCT oi.label), COUNT(oi.id)
	FROM tag lt
	LEFT JOIN tag li ON lt.article = li.article AND lt.fingerprint <> li.fingerprint
	LEFT JOIN tag oi ON oi.fingerprint = li.fingerprint AND oi.article <> li.article
	LEFT JOIN tag ot ON oi.article = ot.article AND ot.fingerprint = lt.fingerprint
	WHERE lt.cluster = 'fd92409b09f910d3a943820621cd56d90e3faacc'
		AND ot.article IS NOT NULL
	GROUP BY ot.article
	ORDER BY COUNT(oi.id) DESC;
```
	
```sql
SELECT lt.cluster, ot.cluster, ARRAY_AGG(DISTINCT oi.label), COUNT(oi.id), SUM((oi.frequency * li.frequency) * idf.frequency)  FROM tag lt
	JOIN tag li ON lt.article = li.article AND lt.fingerprint <> li.fingerprint
	JOIN tag oi ON oi.fingerprint = li.fingerprint AND oi.article <> li.article
	JOIN fingerprint_idf idf ON idf.fingerprint = li.fingerprint
	JOIN tag ot ON oi.article = ot.article AND ot.fingerprint = lt.fingerprint
	WHERE lt.fingerprint = 'joseph-kabila'
		AND lt.article = '952b219a70f0d2b77c599ea29194afaa371cd6ca'
		--- or use cluster ID :) 
	GROUP BY lt.cluster, ot.cluster
	ORDER BY COUNT(oi.id) DESC;
```

```sql
WITH corefs AS (
SELECT li.fingerprint AS fingerprint, SUM(li.frequency * idf.frequency) AS weight
	FROM tag lt
	JOIN tag li ON lt.article = li.article
	JOIN fingerprint_idf idf ON idf.fingerprint = li.fingerprint
	WHERE
		lt.cluster = 'f0d165e0152882ad55a3a82d3948dad86ebf8c67'
		AND lt.fingerprint <> li.fingerprint
	GROUP BY li.fingerprint
	ORDER BY AVG(li.frequency) DESC
),
fps AS (
	SELECT DISTINCT t.fingerprint AS fp FROM tag t WHERE t.cluster = 'f0d165e0152882ad55a3a82d3948dad86ebf8c67'
)
SELECT ot.cluster, MAX(ot.label), ARRAY_AGG(oi.label), COUNT(oi.id), SUM(r.weight * (oi.frequency * idf.frequency))
	FROM corefs r
	JOIN tag oi ON oi.fingerprint = r.fingerprint
	JOIN tag ot ON oi.article = ot.article
	JOIN fps f ON ot.fingerprint = f.fp
	JOIN fingerprint_idf idf ON idf.fingerprint = oi.fingerprint
		WHERE ot.cluster <> 'f0d165e0152882ad55a3a82d3948dad86ebf8c67'
	GROUP BY ot.cluster
	ORDER BY SUM(r.weight * (oi.frequency * idf.frequency)) DESC;
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
	
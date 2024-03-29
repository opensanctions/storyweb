### Basic co-occurrence

Persons that show up in this source, key-merged:

```sql
SELECT ARRAY_AGG(DISTINCT t.text), MAX(t.category), t.key, COUNT(DISTINCT t.ref_id)
	FROM tag t
		LEFT JOIN ref r ON r.id = t.ref_id
	WHERE r.site = 'occrp' AND t.category = 'PERSON'
	GROUP BY t.key
	ORDER BY COUNT(DISTINCT t.ref_id) DESC;
```

By tag key:

```sql
SELECT MAX(x.label), SUM(x.count)
	FROM tag t LEFT JOIN tag x ON x.article = t.article AND x.fingerprint <> t.fingerprint
	WHERE t.fingerprint = 'putin-vladimir'
	GROUP BY x.fingerprint
	ORDER BY SUM(x.count) DESC;
```

Entities that show up alongside this person:

```sql
SELECT ARRAY_AGG(DISTINCT t.text), MAX(t.category), t.key, COUNT(DISTINCT t.ref_id)
	FROM tag t
		LEFT JOIN ref r ON r.id = t.ref_id
		LEFT JOIN tag o ON o.ref_id = r.id
	WHERE r.site = 'occrp' AND o.key <> t.key AND t.category IN ('PERSON', 'ORG') AND o.key = 'person:eliza-hannon-ronalds'
	GROUP BY t.key
	ORDER BY COUNT(DISTINCT t.ref_id) DESC;
```

### Compute connected components inside of SQL

This would speed up generating cluster IDs by traversing SAME_AS edges signficantly:

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

### Compute TF/IDF on co-occurrence

Inverse document scores have been loaded into the `fingerprint_idf` table during import:

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

CTE for improved performance:

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


## Sentences that are links

```sql
SELECT sent.text AS sentence, src.label AS src_label, tgt.label AS tgt_label, l.type AS link_type
	FROM link l
	LEFT JOIN tag src ON l.source_cluster = src.cluster
	LEFT JOIN tag tgt ON l.target_cluster = tgt.cluster
	LEFT JOIN tag_sentence src_sent ON src_sent.tag = src.id
	LEFT JOIN tag_sentence tgt_sent ON tgt_sent.tag = tgt.id
	LEFT JOIN sentence sent ON src_sent.article = sent.article AND src_sent.sentence = sent.sequence
	WHERE
		l.type NOT IN ('SAME', 'UNRELATED', 'LOCATED', 'OBSERVER')
		AND src_sent.article = tgt_sent.article
		AND src_sent.sentence = tgt_sent.sentence
		;
```
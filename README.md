# StoryWeb

StoryWeb is a project aimed to extract networks of entities from journalistic reporting. The idea is to reverse engineer stories into structured graphs of the persons and companies involved, and to capture the relationships between them.

https://storyweb.opensanctions.org


## Install

`spaCy` models: 

```bash
python -m spacy download en_core_web_trf
```


## Queries

See top people mentioned in OCCRP reporting:

```sql
SELECT ARRAY_AGG(DISTINCT t.text), MAX(t.category), t.key, COUNT(DISTINCT t.ref_id) FROM tag t LEFT JOIN ref r ON r.id = t.ref_id WHERE r.site = 'occrp' AND t.category = 'PERSON' GROUP BY t.key ORDER BY COUNT(DISTINCT t.ref_id) DESC;
```

People linked to Navalny:

```sql
SELECT ARRAY_AGG(DISTINCT t.text), MAX(t.category), t.key, COUNT(DISTINCT t.ref_id) FROM tag t LEFT JOIN ref r ON r.id = t.ref_id LEFT JOIN tag o ON o.ref_id = r.id WHERE r.site = 'occrp' AND t.category = 'PERSON' AND o.key <> t.key AND o.key = 'person:alexei-navalny' GROUP BY t.key ORDER BY COUNT(DISTINCT t.ref_id) DESC;
```
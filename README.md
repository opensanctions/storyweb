# StoryWeb

StoryWeb is a project aimed to extract networks of entities from journalistic reporting. The idea is to reverse engineer stories into structured graphs of the persons and companies involved, and to capture the relationships between them.

https://storyweb.opensanctions.org

StoryWeb consumes news articles as input data. Individual articles can be imported via the web interface, but there's also a possibility for bulk import using the [`articledata`](https://github.com/pudo/articledata) micro-format. One producer of `articledata` files is [`mediacrawl`](https://github.com/opensanctions/mediacrawl), which can be used to crawl news websites and harvest all of their articles.

## Installation

Storyweb can be run as a Python web application from a developer's machine, or via a docker container. We recommend using docker for any production deployment and as a quick means to get the application running if you don't intend to change its code.

### Running in Docker mode

You can start up the a docker instance by running the following commands in an empty directory:

```bash
wget https://raw.githubusercontent.com/opensanctions/storyweb/main/docker-compose.yml
docker-compose up
```

This will make the storyweb user interface available on port 8000 of the host machine.

### Running in development mode

Before installing storyweb on the host machine, we recommend setting up a Python virtual environment of some form (venv, virtualenv, etc.). 

As a first step, let's install the `spaCy` models that are used to extract person and company names from the given articles: 

```bash
pip install spacy
python3 -m spacy download en_core_web_sm
python3 -m spacy download de_core_news_sm
python3 -m spacy download xx_ent_wiki_sm
python3 -m spacy download ru_core_news_sm
```

Next, we'll install the application itself, and its dependencies. Run the following command inside of a git checkout of the storyweb repository:

```bash
pip install -e ".[dev]"
```

You also need to have a PostgreSQL server running somewhere (e.g. on the same machine, perhaps installed via homebrew or apt). Create a fresh database on that server and point storyweb to it like this: 

```bash
export STORYWEB_DB_URL=postgresql://storyweb:storyweb@db/storyweb
# Create the database tables:
storyweb init
```

You now have the application configured and you can explore the commands exposed by the `storyweb` command-line tool:

```
Usage: storyweb [OPTIONS] COMMAND [ARGS]...

  Storyweb CLI

Options:
  --help  Show this message and exit.

Commands:
  auto-merge  Automatically merge on fingerprints
  compute     Run backend computations
  graph       Export an entity graph
  import      Import articles into the DB
  import-url  Load a single news story by URL
  init        Initialize the database
```

The import command listed here will accept any data file in the `articledata` format, which is emitted by the `mediacrawl` tool.

#### Running the backend API

Finally, you can run the backend API using `uvicorn`:

```bash
uvicorn --reload --host 0.0.0.0 storyweb.server:app
```

This will boot up the API server of port 8000 of the local host and enable hot reloads whenever the code changes during development. 

#### Installing and running the frontend

Once you have the API running, you can install and run the development server for the frontend. Storyweb uses React and ReduxToolkit internally and will use a Webpack dev server to dynamically re-build the frontend during development.

```bash
cd frontend/
npm install 
npm run dev
```

Remember that you need to run `npm run dev` whenever you do frontend development.

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


## License and credits


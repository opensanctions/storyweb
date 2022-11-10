
serve:
	uvicorn --reload storyweb.api:app

data: data/articles.ijson

clean:
	rm -rf data/articles

data/articles:
	mkdir -p data/articles

data/articles/%.ijson: data/articles
	curl -o data/articles/$*.ijson -s https://data.opensanctions.org/contrib/mediacrawl/$*.ijson

fetch: data/articles/occrp.ijson \
	data/articles/icij.ijson \
	data/articles/dossier_at.ijson \
	data/articles/daphne_foundation.ijson \
	data/articles/istories_media.ijson \
	data/articles/amabhungane.ijson
# data/articles/daily_maverick.ijson

data/articles.ijson: fetch
	cat data/articles/* >data/articles.ijson

load: data/articles.ijson
	storyweb import data/articles.ijson

serve:
	uvicorn --reload storyweb.api:app

reset:
	dropdb storyweb
	createdb -E utf-8 storyweb
	storyweb init
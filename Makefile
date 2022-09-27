
data: data/articles.ijson

clean:
	rm -rf data/articles

data/articles:
	mkdir -p data/articles

data/articles/%.ijson: data/articles
	curl -o data/articles/$*.ijson -s https://data.opensanctions.org/contrib/mediacrawl/$*.ijson

fetch: data/articles/occrp.ijson \
	data/articles/icij.ijson

data/articles.ijson: fetch
	cat data/articles/* >data/articles.ijson
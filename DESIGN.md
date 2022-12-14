
# Workflow ideas for StoryWeb

We want to go from a corpus of media reports to a knowledge graph for a specific set of journalistic stories (called it a `Scandal` for now, I guess `StoryLine` also works).


## Step 1: Crawling the reporting

* Contact a bunch of GIJN member orgs to see if I may. Maybe offer a formalised quid pro quo deal ("I can parse your stories, you get story graph data")
* Build a news crawler in async Python, store everything to a SQL database that allows for incremental crawls.
* Output articles with metadata (https://schema.org/Article) as a JSONL file.
    * Requires identifying which pages contain articles
    * Requires extracting article metadata and body (e.g. via `newspaper`, `trafilatura`)


## Step 2: Extract named entities

* Run a competition between spaCy and SparkNLP, decide if we always want to run both of if it's a per-language decision.
* Find a disk format for annotated articles, probably going to need:
    * Every extracted entity and their tag type, span
    * Every sentence and their spans


## Step 3: Build a co-occurrence matrix 

Get everything into a massive SQL table a la:

* `article_url`, `sentence_no`, `tag_type`, `tag_label`, `tag_normalised`

e.g.:

* `https://rise.md/...`,`6`,`PER`,`Vladimir Plahotniuc`,`vladimir-plahotniuc`
* `https://rise.md/...`,`16`,`PER`,`Vlad Plahotniuc`,`vlad-plahotniuc`
* `https://rise.md/...`,`4`,`LOC`,`Moldova`,`md`
* `https://rise.md/...`,`4`,`ORG`,`Democratic Party`,`democratic-party`
* `https://istories.ru/...`,`1`,`PER`,`Владимир Плахотнюк`,`vladimir-plahotnuk`
* `https://istories.ru/...`,`5`,`PER`,`Плахотнюк`,`plahotnuk`
* `https://istories.ru/...`,`17`,`PER`,`Владимир Плахотнюк`,`vladimir-plahotnuk`


## Step 4: Build an entity loom

The core of an interactive graph entity identity building tool could be an interactive loop like this: 

* Pick a particularly namey-looking tag that occurs a lot.
* Show it to a user and prompt them to decide:
    1. This is a new entity's name, make a new ID (shortuuid)
    2. This is another surface form of an existing entity, show top 5 search results (ask if it's a strong or weak alias)
* Focus the user process on the (new) entity
    * Show co-occurring other tags, including place and date tags
    * Maybe: show any sentence in which both the tag and an alias of the entity occur
    * For each tag, prompt the user to say if it's a strong/weak alias, context or related entity or unrelated tag
    * Allow the user to finish working on this entity and start with a new one
* Start over.

Resulting table:

`entity_id`, `tag_type`, `tag_label`, `tag_normalised`, `role`

where `role` is one of:

* `alias` (e.g. `Vladimir Plahotniuc`)
* `weak_alias` (e.g. `Plahotniuc's`, `the Oligarch`)
* `context` (e.g. `Moldova` for Plahotniuc)
* `related` (e.g. `Democratic Party` for Plahotniuc)
* `unrelated` (e.g. `European Union` for Plahotniuc)

This process can probably later be partially automated, eg. if one of the related labels already is part of an existing entity, or by doing string similarity on the aliases.

### How to disambiguate?

This doesn't yet allow us to say that there are two separate `Markus Braun` - one maybe an actor mentioned in a gossip piece, the other the CEO of Wirecard. We basically need a way to fork an entity and say: this alias, in this article - make it part of another entity! 

### Clustering

What I'm describing here is really a clustering process. Need to do some research on what scikit-learn-level machine learning for clustering looks like and how well it might apply.

## Step 5: Build a relationship loom

Similar process as above: take two entities from Step 4 that co-occur in multiple articles, show the user any sentences that mention both and then propose to them to classify their relationship (or do it based on a keyword list, and merely double-check directionality). 

Categories (tbd):

* Family
* Personal associate
* Business associate
* Nemesis, opponent, adversary, antagonist (word?)
* Owner
* In control of (Director, etc.)
* Participant
* Member/Employee
* Payment, debt, business relationship


### Can we model events?

Media reporting is all about events, do we want to reify them? How can we label events, maybe by deriving key words from the headline?


## Step 6: Reconcile entities

This can maybe already happen in `nomenklatura`:

* https://github.com/opensanctions/nomenklatura/blob/master/README.md


## Step 7: Visualise, profit! 

* What can we compute on the output using NetworkX?
* https://sayari-analytics.github.io/trellis/


## Credits

* Thanks to [Heleen](https://twitter.com/heleenemanuel) and [Johan](https://johanschuijt.nl/) :) 
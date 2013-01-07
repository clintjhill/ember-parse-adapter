Ember Data Adapter for Parse
===================

An Ember Data Adapter built to use the Parse REST API. 

This is a full Ember implementation against the Parse REST API without the use
of the Parse JavaScript SDK. Currently in a very alpha state. 

Currently by default it will make use of a batched approach to persisting records. However
there is an implementation for more granular persistence.

Note: This is a CORS implementation. It has nuances. As an example Parse REST API only responds
to SSL requests. Due to IE8+ CORS implementations that means you must run your app under SSL. As well
some browsers will perform an OPTIONS call along-side the regular GET/PUT/POST/DELETE 
(still investigating all of this - and learning). I chose to re-use the Parse XDomainRequest implementation
and then use jQuery for all other supporting browsers. This might be a dead-end and I might
be wiser to use Parse's full XHR implementation (it's small and smart - but I'm trying to be original).

Features
--------

##### ParseConnector: Ember Mixin
  * Provides the AJAX connectivity to the Parse REST API.
##### ParseJSONSerializer: Ember Data JSONSerializer
  * Provides the translation of objectId to id.
  * Provides encoding of hasMany associations to Parse Pointer objects.
##### ParseAdapter: Ember Data Adapter
  * Implements the persistence layer to Parse.
  * Provides either bulk/batch persistence or granular.
##### ParseMixin: Ember Mixin
  * Provides created/updated date attributes.
##### ParseModel: Ember Data Model
  * Provides an easy way to setup a Parse object.

Issues
------

* Incomplete example.
* Associations are rough cuts.
* Referenced hasMany associations not serializing during isNew state.
* Demo is rough due to Parse acct dependency.

Roadmap
-------

* Determine serialization of new records with hasMany association references.
* Parse Relation for many-to-many associations.
* Implement findQuery.
* Implement Store record error states.
* Implement full type encodings in ParseSerializer supported by Parse (Bytes/Pointer/Relation).

Dev Notes
---------
* To get a build simply grunt. You'll find builds inside the /dist folder.
* Tagging is formatted as 'vX.X.X' v.X.X.X

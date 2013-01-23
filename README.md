Ember Data Adapter for Parse
===================

An Ember Data Adapter built to use the Parse REST API.

This is a full Ember implementation against the Parse REST API without the use
of the Parse JavaScript SDK.

Currently by default it will make use of a batched approach to persisting records. However
there is an implementation for more granular persistence.

Features
--------

##### ParseConnector: Ember Mixin
  * Provides the AJAX connectivity to the Parse REST API.
  * CORS implementation

##### ParseJSONSerializer: Ember Data JSONSerializer
  * Provides the translation of objectId to id.
  * Provides encoding of hasMany associations to Parse Pointer objects.
  * Provides batch serialization according to [Parse batch operations|https://parse.com/docs/rest#objects-batch].

##### ParseAdapter: Ember Data Adapter
  * Implements the persistence layer to Parse.
  * Provides either bulk/batch persistence or granular (bulkCommit by default).

##### ParseMixin: Ember Mixin
  * Provides created/updated date attributes.

##### ParseModel: Ember Data Model
  * Provides an easy way to setup a Parse object.

Issues
------

* Demo is rough due to Parse acct dependency.
* Error conditions are handled only by logging the error.

Roadmap
-------

* Parse Relation for many-to-many associations.
* Implement Store record error states.
* Implement full type encodings in ParseSerializer supported by Parse (Bytes/Pointer/Relation).

Dev Notes
---------
* To get a build simply grunt. You'll find builds inside the /dist folder.
* Tagging is formatted as 'vX.X.X' v.X.X.X

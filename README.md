Ember Data Adapter for Parse
===================

An Ember Data Adapter built to use the Parse REST API. 

This is a full Ember implementation against the Parse REST API without the use
of the Parse JavaScript SDK. Currently in a very alpha state. At the moment this performs only the simple CRUD features. However the implementation 
does drop the core of the Parse JavaScript SDK.

This is a CORS implementation. It has nuances. As an example Parse REST API only responds
to SSL requests. Due to IE8+ CORS implementations that means you must run your app under SSL. As well
some browsers will perform an OPTIONS call along-side the regular GET/PUT/POST/DELETE 
(still investigating all of this - and learning). I chose to re-use the Parse XDomainRequest implementation
and then use jQuery for all other supporting browsers. This might be a dead-end and I might
be wiser to use Parse's full XHR implementation (it's small and smart - but I'm trying to be original).

Currently works with the Ember versions listed in the example.html AS-IS. 
The example is using the master branch of Ember and Ember-Data (built for this project). 
There is also 1 modification done here locally to flip a guard for Ember.BOOTED inside 
ember-latest.js (line: 5495). I apologize for this kind of kludgery. I dislike it myself. 
But understand this is temporary and you really shouldn't be using this project yet anyways. 
In fact you should be forking and fixing. Thanks!

Features
--------

##### ParseConnector: Ember Mixin
  * Provides the AJAX connectivity to the Parse REST API.

##### ParseJSONSerializer: Ember Data JSONSerializer
  * Provides the translation of objectId to id.

##### ParseJSONTransforms: Ember Data JSONTranforms
  * Provides Date transforms for ISO Dates in Parse.

##### ParseAdapter: Ember Data Adapter
  * Implements the minimum required Adapter CRUD functionality.

##### ParseMixin: Ember Mixin
  * Provides created/updated date attributes.

Issues
------

* Incomplete example.
* Demo is rough due to Parse acct dependency.

Roadmap
-------

* Implement findQuery.
* Implement findMany.
* Implement Store recordWasError et al in error conditions.
* Implement full type encodings supported by Parse.
* Expose more Parse info inside the ParseMixin.

Dev Notes
---------
* To get a build simply grunt. You'll find builds inside the /dist folder.
* Tagging is formatted as 'vX.X.X' v.X.X.X

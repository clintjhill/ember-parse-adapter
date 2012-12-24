Ember.js Data Adapter for Parse
===================

An Ember.js Data Adapter built to use the Parse REST API. 

Currently in a very alpha state. 

Note: The master currently works with the Ember versions listed in the example.html as-is. 
The example is using the master branch of Ember and Ember-Data. There is also 1 modification
done here locally to flip a guard for Ember.BOOTED inside ember-latest.js (line: 5495). I apologize
for this kind of kludgery. I dislike it myself. But understand this is temporary and you really
shouldn't be using this project yet anyways. In fact you should be forking and fixing. Thanks!

Features
--------

* ParseConnector: Ember Mixin
  * Provides the AJAX connectivity to the Parse REST API.
* ParseConnector.JSONTransforms: Ember Data JSONTranforms
  * Provides Date transforms for ISO Dates in Parse.
* ParseAdapter: Ember Data Adapter
  * Implements the minimum required Adapter functionality.
* ParseMixin: Ember Mixin
  * Provides primary key and created/updated date attributes.

Issues
------

* Translation from 'objectId' to 'id' isn't as clean as it could be.
* Update/Delete has adapter error due to non-congruent data returned from Parse.
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

* Tagging is formatted as 'vX.X.X' v.X.X.X
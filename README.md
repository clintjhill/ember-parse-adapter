Ember.js Data Adapter for Parse
===================

An Ember.js Data Adapter built to map Parse objects to Ember objects through
the Parse JavaScript SDK. 

Currently in a very alpha state. 

Note: The master currently works with the Ember versions listed in the example.html as-is. 
The example is using the master branch of Ember and Ember-Data. There is also 1 modification
done here locally to flip a guard for Ember.BOOTED inside ember-latest.js (line: 5495). I apologize
for this kind of kludgery. I dislike it myself. But understand this is temporary and you really
shouldn't be using this project yet anyways. In fact you should be forking and fixing. Thanks!

Features
--------

* ParseAdapter: Ember Data Adapter
  * Implements the minimum required Adapter functionality.
* ParseMixin: Ember Mixin
  * Provides primary key and created/updated date attributes.

Issues
------

* Translation from 'objectId' to 'id' isn't as clean as it could be.
* Performance improvements could be made for Associtations.
* Incomplete example.

Roadmap
-------

* Implement findQuery.
* Expose more Parse info inside the ParseMixin.
* Transition to a completely Ember based implementation dropping the Backbone.

Dev Notes
---------

* Tagging is formatted as 'vX.X.X' v.X.X.X
* 

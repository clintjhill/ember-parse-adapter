Ember.js Data Adapter for Parse
===================

An Ember.js Data Adapter built to map Parse objects to Ember objects through
the Parse JavaScript SDK. 

Currently in a very alpha state.

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

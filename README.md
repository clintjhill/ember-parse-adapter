Ember Data Adapter for Parse
===================

An [Ember Data Adapter](https://github.com/emberjs/data) built to use the [Parse REST API](https://parse.com/docs/rest). This is a full Ember implementation against the Parse REST API without the use of the Parse JavaScript SDK. 

Features
--------

##### ParseJSONSerializer: Ember Data JSONSerializer
  * Provides the translation of objectId to id for identity mapping.
  * Provides encoding of hasMany associations to [Parse Pointer objects](https://parse.com/docs/rest#objects-types).

##### ParseAdapter: Ember Data Adapter
  * Implements the persistence layer to Parse by extending the Ember Data REST Adapter.

##### ParseModel: Ember Data Model
  * Provides an easy way to setup a Parse object.

##### ParseUser: Parse User implementation.
  * Login
  * Signup
  * Request password reset

Get Started
-----------
You'll want to get an account at [Parse](https://parse.com). After this you will be provided with three keys:

* Application ID
* JavaScript Key
* REST API Key

You will need each of these to configure the ParseAdapter.

```javascript
  var App = Ember.Application.create();

  App.ApplicationAdapter = DS.ParseAdapter.extend({
    applicationId: '<YOUR APP ID HERE>',
    restApiId: '<YOUR REST API KEY HERE>',
    javascriptId: '<YOUR JAVASCRIPT KEY HERE>'
  });
```

Once you have your adapter configured now you can create ParseModels just as you would create DS.Models.

```javascript
  App.Post = DS.ParseModel.extend({
    title: DS.attr('string'),
    body: DS.attr('string')
  });
```

Roadmap
-------

* Parse Roles implementation
* Parse ACL implementation
* Parse Relation for many-to-many associations.

Dev Notes
---------
* To get a build simply grunt. You'll find builds inside the /dist folder.

Ember Data Adapter for Parse
===================

An [Ember Data Adapter](https://github.com/emberjs/data) built to use the [Parse REST API](https://parse.com/docs/rest). This is a full Ember implementation against the Parse REST API without the use of the Parse JavaScript SDK. It is implemented against [revision 11](https://github.com/emberjs/data/blob/master/BREAKING_CHANGES.md) of the Ember Data framework.

Features
--------

##### ParseConnector: Ember Mixin
  * Provides the AJAX connectivity to the Parse REST API.
  * CORS implementation

##### ParseJSONSerializer: Ember Data JSONSerializer
  * Provides the translation of objectId to id for identity mapping.
  * Provides encoding of hasMany associations to [Parse Pointer objects](https://parse.com/docs/rest#objects-types).
  * Provides batch serialization according to [Parse batch operations](https://parse.com/docs/rest#objects-batch).
  * Serializes Date types to the [ISO 8601 as used by Parse](https://parse.com/docs/rest#objects-types).

##### ParseAdapter: Ember Data Adapter
  * Implements the persistence layer to Parse.
  * Provides either bulk/batch persistence or granular (bulkCommit by default).

##### ParseMixin: Ember Mixin
  * Provides created/updated date attributes.

##### ParseModel: Ember Data Model
  * Provides an easy way to setup a Parse object.

Get Started
-----------
Grab the latest version of ember-parse-adapter from the /dist directory in this project and include it in your HTML after the Ember dependencies.

```html
<script src="jquery.min.js"></script>
<script src="handlebars-1.0.rc.1.js"></script>
<script src="ember.js"></script>
<script src="ember-data.js"></script>
<script src="ember-parse-adapter-0.0.9.js"></script>
```

Next you'll want to get an account at Parse: https://parse.com/. After this you will be provided with three keys:

* Application ID
* JavaScript Key
* REST API Key

You will need each of these to configure the ParseAdapter.

```javascript
  var App = Ember.Application.create();

  App.Store = DS.Store.extend({
    revision: 11,
    adapter: ParseAdapter.create({
      applicationId: '<YOUR APP ID HERE>',
      restApiId: '<YOUR REST API KEY HERE>',
      javascriptId: '<YOUR JAVASCRIPT KEY HERE>'
    })
  });
```

Once you have your adapter configured now you can create ParseModels just as you would create DS.Models.

```javascript
  App.Post = ParseModel.extend({
    title: DS.attr('string'),
    body: DS.attr('string')
  });
```

Issues
------

* Demo is rough due to Parse acct dependency.
* findQuery implementation is a bit weak/brittle. Needs full [Parse Query](https://parse.com/docs/rest#queries-constraints).
* Error conditions are handled only by logging the error.

Roadmap
-------

* Parse Relation for many-to-many associations.
* Implement Store record error states.
* Implement full type encodings in ParseSerializer supported by Parse (Bytes/Pointer/Relation).

Dev Notes
---------
* To get a build simply grunt. You'll find builds inside the /dist folder.
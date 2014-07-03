Ember Data Adapter for Parse
===================

An [Ember Data](https://github.com/emberjs/data) plugin built to use
the [Parse REST API](https://parse.com/docs/rest). This is a full Ember
implementation against the Parse REST API without the use of the Parse
JavaScript SDK.

The [example](example/index.html) file contains some example usage.

Features
--------

##### EmberParseAdapter.Serializer

  * Provides the translation of objectId to id for identity mapping.
  * Provides encoding of hasMany associations to arrays of [Parse Pointer objects](https://parse.com/docs/rest#objects-types).

##### EmberParseAdapter.Adapter

  * Implements the persistence layer to Parse by extending the Ember Data REST Adapter.
  * Provides a `sessionToken` property which can set a session token.

##### EmberParseAdapter.ParseUser

  * Login
  * Signup
  * Request password reset
  * Is stored at the special user endpoint at parse

##### EmberParseAdapter.Transforms

  * Provides transforms for file, geo, and date types at Parse.

Installation
------------
## Script tags

```html
<!-- Don't forget to include Ember, Ember Data, and their dependencies -->
<script src="ember-parse-adapter.js"></script>
```

## Bower

```sh
bower install ember-parse-adapter
```

## [Ember CLI](https://github.com/stefanpenner/ember-cli) Addon.

```sh
npm install --save-dev ember-parse-adapter
```

Get Started
-----------

You'll want to get an account at [Parse](https://parse.com). After this you will
be provided with three keys:

* Application ID
* JavaScript Key
* REST API Key

You will need each of these to configure the ParseAdapter.

```javascript
var App = Ember.Application.create();

App.ApplicationAdapter = EmberParseAdapter.Adapter.extend({
  applicationId: '<YOUR APP ID HERE>',
  restApiId: '<YOUR REST API KEY HERE>',
  javascriptId: '<YOUR JAVASCRIPT KEY HERE>'
});
```

Any model using this adapter will be stored on Parse. Create models
as you would normally:

```javascript
App.Post = DS.Model.extend({
  // Attributes can use normal transforms
  title: DS.attr('string'),
  body: DS.attr('string'),
  // Or there are special transforms for some data-types
  avatar: DS.attr('parse-file'),
  // There is a parse-date transform, but sometimes dates are just strings
  updatedAt: DS.attr('date'),
  // ALWAYS refer to relationships as async, for now.
  user: DS.belongsTo('user', {async: true})
});
```

Roadmap
-------

* Move to ES6 modules.
* Bring back relationships via Parse relation type?
* Bytes type?
* Parse Roles implementation.
* Parse ACL implementation.

Dev Notes
---------

To get started with the codebase, be sure to run the standard dependency installs:

```
npm install
bower install
```

Now you have several grunt tasks available:

```
grunt # -> builds the files into dist/
grunt test # -> Runs the tests in the console
grunt connect:server:keepalive # -> Runs the test server, visit http://localhost:8000/test/
```

Ember Data Adapter for Parse [![Build Status](https://travis-ci.org/clintjhill/ember-parse-adapter.svg)](https://travis-ci.org/clintjhill/ember-parse-adapter)
===================

An [Ember Data](https://github.com/emberjs/data) plugin built to use
the [Parse REST API](https://parse.com/docs/rest). This is a full Ember
implementation against the Parse REST API without the use of the Parse
JavaScript SDK.

The demo application contains some example usage.

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

Get Started
-----------

You'll want to get an account at [Parse](https://parse.com). After this you will
be provided with two keys:

* Application ID
* REST API Key

You will need each of these to configure the ParseAdapter via entries in the `config/environment.js` file:

```javascript
var ENV = {
  ...

  APP: {
    applicationId: '<YOUR APP ID HERE>',
    restApiId: '<YOUR REST API KEY HERE>'
  }
};
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

Security Warning
----------------
Before publishing your app you should **disable REST Push**. Parse apps are created with this feature enabled by default. If this feature is enabled anyone with your `Application ID` and `REST API Key` will be able to send push notifications to your user's devices. Anyone using your app has access your `Application ID` and `REST API Key`.

To disable REST Push:

- Login to your Parse account.
- Click on your application.
- Go to Settings > Push.
- And disable REST Push.
- It should look like the image below.

![](http://x.gcollazo.com/B5Qk40KL6m.png)

Demo
----

## Installation

* `git clone` this repository
* `npm install`
* `bower install`

## Running

* `ember server`
* View the demo at http://localhost:4200

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).


Roadmap
-------

* Bring back relationships via Parse relation type?
* Bytes type?
* Parse Roles implementation.
* Parse ACL implementation.


How to use this addon in your application
-----------------------------------------

```
ember install ember-parse-adapter
```

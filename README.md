# Parse for Ember.js

This addon has all you need to use [Parse](https://parse.com/) in your Ember.js application. It includes an adapter and serializer to integrate with ember-data and a session service to provide authentication.

## WORK-IN-PROGRESS
This is still a work in progress.

#### Tests
- [ ] Test session service is injected in routes
- [ ] Test session service is injected in controllers
- [ ] Test session service is injected in components
- [ ] Test session service can register new user
- [ ] Test session service can login user
- [ ] Test session service can request password reset for user
- [ ] Test session service sets sessionToken in adapter
- [ ] Test get single record
- [ ] Test get many records
- [ ] Test create record
- [ ] Test update record
- [ ] Test delete record
- [ ] Test get belongs-to relation
- [ ] Test create belongs-to relation
- [ ] Test update belongs-to relation
- [ ] Test delete belongs-to relation
- [ ] Test get many-to-many relation
- [ ] Test create many-to-many relation
- [ ] Test update many-to-many relation
- [ ] Test delete many-to-many relation

#### Features
- [ ] ApplicationRouteMixin
- [X] AuthenticatedRouteMixin
- [X] Blueprint to generate application files

## Getting Started
Since this is still a work in progress, we don't have any documentation. In the meantime you can take a look at the [dummy app](https://github.com/GetBlimp/ember-parse/tree/master/tests/dummy) to get an idea of how the addon works.

## Installation

* `ember install:addon ember-parse`
* `ember generate ember-parse-core` :point_left: To add the adapter and serializer
* `ember generate ember-parse-session` :point_left: To add the session service and user model

#### config/environment.js

```js
ENV['ember-parse'] = {
  PARSE_APPLICATION_ID: '<your app id goes here>',
  PARSE_JAVASCRIPT_KEY: '<your key goes here>',
  session: {
    authenticationRoute: 'index', // Route where your login form is located
    ifAlreadyAuthenticatedRoute: 'dashboard' // Route to redirect logged in users
  }
};
```

## Compatibility

* ember-data >= "1.0.0-beta.19.1"

## Development

* `git clone` this repository
* `npm install`
* `bower install`

## Running

* `ember server`
* Visit your app at http://localhost:4200.

## Running Tests

* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).

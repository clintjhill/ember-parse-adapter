import initializer from 'ember-parse-adapter/initializers/initialize';

export default {
    name: 'ember-parse-adapter',

    after: 'ember-data',

    initialize: initializer
};
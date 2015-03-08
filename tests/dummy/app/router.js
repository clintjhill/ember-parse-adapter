import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
    this.route( 'signup', { path: '/signup' } );
    this.route( 'login', { path: '/login' } );
    this.route( 'simple', { path: '/simple' } );
    this.route( 'belongsto', { path: '/belongsto' } );
    this.route( 'hasmany', { path: '/hasmany' } );
    this.route( 'facebook', { path: '/facebook' } );
});

export default Router;

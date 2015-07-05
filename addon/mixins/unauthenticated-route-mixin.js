import Ember from 'ember';

export default Ember.Mixin.create({
  beforeModel(transition) {
    var superResult = this._super(transition);

    if (this.get('session.isAuthenticated')) {
      transition.abort();
      var config = this.container.lookupFactory('config:environment');
      this.transitionTo(config['ember-parse'].session.ifAlreadyAuthenticatedRoute);
    }

    return superResult;
  }
});

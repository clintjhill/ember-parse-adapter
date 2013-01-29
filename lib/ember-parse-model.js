var ParseModel = DS.ParseModel = DS.Model.extend(ParseMixin, {

  isPasswordResetting: Ember.computed(function(key) {
    return get(get(this, 'stateManager.currentState'), key);
  }).property('stateManager.currentState'),

  init: function(){
    var stateManager = DS.StateManager.create({record: this}),
      rootState;
    stateManager.enableLogging = true;
    rootState = stateManager.get('states.rootState');
    rootState.setupChild(rootState.get('states'), 'passwordReset', PasswordResetState);
    set(this, 'stateManager', stateManager);
    this._setup();
    stateManager.goToState('empty');
  }

});
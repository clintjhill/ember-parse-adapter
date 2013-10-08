var PasswordResetState = DS.State.create({

  isPasswordResetting: true,

  requesting: function(manager){
    var record = manager.get('record');
    record.trigger('requestingPasswordReset');
  },

  requestSent: function(manager){
    var record = manager.get('record');
    manager.transitionTo('loaded.saved');
    record.trigger('didRequestPasswordReset');
  },

  requestFailed: function(manager){
    var record = manager.get('record');
    record.trigger('resetPasswordFailed');
  }

});

var PasswordResetState = DS.State.extend({

  isPasswordReset: true,

  resetting: function(manager){
    var record = manager.get('record');
    record.trigger('ressetingPassword');
  },

  reset: function(manager){
    var record = manager.get('record');
    manager.transitionTo('loaded.saved');
    record.trigger('didResetPassword');
  }

});
/**
 * Model to setup default Parse attributes like create/update date
 * fields.
 */
var ParseModel = DS.ParseModel = DS.Model.extend({
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  parseClassName: function(){
    return this.constructor.parseClassName();
  }
});

ParseModel.reopenClass({
  parseClassName: function(){
    return Ember.String.capitalize(this.typeKey);
  }
});

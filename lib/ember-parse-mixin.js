var ParseMixin = Ember.Mixin.create({
  primaryKey: 'objectId',
  objectId: DS.attr('string'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date')
});
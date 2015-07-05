import DS from 'ember-data';

var attr = DS.attr;

export default DS.Model.extend({
  username: attr('string'),
  password: attr('password'),
  email: attr('string'),
  emailVerified: attr('boolean'),
  sessionToken: attr('string'),
  createdAt: attr('date'),
  updatedAt: attr('date')
});

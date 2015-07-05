import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  things: DS.hasMany('thing', {async: true})
});

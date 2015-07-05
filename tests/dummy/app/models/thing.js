import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  age: DS.attr('number'),
  createdAt: DS.attr('date'),
  category: DS.belongsTo('category', {async: true}),
  friends: DS.hasMany('friend', {async: true}),
  cars: DS.hasMany('car', {async: true})
});

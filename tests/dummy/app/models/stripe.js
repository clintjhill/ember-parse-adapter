import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({
  tiger: DS.belongsTo( 'tiger' )
});
import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({
  flavor: DS.attr( 'string' ),
  hole: DS.belongsTo( 'hole' )
});
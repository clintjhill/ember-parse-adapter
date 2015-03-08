import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({
    donut: DS.belongsTo( 'donut' )
});
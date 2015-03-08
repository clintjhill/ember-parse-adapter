import Ember from 'ember';

export default Ember.Controller.extend({
    saved: false,

    name: null,

    actions: {
        save: function() {
            var tiger      = this.get( 'model' ),
                controller = this;

            tiger.set( 'name', this.get( 'name' ) );

            tiger.save().then( function() {
                controller.set( 'saved', true );
            });
        },

        add: function() {
            var tiger  = this.get( 'model' ),
                stripe = tiger.get( 'stripes' ).createRecord();

            stripe.save().then( function( tiger ) {
                tiger.save();
            });
        }
    }
});
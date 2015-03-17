import Ember from 'ember';

export default Ember.Controller.extend({

  succeeded: null,

  actions: {
    reset: function() {
      this.set( 'succeeded', false );
    },

    save: function() {
      var hole       = this.get( 'store' ).createRecord( 'hole' ),
        controller = this,
        donut;

      this.get( 'model' ).set( 'flavor', $( '#donutFlavor' ).val() );

      donut = this.get( 'model' );

      donut.save().then( function( donut ) {
        hole.set( 'donut', donut );
        hole.save().then( function( hole ) {
          donut.set( 'hole', hole );
          donut.save().then( function( donut ) {
            controller.set( 'succeeded', 'true' );
          });
        });
      });
    }
  }
});
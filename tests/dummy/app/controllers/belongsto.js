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

      donut.save()
        .then( function( donutResult ) {
          hole.set( 'donut', donut );
          return hole.save();
        })
        .then( function( holeResult ) {
          donut.set( 'hole', hole );
          return donut.save();
        })
        .then( function( donutResult ) {
          controller.set( 'succeeded', 'true' );
        });
      
    }
  }
});
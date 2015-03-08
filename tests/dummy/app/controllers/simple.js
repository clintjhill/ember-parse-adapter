import Ember from 'ember';

export default Ember.Controller.extend({
    lastSavedModel: null,

    succeeded: false,

    name: null,

    actions: {
        reset: function() {
            this.set( 'name', null );
            this.set( 'succeeded', false );
            this.set( 'lastSavedModel', null );
        },

        save: function(){
            var controller = this;
            this.get( 'model' ).set( 'name', this.get( 'name' ) );
            this.get( 'model' ).save().then(
                function( simple ) {
                    controller.set( 'succeeded', true );
                    controller.set( 'lastSavedModel', simple );
                },
                function( error ) {
                    controller.set( 'succeeded', false );
                }
            );
        }
    }
});
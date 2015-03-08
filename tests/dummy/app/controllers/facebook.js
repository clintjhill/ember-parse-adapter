import Ember from 'ember';

export default Ember.Controller.extend({
    accessToken: null,

    facebookUid: null,

    loggedIn: false,

    loginMessage: null,

    actions: {
        login: function() {
            var ParseUser  = this.store.modelFor( 'parse-user' ),
                controller = this,
                data = {
                    // username: 'Some facebook user',
                    authData: {
                        facebook: {
                            access_token    : this.get( 'accessToken' ),
                            id              : this.get( 'facebookUid' ),
                            expiration_date : ( new Date(2032,2,2) )
                        }
                    }
                };

            ParseUser.signup( this.store, data ).then(
                function( user ) {
                    controller.set( 'loggedIn', true );
                    controller.set( 'loginMessage', 'Welcome!' );
                },
                function( error ) {
                    controller.set( 'loggedIn', false );
                    controller.set( 'loginMessage', error.message || error.error );
                }
            );
        }
    }
});
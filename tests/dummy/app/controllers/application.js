import Ember from 'ember';

export default Ember.Controller.extend({
  cloud: Ember.inject.service('cloud'),
  isAuthenticated: Ember.computed.alias('session.isAuthenticated'),
  username: 'user@example.com',
  password: 'abc123',
  authError: null,
  cloudCodeResult: null,
  triggeredError: null,

  actions: {
    createObject() {
      var friend1 = this.store.createRecord('friend', {
        name: 'Juanito'
      });

      var friend2 = this.store.createRecord('friend', {
        name: 'Paco'
      });

      var car1 = this.store.createRecord('car', {
        name: 'Toyota'
      });

      var car2 = this.store.createRecord('car', {
        name: 'Honda'
      });

      var cat = this.store.createRecord('category', {
        name: 'Category'
      });

      var thingObj = {
        name: 'New',
        age: 2
      };

      if (this.get('session.userId')) {
        thingObj.ParseACL = {
          owner: this.get('session.userId')
        };
      }

      var thing = this.store.createRecord('thing', thingObj);

      friend1.save()
        .then(() => friend2.save())
        .then(() => car1.save())
        .then(() => car2.save())
        .then(() => cat.save())
        .then(() => {
          thing.get('friends').pushObjects([friend1, friend2]);
          thing.get('cars').pushObjects([car1]);
          thing.set('category', cat);
          thing.save();
        });
    },

    removeFriend(thing, friend) {
      thing.get('friends').removeObject(friend);
      thing.save();
    },

    deleteObject(object) {
      object.deleteRecord();
      object.save();
    },

    updateObject(object) {
      object.set('name', 'Updated');
      object.save();
    },

    updateCar(car) {
      car.set('name', car.get('name') + '*');
      car.save();
    },

    login() {
      this.get('session').authenticate(this.get('username'), this.get('password'))
        .then((user) => {
          console.log('Logged in:', user.get('email'));
          this.set('authError', null);
          this.send('reloadData');
        })
        .catch((reason) => {
          var err = `Code ${reason.errors[0].code}: ${reason.errors[0].details}`;
          console.error(err);
          this.set('authError', err);
        });
    },

    logout() {
      this.get('session').invalidate().then(() => {
        console.log('Logged out');
        this.send('reloadData');
      });
    },

    signup() {
      this.get('session').signup({
        username: this.get('username'),
        password: this.get('password'),
        email: this.get('username')
      }).then((user) => {
        console.log(user);
        this.send('login');
      }).catch((reason) => {
        var err = `Code ${reason.errors[0].code}: ${reason.errors[0].details}`;
        console.error(err);
        this.set('authError', err);
      });
    },

    resetPassword() {
      this.get('session').requestPasswordReset(this.get('username'))
        .then(function(response) {
          console.log(response);
        });
    },

    runCloudCode() {
      this.get('cloud').run('sendData', {
        thing: 'car',
        color: 'red'
      })
      .then((response) => {
        response.result.body = JSON.parse(response.result.body);
        this.set('cloudCodeResult', JSON.stringify(response, null, 2));
      });
    },

    triggerError() {
      this.get('cloud').run('notExistingCode')
      .catch((response) => {
        this.set('triggeredError', JSON.stringify(response, null, 2));
      });
    }

  }
});

import Ember from 'ember';

export default Ember.Route.extend({
  model() {
    return this.store.findAll('thing');
  },

  actions: {
    reloadData() {
      this.store.unloadAll('car');
      this.store.unloadAll('category');
      this.store.unloadAll('friend');
      this.store.unloadAll('thing');
      this.store.unloadAll('user');
      this.refresh();
    }
  }
});

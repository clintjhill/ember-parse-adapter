import Ember from 'ember';

export default Ember.Service.extend({
  /*
   * Makes a call to a cloud function.
   * @param {String} name The function name.
   * @param {Object} data The parameters to send to the cloud function.
   */
  run(name, data) {
    var store = this.container.lookup('service:store'),
        adapter = store.adapterFor('application');

    return adapter.ajax(adapter.buildURL('functions', name), 'POST', { data: data });
  }
});

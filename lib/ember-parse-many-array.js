/**
 * Implentation of DS.ManyArray that facilitates the tracking
 * of deleted records, so that we can send proper "Remove" values
 * to the Parse REST API.
 */
var ParseManyArray = DS.ParseManyArray = DS.ManyArray.extend({
  init: function(){
    this._super.apply(this, arguments);
    this._deletedItems = new Ember.Set();
  },

  /**
   * Override to push an entry of the deleted
   * record into the set that keeps track of them.
   */
  removeRecord: function(record){
    var deleted = {
      id: record.get('id'),
      type: record.parseClassName()
    };
    this._deletedItems.add(deleted);
    this._super(record);
  }
});

/**
 * Re-opening this to force the ParseManyArray to be used when
 * creating hasMany collections.
 */
DS.RecordArrayManager.reopen({
  createManyArray: function(type, records) {
    var manyArray = DS.ParseManyArray.create({
      type: type,
      content: records,
      store: this.store
    });

    Ember.EnumerableUtils.forEach(records, function(record) {
      var arrays = this.recordArraysForRecord(record);
      arrays.add(manyArray);
    }, this);

    return manyArray;
  }
});

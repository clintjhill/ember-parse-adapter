/*
 * The file transform handles Parse's custom data format. For
 * example a Parse file might come back from the REST API
 * looking like this:
 *
 * "registeredAt": {
 *   "__type": "File",
 *   "name": "foo.jpg",
 *   "url": "http://some.s3.url.com/foo.jpg"
 * }
 *
 * This helper deserializes that structure into a special
 * EmberParseAdapter.File object. This object should not be
 * changed, instead set a new file object to the property.
 *
 * this.store.find('model').then(function(model){
 *   model.get('someFile'); // -> File object
 *   model.get('someFile.url'); // -> someFile URL
 *
 *   var file = new EmberParseAdapter.File('foo.jpg', url);
 *   model.set('someFile', file);
 * });
 *
 * When saving a record, the EmberParseAdapter.File object
 * is likewise serialized into the Parse REST API format.
 *
 * @class EmberParseAdapter.Transforms.File
 */
EmberParseAdapter.Transforms.File = DS.Transform.extend({

  deserialize: function(serialized) {
    if (!serialized) {
      return null;
    }
    return new EmberParseAdapter.File(serialized.name, serialized.url);
  },

  serialize: function(deserialized) {
    if (!deserialized) {
      return null;
    }
    return {
      __type: 'File',
      name: deserialized.get('name'),
      url: deserialized.get('url')
    };
  }

});

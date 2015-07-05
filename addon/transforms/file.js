import DS from 'ember-data';
import File from './file';

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
 * File object. This object should not be changed,
 * instead set a new file object to the property.
 *
 * this.store.find('model').then(function(model){
 *   model.get('someFile'); // -> File object
 *   model.get('someFile.url'); // -> someFile URL
 *
 *   var file = new File('foo.jpg', url);
 *   model.set('someFile', file);
 * });
 *
 * When saving a record, the File object is likewise
 * serialized into the Parse REST API format.
 *
 * @class DS.Transforms.File
 */
export default DS.Transform.extend({

  deserialize(serialized) {
    if (!serialized) {
      return null;
    }

    return File.create({
      name: serialized.name,
      url: serialized.url
    });
  },

  serialize(deserialized) {
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

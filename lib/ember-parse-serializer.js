/*
  Serializer to assure proper Parse-to-Ember encodings
*/
var ParseJSONSerializer = DS.JSONSerializer.extend({

  primaryKey: function(){
    return "objectId";
  },

  /*
    If supplied with a Parse type use that
    otherwise use the name of the Model from the namespace.
  */
  getTypeName: function(type){
    if(type === ParseUser || type.superclass === ParseUser) return ParseUser.toString();
    if(type.parseType) return type.parseType;
    var namespace = type.toString().split('.');
    return namespace[namespace.length-1];
  },

  /*
    In order to make use of the default DS.JSONSerializer
    we need to 'root' our JSON objects with the name of the
    type (pluralized for collections).
  */
  serializeRootObject: function(type, data){
    var root = this.rootForType(type),
      obj = {};
      if(Ember.isArray(data)) {
        root = this.pluralize(root);
      }
      obj[root] = data;
      return obj;
  },

  /*
    Parse API provides a batch request and this packages
    the records into the format necessary to batch.
    See: https://parse.com/docs/rest#objects-batch
  */
  serializeBatchFor: function(method, records){
    var batch = { requests: [] };
    records.forEach(function(record){
      var request = {}, typeName = this.getTypeName(record.constructor), adapter = record.get('store.adapter');
      request.method = method;
      request.path = adapter.buildUrl(typeName, record.get('id'), false, true);
      request.body = this.serialize(record, {includeId: true});
      batch.requests.push(request);
    }, this);
    return batch;
  },

  /*
    Parse uses an encoding for Pointer to associate records.
    See: https://www.parse.com/docs/rest#objects-types
  */
  addHasMany: function(hash, record, key, relationship){
    if(relationship.options.embedded){
      // DS.JSONSerializer handles the embedded case
      this._super.apply(this, arguments);
    } else {
      var array = [];
      // Serialize each child that has an ID as a Parse Pointer to help with bulk finds
      record.get(key).forEach(function(child){
        var adapter = child.store.get('adapter');
        // makes an assumption that the ParseAdapter is the only game in town
        if(child.get('id')){
          array.push({
            "__type": "Pointer",
            "className": adapter.getTypeName(child.constructor),
            "objectId": child.get('id')
          });
        } else {
          throw "Can I see your ID please?!?!";
        }
      });
      hash[key] = array;
    }
  }

});
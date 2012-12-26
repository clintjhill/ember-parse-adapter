var ParseAdapter = DS.Adapter.extend(ParseConnector, {

  serializer: ParseJSONSerializer, 
  
  getTypeName: function(type){
    if(type.parseType) return type.parseType;
    var namespace = type.toString().split('.');
    return namespace[namespace.length-1];
  },

  find: function(store, type, id){
    var model = this.getTypeName(type);
    this.request("GET", model, id, {
      success: function(data){
        store.load(type, id, data);
      },
      error: function(error){
        Ember.Logger.error('Adapter::find::error', error);
      }
    });
  },

  createRecord: function(store, type, record){
    var model = this.getTypeName(type),
      data = this.serialize(record, {includeId: true});
    this.request("POST", model, data, {
      success: function(result){
        $.extend(data, result);
        store.didSaveRecord(record, data);
      },
      error: function(error){
        Ember.Logger.error('Adapter::createRecord::error', error);
      }
    });
  },
  
  updateRecord: function(store, type, record){
    var model = this.getTypeName(type),
      data = this.serialize(record, {includeId: true});
    this.request("PUT", model, data.objectId, data, {
      success: function(result){
        $.extend(data, result);
        store.didSaveRecord(record, data);
      },
      error: function(error){
        Ember.Logger.error('Adapter::updateRecord::error', error);
      }
    });
  },
  
  deleteRecord: function(store, type, record){
    var model = this.getTypeName(type),
      data = this.serialize(record, {includeId: true});
    this.request("DELETE", model, data.objectId, {
      success: function(result){
        $.extend(data, result);
        store.didSaveRecord(record, data);
      },
      error: function(error){
        Ember.Logger.error('Adapter::deleteRecord::error', error);
      }
    });
  }
});

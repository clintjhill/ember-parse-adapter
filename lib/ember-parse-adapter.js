var ParseAdapter = DS.Adapter.extend(ParseConnector, {

  getTypeName: function(type){
    if(type.parseType) return type.parseType;
    var namespace = type.toString().split('.');
    return namespace[namespace.length-1];
  },

  getParseObject: function(type){
    var typeName = this.getTypeName(type);
    return Parse.Object.extend(typeName);
  },

  getParseQuery: function(type){
    var parseType = this.getParseObject(type);
    return new Parse.Query(parseType);
  },

  find: function(store, type, id){
    var query = this.getParseQuery(type);
    Ember.Logger.debug('Adapter::find', type);
    query.get(id, {
      success: function(data){
        var attrs = data.toJSON();
        Ember.Logger.debug('Parse::query::get::success', type, attrs);
        store.load(type, id, attrs);
      },
      error: function(error){
        if(error){
          Ember.Logger.error('Parse::query::get::error', error);
        } else {
          Ember.Logger.error('Parse::query::get::error', 'No error provided.');
        }
      }
    });
  },
  
  findMany: function(store, type, ids){
    var query = this.getParseQuery(type);
    Ember.Logger.debug('Adapter::findMany', type);
    query.containedIn('objectId', ids);
    query.find({
      success: function(data){
        Ember.Logger.debug('Parse::query::find::success', type, data);
        data.forEach(function(item, index){
          var attrs = item.toJSON();
          store.load(type, item.id, attrs);
        });
      },
      error: function(error){
        if(error){
          Ember.Logger.error('Parse::query::find::error', error);
        } else {
          Ember.Logger.error('Parse::query::find::error', 'No error provided.');
        } 
      }
    })
  },

  createRecord: function(store, type, model){
    var parseObj = new (this.getParseObject(type))(),
      data = this.serialize(model, {includeId: true});
    Ember.Logger.debug('Adapter::createRecord', type);
    parseObj.save(data, {
      success: function(result){
        Ember.Logger.debug('Parse::object::save::success', type, result);
        // TODO: Not sure I should have to do this 'id' setting.
        // Seems to me that primaryKey setting should alleviate this issue.
        // However it wasn't working without this and I didn't finish investigating.
        var hash = result.toJSON();
        hash['id'] = hash.objectId;
        store.didSaveRecord(model, hash);
      },
      error: function(result, error){
        if(error){
          Ember.Logger.error('Parse::object::save::error', error, result);
        } else {
          Ember.Logger.error('Parse::object::save::error', 'No error provided.', result);
        }
      }
    });
  },
  
  updateRecord: function(store, type, model){
    var parseObj = this.getParseObject(type),
      data = this.serialize(model, {includeId: true}),
      record = new parseObj(data);
    record.save(null,{
      success: function(result){
        Ember.Logger.debug('Parse::object::save::success', type, result);
        // TODO: See line 69!
        var hash = result.toJSON();
        hash['id'] = hash.objectId;
        store.didSaveRecord(model, hash);
      },
      error: function(result, error){
        if(error){
          Ember.Logger.error('Parse::object::save::error', error, result);
        } else {
          Ember.Logger.error('Parse::object::save::error', 'No error provided.', result);
        }
      }
    });
  },
  
  deleteRecord: function(store, type, model){
    var parseObj = this.getParseObject(type),
      data = this.serialize(model, {includeId: true}),
      record = new parseObj(data);
    record.destroy({
      success: function(result){
        Ember.Logger.debug('Parse::object::destroy::success', type, result);
        // TODO: See line 69!
        var hash = result.toJSON();
        hash['id'] = hash.objectId;
        store.didSaveRecord(model, hash)
      },
      error: function(result, error){
        if(error){
          Ember.Logger.error('Parse::object::destroy::error', error, result);
        } else {
          Ember.Logger.error('Parse::object::destroy::error', 'No error provided.', result);
        }
      }
    });
  }
});

/**
 * An Ember Data Adapter written to use Parse REST API
 * @type {DS.Adapter}
 */
var ParseAdapter = DS.Adapter.extend(ParseConnector, {

  /*
    You could change this, but Parse counts API requests so
    why not batch your stuff and keep your requests count low?
    See: https://parse.com/docs/rest#objects-batch
  */
  bulkCommit: true,

  serializer: ParseJSONSerializer,

  /**
   * Override of the initialization to set properties on
   * the Serializer.
   */
  init: function(){
    this._super.apply(this, arguments);
    var serializer = this.get('serializer');
    serializer.versionPath = this.get('versionPath');
    serializer.modelPath = this.get('modelPath');
  },

  /**
   * Implementation of the Find by ID
   * @param  {DS.Store} store the store of the model
   * @param  {DS.Model} type  Model used in the Find
   * @param  {String} id    identifier to query
   */
  find: function(store, type, id){
    var model = this.getTypeName(type);
    this.request("GET", model, id, {
      success: function(data){
        Ember.run(this, function(){
          this.didFindRecord(store, type, this.makeRootObject(type, data), id);
        });
      },
      error: function(error){
        Ember.Logger.error('Adapter::find::error', error);
      }
    });
  },

  findAll: function(store, type, since){
    var model = this.getTypeName(type);
    this.request("GET", model, {
      success: function(data){
        Ember.run(this, function(){
          this.didFindAll(store, type, this.makeRootObject(type, data.results));
        });
      },
      error: function(error){
        Ember.Logger.error('Adapter::findAll::error', error);
      }
    });
  },

  findMany: function(store, type, ids){
    var model = this.getTypeName(type);
    this.request("POST", model, {where: {objectId: {"$in": ids.join(",")}}}, {
      success: function(data){
        Ember.run(this, function(){
          this.didFindMany(store, type, this.makeRootObject(type, data.results));
        });
      },
      error: function(error){
        Ember.Logger.error('Adapter::findMany::error', error);
      }
    });
  },

  findQuery: function(store, type, query, records){
    var model = this.getTypeName(type);
    this.request("POST", model, {where: query}, {
      success: function(data){
        Ember.run(this, function(){
          this.didFindQuery(store, type, this.makeRootObject(type, data.results), records);
        });
      },
      error: function(error){
        Ember.Logger.error('Adapter::findQuery::error', error);
      }
    });
  },

  createRecord: function(store, type, record){
    var model = this.getTypeName(type),
      data = this.serialize(record, {includeId: true});
    this.request("POST", model, data, {
      success: function(result){
        Ember.run(this, function(){
          // Parse will always return "objectId" and "createdAt"
          $.extend(data, result);
          this.didCreateRecord(store, type, record, this.makeRootObject(type, data));
        });
      },
      error: function(error){
        Ember.Logger.error('Adapter::createRecord::error', error);
      }
    });
  },

  createRecords: function(store, type, records){
    if (this.get('bulkCommit') === false) {
      return this._super(store, type, records);
    }
    var batch = this.makeBatchFor("POST", records);
    this.batchRequest(batch, {
      success: function(json){
        var extendedRecords = this.extendRecords(json.results, batch);
        Ember.run(this, function(){
          this.didCreateRecords(store, type, records, this.makeRootObject(type, extendedRecords));
        });
      },
      error: function(error){
        Ember.Logger.error('Adapter::createRecords::error', error);
      }
    });
  },

  updateRecord: function(store, type, record){
    var model = this.getTypeName(type),
      data = this.serialize(record, {includeId: true});
    this.request("PUT", model, data.objectId, data, {
      success: function(result){
        Ember.run(this, function(){
          // Parse will always return "objectId" and "updatedAt"
          $.extend(data, result);
          this.didUpdateRecord(store, type, record, this.makeRootObject(type, data));
        });
      },
      error: function(error){
        Ember.Logger.error('Adapter::updateRecord::error', error);
      }
    });
  },

  updateRecords: function(store, type, records){
    if (this.get('bulkCommit') === false) {
      return this._super(store, type, records);
    }
    var batch = this.makeBatchFor("PUT", records);
    this.batchRequest(batch, {
      success: function(json){
        var extendedRecords = this.extendRecords(json.results, batch);
        Ember.run(this, function(){
          this.didUpdateRecords(store, type, records, this.makeRootObject(type, extendedRecords));
        });
      },
      error: function(error){
        Ember.Logger.error('Adapter::updateRecords::error', error);
      }
    });
  },

  deleteRecord: function(store, type, record){
    var model = this.getTypeName(type),
      data = this.serialize(record, {includeId: true});
    this.request("DELETE", model, data.objectId, {
      success: function(result){
        Ember.run(this, function(){
          this.didDeleteRecord(store, type, record);
        });
      },
      error: function(error){
        Ember.Logger.error('Adapter::deleteRecord::error', error);
      }
    });
  },

  deleteRecords: function(store, type, records){
    if (this.get('bulkCommit') === false) {
      return this._super(store, type, records);
    }
    //TODO: Maybe we could shrink the payload? No need for full body requests.
    var batch = this.makeBatchFor("DELETE", records);
    this.batchRequest(batch, {
      success: function(json){
        //TODO: We do want to tease out the success/error in the results object?
        Ember.run(this, function(){
          this.didDeleteRecords(store, type, records);
        });
      },
      error: function(error){
        Ember.Logger.error('Adapter::deleteRecords::error', error);
      }
    });
  },

  /*
    Expiremental: This is an idea to totally concat all the transactions
    together. This would work within an override of the commit method so as
    to receive the commitDetails object in order to collect all commit types.
  */
  batchCommit: function(commits){
    var updates = this.makeBatchFor("PUT", commits.updated);
    var deletes = this.makeBatchFor("DELETE", commits.deleted);
    var creates = this.makeBatchFor("POST", commits.created);
    var batch = { requests: creates.requests.concat(updates.requests.concat(deletes.requests)) };
    var adapter = this;

    this.batchRequest(batch, {
      success: function(json){
        // TODO: Need to reconcile the creates with their new objectIds somehow.
        Ember.run(adapter, function(){
            adapter.didSaveRecords(store, type, set);
        });
      },
      error: function(error){
        Ember.Logger.error('Adapter::batchCommit::error', error);
      }
    });
  },

  /*
    When Parse API returns results they are wrapped in success/error
    objects and this function extends the records with the request
    result based on success/error.
  */
  extendRecords: function(json, batch){
    var extendedRecords = batch.requests.map(function(request, index){
      var result = json[index];
      if(result.success){
        return $.extend(request.body, result.success);
      } else {
        // TODO: Is this something worth halting for?
        return request.body;
      }
    });
    return extendedRecords;
  },

  getTypeName: function(type){
    return this.get('serializer').getTypeName(type);
  },

  makeRootObject: function(type, data){
    return this.get('serializer').serializeRootObject(type, data);
  },

  makeBatchFor: function(method, records){
    return this.get('serializer').serializeBatchFor(method, records);
  }

});

/*
  Parse uses ISO 8601 format strings so we change just the default serialization.
  See: https://parse.com/docs/rest#objects-types
*/
ParseAdapter.registerTransform('date', {

    deserialize: DS.JSONTransforms.date.deserialize,

    serialize: function(date){
      if(date instanceof Date){
        return date.toISOString();
      } else if(date === undefined){
        return undefined;
      } else {
        return null;
      }
    }

});

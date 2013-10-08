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
    var model = this.getTypeName(type), adapter = this;
    return this.request("GET", model, id).then(
      function(json){ 
        adapter.didFindRecord(store, type, adapter.makeRootObject(type, json), id); 
      },
      function(xhr){ 
        adapter.didError(xhr); throw xhr; 
      }
    ).then(null, DS.rejectionHandler);
  },

  /**
   * Implementation of the Find All
   * @param {DS.Store} store the store of the model
   * @param {DS.Model} type Module used in the Find
   * @param {Obejct} since Query information object
   */
  findAll: function(store, type, since){
    var model = this.getTypeName(type), adapter = this;
    return this.request("GET", model).then(
      function(json){ 
        adapter.didFindAll(store, type, adapter.makeRootObject(type, json.results)); 
      },
      function(xhr){ 
        adapter.didError(xhr); 
        throw xhr; 
      }
    ).then(null, DS.rejectionHandler);
  },

  /**
   * Implementation of Find Many that accepts an array of objectIds
   * @param {Array} ids the array of objectIds to look up
   */
  findMany: function(store, type, ids){
    var model = this.getTypeName(type), adapter = this;
    return this.request("POST", model, {where: {objectId: {"$in": ids.join(",")}}}).then(
      function(json){
        adapter.didFindMany(store, type, adapter.makeRootObject(type, json.results));
      },
      function(xhr){
        adapter.didError(xhr);
        throw xhr;
      }
    ).then(null, DS.rejectionHandler);
  },

  findQuery: function(store, type, query, records){
    var model = this.getTypeName(type), adapter = this;
    return this.request("POST", model, {where: query}).then(
      function(json){
        adapter.didFindQuery(store, type, adapter.makeRootObject(type, json.results), records);
      },
      function(xhr){
        adapter.didError(xhr);
        throw xhr;
      }
    ).then(null, DS.rejectionHandler);
  },

  createRecord: function(store, type, record){
    var adapter = this, model = this.getTypeName(type), data = this.serialize(record, {includeId: true});
    return this.request("POST", model, data).then(
      function(json){ 
        cosole.log('running didCreateRecord');
        debugger;
        adapter.didCreateRecord(store, type, record, json);
      },
      function(xhr){ 
        adapter.didError(store, type, record, xhr); 
        throw xhr; 
      }
    ).then(null, DS.rejectionHandler);
  },

  createRecords: function(store, type, records){
    if (!this.get('bulkCommit')) {
      // This will use base createRecords which in turn iterates with createRecord (above)
      return this._super(store, type, records);
    }
    var batch = this.makeBatchFor("POST", records);
    return this.batchRequest(batch).then(
      function(json){
        adapter.reconcileBatchResults(store, type, records.toArray(), batch.requests, json);
      },
      function(xhr){
        adapter.didError(store, type, records, xhr); 
        throw xhr; 
      }
    ).then(null, DS.rejectionHandler);
  },

  updateRecord: function(store, type, record){
    var model = this.getTypeName(type), data = this.serialize(record, {includeId: true});
    this.request("PUT", model, data.objectId, data, {
      success: function(result){
        Ember.run(this, function(){
          // Parse will always return "objectId" and "updatedAt"
          $.extend(data, result);
          this.didUpdateRecord(store, type, record, this.makeRootObject(type, data));
        });
      },
      error: function(error){
        this.didError(store, type, record);
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
        Ember.run(this, function(){
          this.reconcileBatchResults(store, type, records.toArray(), batch.requests, json);
        });
      },
      error: function(error){
        // This is a big time error - bad batch or request body.
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
        this.didError(store, type, record);
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

  reconcileBatchResults: function(store, type, records, batch, json){
    batch.forEach(function(request, index){
      var result = json[index],
        record = records[index];
      if(result.success){
        this.didSaveRecord(store, type, record, this.makeRootObject(type, $.extend(request.body, result.success)));
      } else {
        this.didError(store, type, record);
      }
    },this);
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
        return {
          "__type": "Date",
          iso: date.toISOString()
        };
      } else if(date === undefined){
        return undefined;
      } else {
        return null;
      }
    }

});

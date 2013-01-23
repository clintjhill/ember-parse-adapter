var ParseConnector = Ember.Mixin.create({

  /*
    We'll need all three since we're doing both REST API calls
    as well as the transliterated calls via JavaScript for 
    CORS in Internet Explorer. 
  */
  applicationId: null,
  javascriptId: null,
  restApiId: null,

  serverUrl: "https://api.parse.com",
  versionPath: "1",
  modelPath: "classes",

  /*
    Sorta wonky - but I'll fix it later
  */
  requestHeaders: function(){
    if(!this.applicationId || !this.restApiId || !this.javascriptId){
      throw "Hey! You forgot to set your Parse Account info! https://parse.com/apps/";
    }
    return {
      "X-Parse-Application-Id": this.applicationId, 
      "X-Parse-REST-API-Key": this.restApiId
    };
  },

  /*
    Clearly this is stolen from the original Parse JavaScript SDK.
  */
  xDomainRequest: function(method, url, data, success, error){
    var xdr = new XDomainRequest();
    // transliterate to POST if not already
    if(method !== "POST"){
      data._method = method;
      method = "POST";
    }
    // add acct info to the data (notice not the REST key!)
    data._ApplicationId = this.applicationId;
    data._JavaScriptKey = this.javascriptId;
    // make the data ready for the POST body
    data = JSON.stringify(data);

    xdr.onload = function() {
      var response;
      try {
        response = JSON.parse(xdr.responseText);
      } catch (e) {
        if (error) {
          error(xdr);
        }
      }
      if (response) {
        if (success) {
          success(response, xdr);
        }
      }
    };
    xdr.onerror = xdr.ontimeout = function() {
      if(error){
        error(xdr);
      }
    };
    xdr.onprogress = function() {};
    xdr.open(method, url);
    xdr.send(data);
  },

  ajax: function(method, url, hash){ //data, success, error){
    // If XDomainRequest exists this is IE, treat the whole request differently
    if(typeof(XDomainRequest) !== 'undefined'){
      return this.xDomainRequest(method, url, hash.data, hash.success, hash.error);
    }

    var ajaxOptions = {
      url: url,
      context: this,
      type: method,
      headers: this.requestHeaders(),
      success: hash.success,
      error: hash.error,
      contentType: 'text/plain'
    };

    if(method !== "GET" && method !== "DELETE"){
      $.extend(ajaxOptions, {
        data: JSON.stringify(hash.data)
      });
    }

    jQuery.ajax(ajaxOptions);

  },

  request: function(method, model, id, data, options){

    if(Ember.typeOf(id) === 'object'){
      options = data;
      data = id;
      id = null;
    }

    if(Ember.typeOf(data) === 'object' && !options){
      options = data;
      data = {};
    }

    this.ajax(method, this.buildUrl(model, id), 
      {data: data, success: options.success, error: options.error});
  },

  batchRequest: function(data, options){
    var url = "%@/%@/batch".fmt(this.serverUrl, this.versionPath);
    this.ajax("POST", url, {data: data, success: options.success, error: options.error});
  },

  buildUrl: function(type, id){
    var modelUrl = "%@/%@/%@/%@".fmt(this.serverUrl, this.versionPath, this.modelPath, type);
    if(id){
      modelUrl += "/" + id;
    }
    return modelUrl;
  }
});

/*
  Serializer to assure proper Parse-to-Ember encodings
*/
var ParseJSONSerializer = DS.JSONSerializer.extend({

  primaryKey: function(){
    return "objectId";
  },

  addHasMany: function(hash, record, key, relationship){
    if(relationship.options.embedded){
      // DS.JSONSerializer handles the embedded case
      this._super();
    } else {
      var array = [];
      // Serialize each child that has an ID as a Parse Pointer to help with bulk finds
      record.get(key).forEach(function(child){
        if(child.get('id')){
          array.push({
            "__type": "Pointer", 
            "className": this.getTypeName(child), 
            "objectId": child.get('id')
          });
        }
        //TODO: Deal with those pesky unsaved children!!
      });
      hash[key] = array;
    }
  }

});
var ParseAdapter = DS.Adapter.extend(ParseConnector, {

  /*
    You could change this, but Parse counts API requests so
    why not batch your stuff and keep your requests count low?
  */
  bulkCommit: true,

  serializer: ParseJSONSerializer, 

  /*
    If supplied with a Parse type use that
    otherwise use the name of the Model from the namespace.
  */
  getTypeName: function(type){
    if(type.parseType) return type.parseType;
    var namespace = type.toString().split('.');
    return namespace[namespace.length-1];
  },

  makeRootObject: function(type, data){
    var serializer = this.get('serializer'),
      root = serializer.rootForType(type),
      obj = {};
      if(Ember.isArray(data)) {
        root = serializer.pluralize(root);
      }
      obj[root] = data;
      return obj;
  },

  makeBatchFor: function(method, records){
    var batch = { requests: [] };
    records.forEach(function(record){
      var request = {}, typeName = this.getTypeName(record.constructor);
      request.method = method;
      request.path = "/%@/%@/%@".fmt(this.versionPath, this.modelPath, typeName);
      request.body = this.serialize(record);
      batch.requests.push(request);
    }, this);
    return batch;
  },

  extendRecords: function(json, batch){
    var extendedRecords = batch.requests.map(function(request, index){
      var result = json[index];
      if(result.success){
        return $.extend(request.body, result.success);  
      } else {
        return request.body;
      }
    });
    return extendedRecords;
  },

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
        Ember.Logger.error('Adapter::find::error', error);
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
        Ember.Logger.error('Adapter::find::error', error);
      }
    });
  },

  /*commit: function(store, commitDetails){
    
    if (this.get('bulkCommit') === false) {
      return this._super(store, commitDetails);
    }

    var adapter = this;
    var relationships = commitDetails.relationships;

    function filter(records) {
      var filteredSet = Ember.OrderedSet.create();

      records.forEach(function(record) {
        if (adapter.shouldSave(record)) {
          filteredSet.add(record);
        }
      });

      return filteredSet;
    }

    this.groupByType(commitDetails.created).forEach(function(type, set) {
      this.createRecords(store, type, filter(set)).then(function(result){
        var x = relationships;
        debugger;
      });
    }, this);

    this.groupByType(commitDetails.updated).forEach(function(type, set) {
      this.updateRecords(store, type, filter(set));
    }, this);

    this.groupByType(commitDetails.deleted).forEach(function(type, set) {
      this.deleteRecords(store, type, filter(set));
    }, this);

  },*/

  batchCommit: function(commits, callback){
    var puts = this.makeBatchFor("PUT", commits.updated);
    var deletes = this.makeBatchFor("DELETE", commits.deleted);
    var creates = this.makeBatchFor("POST", commits.created);
    var batch = { requests: creates.requests.concat(puts.requests.concat(deletes.requests)) };
    var adapter = this;

    this.batchRequest(batch, {
      success: function(json){
        var extendedRecords = this.extendRecords(json, batch);
        Ember.run(this, function(){
          
            adapter.didSaveRecords(store, type, set, adapter.makeRootObject(type, set));
          
          callback();
        });
      },
      error: function(error){
        Ember.Logger.error('Adapter::batchCommit::error', error);
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
    var promise = Ember.Deferred.create();
    var batch = this.makeBatchFor("POST", records);
    this.batchRequest(batch, {
      success: function(json){
        var extendedRecords = this.extendRecords(json, batch);
        //promise.resolve({store: store, type: type, records: records, data: this.makeRootObject(type, extendedRecords)});
        Ember.run(this, function(){
          this.didCreateRecords(store, type, records, this.makeRootObject(type, extendedRecords));
          promise.resolve(records);
        });
      },
      error: function(error){
        Ember.Logger.error('Adapter::createRecords::error', error);
        promise.reject(error);
      }
    });
    return promise;
  },

  updateRecord: function(store, type, record){
    var model = this.getTypeName(type),
      data = this.serialize(record, {includeId: true});
    this.request("PUT", model, data.objectId, data, {
      success: function(result){
        Ember.run(this, function(){
          // Parse will always return "createdAt"
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
        var extendedRecords = this.extendRecords(json, batch);
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
          $.extend(data, result);
          this.didDeleteRecord(store, type, record, this.makeRootObject(type, data));
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
        var extendedRecords = this.extendRecords(json, batch);
        Ember.run(this, function(){
          this.didDeleteRecords(store, type, records, this.makeRootObject(type, extendedRecords));
        });
      },
      error: function(error){
        Ember.Logger.error('Adapter::deleteRecords::error', error);
      }
    });
  }
});

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
var ParseMixin = Ember.Mixin.create({
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date')
});

var ParseModel = DS.Model.extend(ParseMixin);
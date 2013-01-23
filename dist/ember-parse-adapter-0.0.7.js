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
    if(!this.applicationId || !this.restApiId){
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

  ajax: function(method, url, data, success, error){
    // If XDomainRequest exists this is IE, treat the whole request differently
    if(typeof(XDomainRequest) !== 'undefined'){
      return this.xDomainRequest(method, url, data, success, error);
    }
    
    var ajaxOptions = {
      url: url,
      type: method, 
      headers: this.requestHeaders(),
      success: success, 
      error: error,
      contentType: 'text/plain'
    };

    if(method !== "GET" && method !== "DELETE"){
      $.extend(ajaxOptions, {
        data: JSON.stringify(data)
      });
    }

    return jQuery.ajax(ajaxOptions);

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

    this.ajax(method, this.buildUrl(model, id), this.encodeDataTypes(data), options.success, options.error);
  },    

  buildUrl: function(type, id){
    var modelUrl = "%@/%@/%@/%@".fmt(this.serverUrl, this.versionPath, this.modelPath, type);
    if(id){
      modelUrl += "/" + id;
    }
    return modelUrl;
  },

  encodeDataTypes: function(data){
    // TODO: Maybe there will be encoding necessary someday?
    return data;
  }
});

/*
  Serializer to assure proper Parse-to-Ember encodings
*/
var ParseJSONSerializer = DS.JSONSerializer.extend({
  
  primaryKey: function(){
    return "objectId";
  }

});

/*
  JSONTransforms to facilitate ISO Dates
*/
var ParseJSONTransforms = {
  /*
    Hang on to these so we can keep the implementation around.
  */
  emberDate: DS.JSONTransforms.date,

  isoDate: {

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
  }
};

/*
  Because Parse uses ISO Dates in their data stores we need to modify
  the Date JSON serializer to return ISO strings.
*/
DS.JSONTransforms.date = {
  deserialize: ParseJSONTransforms.isoDate.deserialize,
  serialize: ParseJSONTransforms.isoDate.serialize
};

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

var ParseMixin = Ember.Mixin.create({
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date')
});

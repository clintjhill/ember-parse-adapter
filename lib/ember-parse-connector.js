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
    Be sure that on every attempt to Parse API we have proper account
    information.
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

  ajax: function(method, url, hash){
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

/**
 * Ember-to-Parse Connector to manage the AJAX request.
 * @type {Ember.Mixin}
 */
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

  /**
   * Supplies proper HTTP header information for the Parse AJAX request.
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

  /**
   * Base AJAX implementation that is wrapped in an Ember Promise.
   */
  ajax: function(method, url, data){

    // If XDomainRequest exists this is IE, treat the whole request differently
    if(typeof(XDomainRequest) !== 'undefined'){
      return this.xDomainRequest(method, url, data); //, hash.success, hash.error);
    }

    var adapter = this;

    return new Ember.RSVP.Promise(function(resolve, reject) {

      var ajaxOptions = {
        url: url,
        context: adapter,
        type: method,
        headers: adapter.requestHeaders(),
        contentType: 'text/plain'
      };
  
      //If it's a PUT or a POST
      if(method !== "GET" && method !== "DELETE"){
        $.extend(ajaxOptions, { data: JSON.stringify(data) });
      }

      // Implement AJAX callbacks with Promises

      ajaxOptions.success = function(json) {
          Ember.run(null, resolve, json);
      };
           
      ajaxOptions.error = function(jqXHR, textStatus, errorThrown) {
        if (jqXHR) { jqXHR.then = null; }
        Ember.run(null, reject, jqXHR);
      };

      // go ... 
      jQuery.ajax(ajaxOptions);

    });

  },

  /**
   * Parse REST API request call.
   *
   * Abstracted AJAX function to setup options for the real AJAX call
   * @param  {String} method  GET/POST/PUT/DELETE
   * @param  {String} model   string name of the class/type we're sending
   * @param  {String} id      identifier for the record (objectId in Parse)
   * @param  {Object} data    POST/PUT body data and other options
   */
  request: function(method, model, id, data){
    var url, custom;
    // if id argument is an object it is not intended to be used as identifier
    if(Ember.typeOf(id) === 'object' && !data){
      data = id;
      id = null;
    }
    // if the request was provided URL information use it instead of the model name.
    if(data && data.url){
      url = data.url;
      custom = true; // this means we're doing a custom Parse REST call
    } else {
      url = model;
      custom = false; // this means it's a natural Parse REST call
    }
    return this.ajax(method, this.buildUrl(url, id, custom), {data: data});
  },

  /**
   * Sends the Request to the Batch endpoint for Parse REST API.
   *
   * An abstraction for the request function that intercepts the URL 
   * for batch on the Parse side.
   */
  batchRequest: function(data, options){
    var url = "%@/%@/batch".fmt(this.serverUrl, this.versionPath);
    return this.request("POST", url, {data: data});
  },

  /**
   * Creates a URL to use for the HTTP request to Parse.
   *
   * This function will perform inspection for the parseClass being a
   * DS.ParseUser in order to assure that the special pathing Parse uses
   * for User objects is set accordingly. Also handles the 'custom' URL case
   * where the Parse Model name is not used.
   *
   * @param  {String} parseClass  string of the type/class in the URL
   * @param  {String} id          string identifier (objectId in Parse, id in Ember)
   */
  buildUrl: function(parseClass, id, custom, relative){
    var modelUrl;
    if(parseClass === 'DS.ParseUser'){
      modelUrl = "/%@/%@".fmt(this.versionPath, "users");
    } else if(custom) {
      modelUrl = "/%@/%@".fmt(this.versionPath, parseClass);
    } else {
      modelUrl = "/%@/%@/%@".fmt(this.versionPath, this.modelPath, parseClass);
    }
    if(!relative){
      modelUrl = this.serverUrl + modelUrl;
    }
    if(id){
      modelUrl += "/" + id;
    }
    return modelUrl;
  }
});

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

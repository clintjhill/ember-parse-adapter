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
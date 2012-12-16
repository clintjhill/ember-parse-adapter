var ParseAdapter = DS.Adapter.extend({

	version: "0.0.1",
	
	getTypeName: function(type){
		if(type.parseType) return type.parseType;
		var namespace = type.toString().split('.');
		return namespace[namespace.length-1];
	},

	getParseObject: function(type){
		var typeName = this.getTypeName(type);
		return Parse.Object.extend(typeName);
	},

	find: function(store, type, id){
		var parseType = this.getParseObject(type);
		var query = new Parse.Query(parseType);
		Ember.Logger.debug('Parse::query', type);
		query.get(id, {
			success: function(data){
				var dates = {createdAt: data.createdAt, updatedAt: data.updatedAt};
				var attrs = $.extend(data.attributes, dates);
				Ember.Logger.debug('Parse::query::success', type, attrs);
				store.load(type, id, attrs);
			},
			error: function(error){
				if(error){
					Ember.Logger.error('Parse::query::error', error);
				} else {
					Ember.Logger.error('Parse::query::error', 'No error provided.');
				}
			}
		});
	},
	
	findMany: function(store, type, ids){
		var parseType = this.getParseObject(type);
		var query = new Parse.Query(parseType);
		Ember.Logger.debug('Parse::query', type);
		query.containedIn('objectId', ids);
		query.find({
			success: function(data){
				Ember.Logger.debug('Parse::query::success', type, data);
				data.forEach(function(item, index){
					var dates = {createdAt: item.createdAt, updatedAt: item.updatedAt};
					var attrs = $.extend(item.attributes, dates);
					store.load(type, item.id, attrs);
				});
			},
			error: function(error){
				if(error){
					Ember.Logger.error('Parse::query::error', error);
				} else {
					Ember.Logger.error('Parse::query::error', 'No error provided.');
				}	
			}
		})
	},

	createRecord: function(store, type, model){

	},
	
	updateRecord: function(store, type, model){

	},
	
	deleteRecord: function(store, type, model){

	}
});
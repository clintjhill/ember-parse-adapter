function expectUrl(url, desc) {
  // because the Parse API is CORS and we have a server URL ...
  equal(ajaxUrl, adapter.serverUrl + url, "the URL is " + desc);
}

function expectType(type) {
  equal(ajaxType, type, "the HTTP method is " + type);
}

function expectData(hash) {
  deepEqual(ajaxHash.data, hash, "the hash was passed along");
}

function expectState(state, value, obj) {
  if (value === undefined) { value = true; }
  var flag = "is" + state.charAt(0).toUpperCase() + state.substr(1);
  equal(Ember.get(obj, flag), value, "the object is " + (value === false ? "not " : "") + state);
}

function expectStates(coll, state, value) {
  coll.forEach(function(thing) {
    expectState(state, value, thing);
  });
}

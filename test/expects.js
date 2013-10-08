var expectUrl = function(url, desc) {
  // because the Parse API is CORS and we have a server URL ...
  equal(ajaxUrl, adapter.serverUrl + url, "the URL is " + desc);
};

var expectType = function(type) {
  equal(ajaxType, type, "the HTTP method is " + type);
};

var expectData = function(hash) {
  deepEqual(ajaxHash.data, hash, "the hash was passed along");
};

var expectState = function(state, value, o) {
  o = o || post || user;
  if (value === undefined) { value = true; }
  var flag = "is" + state.charAt(0).toUpperCase() + state.substr(1);
  equal(get(o, flag), value, "the object is " + (value === false ? "not " : "") + state);
};

var expectStates = function(coll, state, value) {
  coll.forEach(function(thing) {
    expectState(state, value, thing);
  });
};

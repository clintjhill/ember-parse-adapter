function async(callback, timeout) {
  stop();

  timeout = Ember.run.later(function() {
    start();
    ok(false, "Timeout was reached");
  }, timeout || 100);

  return function() {
    Ember.run.cancel(timeout);
    start();
    callback.apply(this, arguments)
  };
};

function invokeAsync(callback, timeout) {
  timeout = timeout || 1;

  setTimeout(async(callback, timeout+100), timeout);
};

import ParseSession from '../services/session';

export function initialize(container) {
  container.register('service:session', ParseSession);
  container.injection('route', 'session', 'service:session');
  container.injection('controller', 'session', 'service:session');
  container.injection('component', 'session', 'service:session');
}

export default {
  before: 'store',
  name: 'parse',
  initialize: initialize
};

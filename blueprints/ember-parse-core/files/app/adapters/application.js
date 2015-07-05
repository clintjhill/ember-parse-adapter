import ParseAdapter from 'ember-parse/adapters/parse';
import ENV from '../config/environment';

export default ParseAdapter.extend({
  PARSE_APPLICATION_ID: ENV['ember-parse'].PARSE_APPLICATION_ID,
  PARSE_JAVASCRIPT_KEY: ENV['ember-parse'].PARSE_JAVASCRIPT_KEY,
});

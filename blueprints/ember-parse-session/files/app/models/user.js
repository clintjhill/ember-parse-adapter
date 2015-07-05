import ParseUser from 'ember-parse/models/parse-user';
import DS from 'ember-data';

var attr = DS.attr;

export default ParseUser.extend({
  /**
   * This model already has this attributes.
   *
   * username: attr('string'),
   * password: attr('password'),
   * email: attr('string'),
   * emailVerified: attr('boolean'),
   * sessionToken: attr('string'),
   * createdAt: attr('date'),
   * updatedAt: attr('date'),
   *
   *
   * Add custom attributes below.
   * For example:
   *
   * firstName: attr('string'),
   * lastName: attr('string')
   */
});

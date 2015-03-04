var transform;

module("Unit - ACL transform", {
    setup: function(){
        transform = EmberParseAdapter.Transforms.ACL.create();
    },
    teardown: function(){
        Ember.run(transform, 'destroy');
    }
});

test("should serialize", function() {
    var hash = {
        'id1': {
            read: true,
            write: true,
        },
        'role': {
            read: true,
        },
        '*': {
            write: true,
        },
    };
    var acl = EmberParseAdapter.ACL.create(hash);
    var data = transform.serialize(acl);
    equal(data.id1, acl.get('id1'), 'id1 is preserved');
    equal(data.role, acl.get('role'), 'role is preserved');
    equal(data['*'], acl.get('*'), '* is preserved');
});

test("should deserialize", function() {
    var data = {
        'id1': {
            read: true,
            write: true,
        },
        'role': {
            read: true,
        },
        '*': {
        },
    };
    var acl = transform.deserialize(data);
    ok(acl instanceof EmberParseAdapter.ACL, 'is an acl');

    equal(acl.get('id1'), data.id1, 'id1 is preserved');
    equal(acl.get('role'), data.role, 'role is preserved');
    equal(acl.get('*'), data['*'], '* is preserved');
});

test("should deserialize null to null", function() {
    var acl = transform.deserialize(null);
    equal(acl, null, 'serialization of null is null');
});

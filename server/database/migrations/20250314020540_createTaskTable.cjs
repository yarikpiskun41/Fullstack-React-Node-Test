
exports.up = function(knex) {
  return knex.schema.createTable('tasks', function(table) {
    table.increments('id').primary()
    table.string('title')
    table.text('description')
    table.string('status')
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('tasks')
};

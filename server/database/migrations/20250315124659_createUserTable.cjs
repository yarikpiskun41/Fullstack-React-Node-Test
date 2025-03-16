
exports.up = async function(knex) {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("username").notNullable().unique();
    table.string("password").notNullable();
    table.timestamps(true, true);
  });
  await knex.schema.alterTable("tasks", (table) => {
    table.integer("user_id").unsigned().references("id").inTable("users");
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable("tasks", (table) => {
    table.dropColumn("user_id");
  });
  await knex.schema.dropTable("users");
};

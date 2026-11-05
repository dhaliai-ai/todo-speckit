export default (sequelize, Sequelize) => {
  const Todo = sequelize.define("todo", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    listId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "lists",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    title: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    completed: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    dueDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  });

  return Todo;
};

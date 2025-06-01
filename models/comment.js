const {DataTypes, Model} = require("sequelize")

class Comment extends Model {
    static init(sequelize) {
        return super.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                diary_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false
                },
                content: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                    validate: {
                        notEmpty: true
                    }
                }
            },
            {
                sequelize,
                modelName: "Comment",
                tableName: "comments",
                charset: "utf8mb4",
                collate: "utf8mb4_general_ci",
                timestamps: true
            }
        )
    }

    static associate(models) {
        models.Comment.belongsTo(models.User, {foreignKey: "user_id", targetKey: "uid", as: "writer"})
        models.Comment.belongsTo(models.Diary, {foreignKey: "diary_id", targetKey: "id", as: "diary"})
    }
}

module.exports = Comment;
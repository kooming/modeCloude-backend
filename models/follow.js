const {DataTypes, Model} = require("sequelize")

class Follow extends Model {
    static init(sequelize) {
        return super.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                follower_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                following_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                }
            },
            {
                sequelize,
                modelName: "Follow",
                tableName: "follows",
                charset: "utf8mb4",
                collate: "utf8mb4_general_ci",
                timestamps: true
            }
        )
    }

    static associate(models) {
        models.Follow.belongsTo(models.User, {foreignKey: "follower_id", targetKey: "uid", as: "follower"})
        models.Follow.belongsTo(models.User, {foreignKey: "following_id", targetKey: "uid", as: "following"})
    }
}

module.exports = Follow;
const {DataTypes, Model} = require("sequelize");

class User extends Model {
    static init(sequelize) {
        return super.init(
            {
                uid : {
                    type : DataTypes.BIGINT,
                    autoIncrement : true,
                    primaryKey : true
                },
                nick_name: {
                    type : DataTypes.STRING(30),
                    allowNull : false
                },
                profile_image : {
                    type : DataTypes.STRING(255),
                    allowNull: true
                },
                bio : {
                    type : DataTypes.STRING(300),
                    allowNull : true
                }
            },
            {
                sequelize,
                modelName: "User",
                tableName: "users",
                charset: "utf8mb4",
                collate: "utf8mb4_general_ci",
                timestamps: true 
            }
        )
    }
    static associate(models) {
        models.User.hasMany(models.Diary, {foreignKey : "user_id", sourceKey : "uid", as : "Diaries"})
        models.User.hasMany(models.Comment, {foreignKey : "user_id", sourceKey : "uid", as : "comments"})
        // models.User.belongsToMany(models.User, {through:"follows", foreignKey : "following_id", otherKey : "follower_id", as : "followers"})
        // models.User.belongsToMany(models.User, {through:"follows", foreignKey : "follower_id", otherKey: "following_id", as : "followings"})
        models.User.hasMany(models.Follow, {foreignKey: 'follower_id',as: 'Followings',});
        models.User.hasMany(models.Follow, {foreignKey: 'following_id',as: 'Followers',});
    }
}

module.exports = User;
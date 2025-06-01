const {DataTypes, Model } = require("sequelize")

class Diary extends Model {
    static init(sequelize) {
        return super.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false
                },
                title: {
                    type: DataTypes.STRING(100),
                    allowNull: false
                },
                content: {
                    type: DataTypes.TEXT,
                    allowNull: false
                },
                is_public: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false
                },
            },
            {
                sequelize,
                modelName: "Diary",
                tableName: "diaries",
                charset: "utf8mb4",
                collate: "utf8mb4_general_ci",
                timestamps: true
            }
        )
    }

    static associate(models) {
        models.Diary.belongsTo(models.User, {foreignKey: "user_id", targetKey: "uid", as: "writer" ,onDelete: "CASCADE" });
        models.Diary.hasMany(models.Comment, {foreignKey: "diary_id", sourceKey: "id", as: "comments"});
        models.Diary.hasMany(models.DiaryImg, {foreignKey: "diary_id", sourceKey: "id",as: "images", onDelete: "CASCADE",});
        models.Diary.hasOne(models.DiaryEmotion, {foreignKey: "diary_id",sourceKey: "id",as: "emotionLog"});
    }
}

module.exports = Diary;
const {DataTypes, Model } = require("sequelize")

class Emotion extends Model {
    static init(sequelize) {
        return super.init(
            {
                id: {
                type : DataTypes.STRING(30),
                allowNull : false,
                primaryKey: true
                },
                color : {
                    type : DataTypes.STRING(20), 
                    allowNull:true
                },
                name : {
                  type : DataTypes.STRING(20),  
                  allowNull:false
                },
                emoji : {
                    type : DataTypes.STRING(20),
                    allowNull:false,
                }
            },
            {
                sequelize,
                modelName: "Emotion",
                tableName: "emotions",
                charset: "utf8mb4",
                collate: "utf8mb4_general_ci",
                timestamps: false
            }
        )
    }
    static associate(models) {
        models.Emotion.hasMany(models.Diary, {foreignKey : "suggested_emotion_id", as: "suggestedDiaries" })
    }
}

module.exports = Emotion;
    const { DataTypes, Model } = require("sequelize");

    class DiaryEmotion extends Model {
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
              allowNull: true
            },
            user_id: {
              type: DataTypes.BIGINT,
              allowNull: false
            },
            userEmotion: {  
              type: DataTypes.STRING,
              allowNull: false
            },
            selectEmotion: {   
              type: DataTypes.STRING,
              allowNull: true
            },
            date: {
              type: DataTypes.DATEONLY,
              allowNull: false,
              defaultValue: DataTypes.NOW
            }
          },
          {
            sequelize,
            modelName: "DiaryEmotion",
            tableName: "diary_emotions",
            charset: "utf8mb4",
            collate: "utf8mb4_general_ci",
            timestamps: false
          }
        );
      }

      static associate(models) {
        models.DiaryEmotion.belongsTo(models.User, {foreignKey: "user_id",targetKey: "uid",as: "writer",onDelete: "CASCADE"});
        models.DiaryEmotion.belongsTo(models.Emotion, {foreignKey: "userEmotion",targetKey: "id",as: "userEmotionData"});
        models.DiaryEmotion.belongsTo(models.Emotion, {foreignKey: "selectEmotion",targetKey: "id",as: "aiEmotionData"});
        models.DiaryEmotion.belongsTo(models.Diary, {foreignKey: "diary_id",targetKey: "id",as: "diary"});
      }
    }

    module.exports = DiaryEmotion

// models/diaryImg.js
const { DataTypes, Model } = require("sequelize");

class DiaryImg extends Model {
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
        image_url: {
          type: DataTypes.STRING,
          allowNull: false
        }
      },
      {
        sequelize,
        modelName: "DiaryImg",
        tableName: "diary_imgs",
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
        timestamps: false
      }
    );
  }

  static associate(models) {
    models.DiaryImg.belongsTo(models.Diary, {foreignKey: "diary_id",targetKey: "id",as: "diary", onDelete: 'CASCADE'});
  }
}

module.exports = DiaryImg;

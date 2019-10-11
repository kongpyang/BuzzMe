var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    unique: true,
    required: true
  },

  saved: {
    type: Boolean,
    required: true,
    default: false
  },
  
  deleted: {
    type: Boolean,
    required: true,
    default: false
  },

    summary: {
      type: String,
      required: false,
      default: "No Summary Available"
    },


  note: {
    type: Schema.Types.ObjectId,
    ref: "Note"
  }
});

var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;
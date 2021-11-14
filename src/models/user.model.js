import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema(
  {
    role:{
      type:String,
      required:true,
      default:"user",
    },
    fullname: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: 7,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password must not contain 'password'");
        }
        if (value.trim().includes(" "))
          throw new Error("Password must not contain space");
      },
    },
    dateOfBirth: {
      type: Date,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email address");
        }
      },
      sparse: true,
      index: true,
    },
    gender: {
        type: String,
    },
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    isVerifyEmail: {
      type : Boolean,
      default:"false",
    },
    isVerifyPhone: {
      type : Boolean,
      default:"false"
    },
    emailToken: {
      type: String,
      default: null,
    },
    lastLogin: {
        type: Date,
        timestamps: true,
    },
    lastLogout: {
        type: Date,
        timestamps: true,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  userObject.tokens = undefined;
  return userObject;
};
///Get User Token
userSchema.methods.getToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET_KEY);
  user.tokens.push({ token });
  await user.save();
  return token;
};
//Hash the plain text password before saving
userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});
///Find User In the database

userSchema.statics.findByCredentials = async (email, password, phoneNumber) => {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.findOne({ phoneNumber });
    if(!user){
      throw new Error("User does not exist")
    }
  }
  const isMatchPassword = await bcrypt.compare(password, user.password);
  if (!isMatchPassword) {
    throw new Error("Password is not correct");
  }
  return user;
};

const User = mongoose.model("User", userSchema)
export default User;
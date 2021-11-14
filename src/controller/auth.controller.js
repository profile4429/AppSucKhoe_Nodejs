import mongoose from "mongoose";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import sgMail from "@sendgrid/mail";
sgMail.setApiKey(
  "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"
);
////Send Email Template
const sendEmail = async (user) => {
  let msg = {
    from: "hanhphucao25@gmail.com",
    to: user.email,
    subject: `[Test] - Vui lòng xác minh email của bạn`,
    html: `
            <h3>Thân gửi ${user.fullname},</h3>
            <p>Chân thành cảm ơn anh/chị đã dành thời gian đăng ký tài khoản của chúng tôi.</p>
            <p>Anh/chị vui lòng click vào địa chỉ dưới đây để hoàn thành việc đăng ký tài khoản.</p>
            <a href="http://localhost:3000/auth/verify-email?emailToken=${user.emailToken}">Xác minh email</a>
            <br />
            <p><b>Trân trọng !!!<b></p>
        `,
  };

  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

///Register
export const registerUser = async (req, res) => {
    ///checking if email existed
    const emailExist = await User.findOne({email: req.body.email!=null});
    const phoneExist = await User.findOne({phoneNumber: req.body.phoneNumber!=null});
    if(emailExist || phoneExist) return res.status(400).send("Email or Phone Number already exists !");
    ///Generate EmailToken if SignUp With Email
    try {
      let emailToken;
      if(req.body.email!=null){
         emailToken = jwt.sign(
          { email: req.body.email },process.env.EMAIL_TOKEN_SECRET_KEY
      )}else { emailToken =null;}
        // Create a new user
        const newUser = new User({
            fullname : req.body.fullname,
            email : req.body.email,
            password : req.body.password,
            dateOfBirth : req.body.dateOfBirth,
            gender : req.body.gender,
            phoneNumber : req.body.phoneNumber,
            emailToken : emailToken,
        });
       ///Save User
        await newUser.save();
        ///Verify If Email Verification Sended
        if(req.body.email!=null){
        let isSendEmail = await sendEmail(newUser);
          if (isSendEmail) {
            res.json({
                success: true,
                message: 'Người dùng được tạo thành công. Vui lòng kiểm tra email của bạn để xác nhận thông tin tài khoản.',
                // user: newUser,
            })
         } else {
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra trong quá trình gửi email.'
            })
            }
          }else res.send(newUser);
    } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống.",
    });
  }
};

//verityEmail
export const verityEmail = async (req, res) => {
  const emailToken = req.query.emailToken;

  if (!emailToken) {
    return res.status(401).json({
      success: false,
      message: "EmailToken không chính xác.",
    });
  }

  const user = await User.findOne({ emailToken });

  if (!user)
    return res.status(401).json({
      success: false,
      message: "EmailToken không chính xác.",
    });

  try {
    let updatedUser = {
      emailToken: null,
      isVerifyEmail: true,
    };

    const infoUpdateCondition = { emailToken: emailToken };

    updatedUser = await User.findOneAndUpdate(
      infoUpdateCondition,
      updatedUser,
      { new: true }
    );

    if (!updatedUser)
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại trong hệ thống.",
      });

    console.log(emailToken);

    res.json({
      success: true,
      message:
        "Tài khoản đã được xác minh, vui lòng đăng nhập và sử dụng dịch vụ.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống.",
    });
  }
};
//=========
import otpGenerator from "otp-generator";
import crypto from "crypto";
const key = process.env.OTP_SECRET_KEY;
// import msg91 from "msg91";

// create otp
async function createOtp(params, callback) {
  const otp = otpGenerator.generate(6, {
    alphabets: false,
    upperCase: false,
    specialChars: false,
  });

  const ttl = 5 * 60 * 1000; //5p de test
  const expires = Date.now() + ttl;
  const data = `${params.phoneNumber}.${otp}.${expires}`;
  const hash = crypto.createHmac("sha256", key).update(data).digest("hex");
  const fullHash = `${hash}.${expires}`;

  console.log(`Your OTP is ${otp}`);

  //send sms

  return callback(null, fullHash);
}
export const otpSignup = async (req, res, next) => {
  const phoneExist = await User.findOne({phoneNumber: req.body.phoneNumber,});
  console.log(phoneExist);
  if (phoneExist) {return res.status(400).send("Phone number already exists !");}else{

  createOtp(req.body, (error, results) => {
    if (error) {
      return next(error);
    }
    return res.status(200).send({
      message: "Success",
      data: results,
    });
  });
};
};
//verify otp

async function verifyOtp(params, callback) {
  let [hashValue, expires] = params.hash.split(".");
  let now = Date.now();

  if (now > parseInt(expires)) return callback("OTP expired");
  let data = `${params.phoneNumber}.${params.otp}.${expires}`;
  let newCalculateHash = crypto
    .createHmac("sha256", key)
    .update(data)
    .digest("hex");

  if (newCalculateHash === hashValue) {
    return callback(null, "Success");
  }
  return callback("Invalid OTP");
}

export const verifyOTP = async (req, res, next) => {
  verifyOtp(req.body, (error, results) => {
    if (error) {
      return next(error);
    }
    return res.status(200).send({
      message: "Success",
      data: results,
    });
  });
};

///Login
export const loginUser = async (req, res) => {
  try {
    console.log(req.body.password);
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password,
      req.body.phoneNumber
    );
    const token = await user.getToken();

    res.send({ user, token });
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};
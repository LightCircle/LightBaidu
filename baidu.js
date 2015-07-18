/**
 * @file 百度推送<br>
 *   需要在配置文件里设定两个参数，可以在百度开发者管理平台获取<br>
 *     secretKey:<br>
 *     apiKey:<br>
 *   百度推送的RESTApi参考<br>
 *     http://developer.baidu.com/wiki/index.php?title=docs/cplat/push/api<br>
 * @module light.bridge.baidu
 * @author fzcs@live.cn
 * @version 1.0.0
 */

var light    = require("light-core")
  , crypto   = require("crypto")
  , request  = light.util.request
  , constant = require("../constant")
  , _        = light.util.underscore
  , config   = light.framework.config;

/**
 * @desc 给指定的Tag发送消息,Tag与用户的关联在管理画面指定
 * @param {String} tag 要推送的tag
 * @param {Object} message 推送内容
 * @param {Function} callback 推送后的回调函数
 */

exports.pushTag = function (tag, message, callback) {

  var meta = getMessageBody("2", message);
  meta.tag = tag;
  post(meta, callback);
};

/**
 * @desc 推送给所有人
 * @param {Object} message 推送内容
 * @param {Function} callback 推送后的回调函数
 */
exports.pushAll = function (message, callback) {

  var meta = getMessageBody("3", message);
  post(meta, callback);
};

/**
 * @desc 推送给指定的人
 * 用无账户系统模式在百度登陆设备，可以获取唯一的userId来识别设备
 * 这个userId与业务的ID不同，他们的关联关系需要自己维护
 * @param {String} token 注册设备时，获得的userId，
 * @param {Object} message 推送内容
 * @param {Function} callback 推送后的回调函数
 */
exports.push = function (token, message, callback) {

  var meta = getMessageBody("1", message);
  meta.user_id = token;

  post(meta, callback);
};

/**
 * 获取消息本体结构
 * @param type
 * @param message
 * @returns {{}}
 * @ignore
 */
function getMessageBody(type, message) {

  var meta = {};
  meta.method = "push_msg";
  meta.apikey = config.push.baiduApiKey;
  meta.push_type = type;     // 1:单个人 2:一群人 3:所有用户
  meta.message_type = "1";  // 0:消息 1:通知
  meta.timestamp = Math.round(new Date().getTime() / 1000) + "";

  meta.msg_keys = message.custom_content.notifyid;
  meta.messages = JSON.stringify(message);
  meta.sign = sign(meta);

  return meta;
}

/**
 * 获取调用参数签名值
 * @param stuff
 * @returns {*}
 * @ignore
 */
function sign(stuff) {

  var part = "POST" + constant.BAIDU_PUSH_URL;
  part += _.map(_.keys(stuff).sort(), function (key) {
    return key + "=" + stuff[key];
  }).join("");
  part += config("push.baiduSecretKey");

  return md5(encodeURIComponent(part));
}

function md5(stuff) {
  return crypto.createHash("md5").update(stuff, "utf8").digest("hex");
}

/**
 * 进行推送数据
 * @param data
 * @param callback
 * @ignore
 */
function post(data, callback) {

  request.post({url: constant.BAIDU_PUSH_URL, form: data}, function (err, response, body) {
    if (err) {
      return callback(err);
    }

    if (response.statusCode != 200) {
      return callback({code: "PUSH_ERROR", data: body});
    }

    return callback(null);
  });
}

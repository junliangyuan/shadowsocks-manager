const app = require('../index').app;

app.filter('timeago', function() {
  return function(input) {

    let ret = '';
    let retTail = '';

    let time = Date.now() - (new Date(input));
    if (time < 0) {
      time = -time;
    } else {
      retTail = '前';
    }

    const day = Math.trunc(time / (24 * 3600 * 1000));
    const hour = Math.trunc(time % (24 * 3600 * 1000) / (3600 * 1000));
    const minute = Math.trunc(time % (24 * 3600 * 1000) % (3600 * 1000) / (60 * 1000));
    if (day) {
      ret += day + '天';
    }
    if (day || hour) {
      ret += hour + '小时';
    }
    if (!day && (hour || minute)) {
      ret += minute + '分钟';
    }
    if (time < (60 * 1000)) {
      ret = '几秒';
    }

    return ret + retTail;
  };
});

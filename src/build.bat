:: Not minifying yet; change that later

python py/build.py xch.user.js ../builds/full/xch.meta.js -meta
python py/build.py xch.user.js ../builds/main/xch.meta.js -min_off -meta

python py/build.py xch.user.js ../builds/full/xch.user.js
python py/build.py xch.user.js ../builds/main/xch.user.js -min_off

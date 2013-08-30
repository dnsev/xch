If you are submitting a bug report, please include the following:

1. What the problem is

2. What browser (Firefox/Chrome/etc.) and userscript manager (Greasemonkey, Scriptish, Tampermonkey, Chrome Native) you're using

3. Check to see if anything appeared in the error console: (a screencap or copy-paste should do)
  * Firefox: [CTRL + SHIFT + K](http://dnsev.github.io/xch/images/firefox_error_console.png) → "Console" tab
  * Chrome: [CTRL + SHIFT + J](http://dnsev.github.io/xch/images/chrome_error_console.png) → "Console" tab

4. If the userscript seems to be doing <b>nothing</b>, check the following:
  * Firefox: [CTRL + SHIFT + K](http://dnsev.github.io/xch/images/firefox_inspector.png) → "Inspector" tab
  * Chrome: [CTRL + SHIFT + J](http://dnsev.github.io/xch/images/chrome_inspector.png) → "Elements" tab<br />

  Check to see if the ```<html>``` tag has something like ```addons="xch"``` in it. Be sure to mention if it doesn't.

5. If the userscript was working, but broke, also try including an info-dump by following the menus in the top right:
  "xch" → "Debug Info" → Copy what appears in the textbox
  Also it might be good to format it by putting it inside of the following:
  <pre><code>&#96;&#96;&#96;javascript
  (put stuff here)
  &#96;&#96;&#96;  </code></pre>

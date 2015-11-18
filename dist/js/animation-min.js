define(["jquery","underscore","promise"],function(a,b,c){function d(){this.builtinCommands={}}function e(){var c,d=this,e=[];d.register("on",function(a){var b=a.param,d=a.node,f=a.done,g=a.index;m.indexOf(b)>-1&&d.on(b,function(){clearTimeout(c),console.log(e),e.forEach(function(a,b){d.removeClass(a)}),e=[],f(g)})}),d.register("emit",function(a){var b=a.param,c=(a.node,a.done);n[b].done(),c()}),d.register("class",function(a){function b(a){i||(i=!0,"2"!==k&&(d.removeClass(j),e.splice(e.indexOf(j),1)),f())}var c=a.param,d=a.node,f=a.done,i=!1,j=c.split(",")[0],k=c.split(",")[1];d.addClass(j),e.push(j),d.off(h+".bxAnimation"),d.off(g+".bxAnimation"),"3"===k?f():(d.on(h+".bxAnimation",b),d.on(g+".bxAnimation",b))}),d.register("wait",function(a){var b=(a.node,a.param),d=a.done;c=setTimeout(function(){d()},b)}),d.register("style",function(c){function d(a){l||(l=!0,"2"!==e&&b.each(k,function(a,b){f.css(a.name,"")}),i())}var e,f=c.node,i=c.done,j=c.param.split(","),k=[],l=!1;/\s+/.test(a.trim(j[j.length-1]))||(e=a.trim(j.pop())),b.each(j,function(b,c){b=a.trim(b);var d=b.split(/\s+/);k.push({name:d.shift(),value:d.join(" ")})}),b.each(k,function(a,b){f.css(a.name,a.value)}),f.off(h+".bxAnimation"),f.off(g+".bxAnimation"),"3"===e?i():(f.on(g+".bxAnimation",d),f.on(h+".bxAnimation",d))})}function f(b){function c(c,e){var f=a.trim(c),g=a.trim(f.split(":")[0]),h=a.trim(f.split(":")[1]),i={command:g,node:b,index:e,param:h,done:function(a){var b=a||e;d(++b)}};return i}function d(a){if(a>f.length-1)return void(a=0);var b=c(f[a],a),d=e.builtinCommands[b.command];if(!d)throw b.command+" 该命令未定义";setTimeout(function(){d(b,{})},0)}var e=this,f=b.attr("bx-animation").split(";");""===a.trim(f[f.length-1])&&f.pop(),f.forEach(function(a,b){var d=c(a,b);"on"===d.command&&-1===m.indexOf(d.param)&&(n[d.param]=d)}),d(0)}var g="transitionend",h="animationend",i="transition",j="animation";"ontransitionend"in window||("onwebkittransitionend"in window?(g+=" webkitTransitionEnd",i="webkitTransition"):("onotransitionend"in dom.tNode||"Opera"===navigator.appName)&&(g+=" oTransitionEnd",i="oTransition")),"onanimationend"in window||("onwebkitanimationend"in window?(h+=" webkitAnimationEnd",j="webkitAnimation"):"onoanimationend"in dom.tNode&&(h+=" oAnimationEnd",j="oAnimation"));var k,l=document.createElement("div"),m=[];for(k in l)/^on/.test(k)&&m.push(k.slice(2));var n={};return d.prototype={boot:function(){var c=this;e.call(c);var d=a("[bx-animation]");b.each(d,function(b,d){f.call(c,a(b))})},register:function(a,b){this.builtinCommands[a]=b}},d});
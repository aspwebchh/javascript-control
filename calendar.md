# JavaScript日历控件开发

# 概述

在开篇之前，先附上日历的代码地址和演示地址，代码是本文要分析的代码，演示效果是本文要实现的效果
代码地址：[https://github.com/aspwebchh/javascript-control/tree/master/calendar](https://github.com/aspwebchh/javascript-control/tree/master/calendar)
演示地址： [https://www.chhblog.com/html/demo/calendar.html](https://www.chhblog.com/html/demo/calendar.html)

本文的目的除了详细说明开发一款具备基本功能的网页日历的方法与细节以外，还附加说明了如何合理的组织日历特效的代码和因此带来的好处。

按照本文的教程开发出来的效果如下



![1.png | center | 332x296](https://cdn.yuque.com/yuque/0/2018/png/127662/1527002512649-c58d99aa-40e8-4ed9-8fc9-b0447b303a76.png "")


他具有选择年月日、选择今天、清空文本框这些日历的基本功能，能满足日常项目中出现的普通日期选择需求， 算的上是五脏俱全的小麻雀。 

本文主要描述JavaScript实现的细节，日历的CSS布局细节将被省略，有兴趣的同学可阅读calendar.css中的css代码获知实现方法。 

此日历特效由原生JavaScript代码写成，并不依赖jQuery等第三方框架。它的JavaScript代码由三个文件构成

#### common.js
公用函数库文件， 里面的函数都是通用型的，并不仅仅和特效相关，在任何网页特效中都可以使用它们

#### calendar\_core.js
一个纯粹的、通用的日历特效的所有代码，更任何其它页面元素没有关系，比如说用来放置日期的文本框

#### calendar.js
合理调用calendar\_core.js中的代码来构建一个真正可以使用的日历特效。 

关于calendar\_core.js和calendar.js的说明，似乎有点令人犯迷糊，不过这不要紧，通过下面的详细讲解，会使读者了解到这两个文件中代码作用与区别。 

# 代码规约

因为JavaScript在一些常规的编程概念上没有统一的实现方法的缘故，在介绍日历的核心实现逻辑之情，先介绍下代码中所有使用的容易分散读者注意力或者造成读者出现理解偏差的语法细节。 

### 防止全局变量污染名称空间

此案列的大部分代码会被这样一段代码包围起来

```javascript
(function(){
 //功能代码
})();
```

其实这么做的主要目的是为了让变量名称和函数的名称全局名称空间， 换句话说就是让用不到它的地方看不到它。

那为什么这个function要被一个括号括起来，而且在这个括号后面再加上一个括号。 括号的作用很简单，跟小学数学中所学的括号作用一样，是用来提升运算优先级的，比如说（1+2）\*3，其中（1+2）会被优先与乘法运算，返回的结果就是3。可JavaScript没有规定，括号中必须放置四则运算表达式，括号中也可以放别的东西，比如说函数。这么一说就好理解了

```javascript
(function(){
 //功能代码
})();
```

这段代码可一被分解为两步， 第一个括号的作用是返回括号中的函数，第二个括号的作用是调用第一个括号返回的函数，这跟下面这段代码是一个意思，只是合在一起可以省略函数名。 

```javascript
var func = (function(){
 //功能代码
});

func();
```

### 类的实现

非ES6的JavaScript语法不支持类，但是类是不可缺少的编程元素，所幸JavaScript可以通过function关键字模拟类的实现。

常规的模拟方法是使用function和function的它的prototype属性，可这么做无法实现面向对象中private关键字的效果，所以我在这个案列中并没有采用这种方法，而是使用了

```javascript
function Klass(){
     this.publicFunc1 = function(){}
     this.publicFunc2= funciton(){}
     var privateFunc1 = funciton(){}
     var privateFunc2 = function(){}
}

var klass = new Klass();
Klass.publicFunc1();
Klass.publicFunc2();
```

这种方式模拟类的实现。

# 实现细节

## 公用函数库 - common.js 

此文件中有4个函数

#### addEventHandler
为DOM对象绑定事件。因为要兼容低版本IE，所以特地封装成函数

#### removeEventHandler
移除DOM对象绑定的事件

#### getOffset
获得html元素在页面中的位置。使用场景如点击输入框弹出日历时将日历定位到文本框下方就要用到这个函数。

#### checkDate
检查日期字符串格式是否合法

这4个函数的代码在文中略去，有需要的读者可直接查看源代码

## 日历核心类 - calendar\_core.js

此文件包含日历特效的核心功能，其中有一个函数和一个类。

### 函数 newCalendarID 

函数代码如下

```javascript
var instanceCount = 0;

function newCalendarID(){
    return 'calender_' + ( ++instanceCount );
}
```

这个函数的作用是生成代表日历DOM元素的ID。  很多时候， 一个页面上不会只有一个日历，如下图



![2.png | center | 356x538](https://cdn.yuque.com/yuque/0/2018/png/127662/1527003326173-02c3a520-0968-42f4-b225-16070ea0626d.png "")


所以必须要一个不重复的值作为不同日历HTML元素的ID，以防止JavaScript操作日历html元素时造成冲突。 newCalendarID通过自增一个数值变量并结合一个字符串来生成日历的ID，生成的ID格式如下

calender\_1
calender\_2
calender\_3
calender\_4

这个函数在日历的构造函数中被调用，每次实例化一个日历时为日历html元素赋予一个ID。

### 类 Calender

类 Calender 封装了实现日历功能的代码，包括生成日历、年份月份切换、 选择清空日期等等。 

Calender 类的公共接口如下

```javascript
function Calender() {
	//事件
	this.onClear = function() {};
	this.onSetToday = function() {};
	this.onSelected = function( y, m, d ) {};
	
	//方法
	this.render = function( placeholder ) {}
	this.setDate = function( y, m, d ) {}
	this.position = function( left, top ) {}
	this.hide = function() {}
	this.contains = function( target ) {}
} 
```

我们通过从外到内的模式讲解日历类的实现，先讲解日历的接口，再讲解代码的细节。 

首先，有有点读者要明白，Calender类表示的就是日历，是那个在网页上实现日期选择功能的日历特效。 

当实例化Calender对象并调用对象的render方法，一个日历就被显示在网页上了。 代码如下 

```javascript
var c = new Calender();
c.render();
```

render方法就是用来生成日历特效的html元素，并将元素添加到页面上，执行后的效果如下图



![3.png | center | 826x364](https://cdn.yuque.com/yuque/0/2018/png/127662/1527003435989-987d430c-027e-4582-883c-f9cf140c247c.png "")


setDate  方法用来设置日历的日期 ，接受年月日三个参数。日历初始化时持有的日期是当前的日期，因此日历界面上当前日期的位置被设为选中状态。然而，有时候我们希望被选中的日期是任意的而非只能是今天，这个时候setDate方法就能派上用场。 

position 方法用来设置日历在页面上的位置，接受left、top两个参数。 比如说，当调用render方法初始化日历后，我们想让日历显示在页面中间，可以这样做

```javascript
 var c = new Calender();
 c.render();
 c.position(window.innerWidth / 2, window.innerHeight / 2)
```

代码执行效果如下图



![4.png | center | 826x427](https://cdn.yuque.com/yuque/0/2018/png/127662/1527003496633-6b056bc7-9a61-4e9d-a454-9f69cf908a13.png "")


hide方法用来隐藏日历，contains方法用来检查html元素是否包含在日历元素之中，这两个方法在接下来的功能实现剖析中有使用的场景。 

```javascript
this.onSelected = function( y, m, d ) {};
this.onClear = function() {};
this.onSetToday = function() {};
```

这三个方法其实并不是方法，而是事件，就像html元素的onclick事件一样，会在特定的时候被触发。

onSelected事件在选中日期时被触发
onClear事件在点击日历右下角的「清空」按钮时被触发
onSetToday事件在点击日历右下角的「今天」按钮时被触发

以一个最基本的最常见的日期选着并填充文本框为例，我们可以通过结合这三个事件和上面讲解的部分方法来实现， 代码如下

```javascript
//获得文本框元素
var dateInput = document.getElementById("date");
//实例化日历对象
var calender = new Calender();
//绑定onSelected事件，当选中日期后被执行
calender.onSelected = function(y,m,d) {
    //填充选中的日期至文本框
    dateInput.value = [y,m,d].join("-");
    //填充后隐藏日历
    this.hide();
}
 //绑定onSetToday事件，当点击今天按钮后被执行
calender.onSetToday = function() {
    var now = new Date();
    //填充当前日期至文本框
    dateInput.value = now.getFullYear() + '-' + ( now.getMonth() + 1 ) + '-' + now.getDate();
    //填充后隐藏日历
    this.hide();
}
 //绑定onClear事件，当点击清空按钮后被执行
calender.onClear = function() {
    //清空文本框
    dateInput.value = "";
    //填充后隐藏日历
    this.hide();
}
//初始化日历
calender.render();
//因为初始化后的日历会显示在页面上，所以需要事先隐藏
calender.hide();

//但文本框获得焦点时显示日历
dateInput.onfocus = function() {
    //获得文本框在页面中的位置，getOffset方法在之前讲解过
    let offet = getOffset(this);
    //让日历现实在文本框的下方
    calender.position(offet.left, offet.top + 20);
}
```

效果如图



![5.png | center | 619x480](https://cdn.yuque.com/yuque/0/2018/png/127662/1527003613452-28126b7b-0fb8-4690-bc47-603639c60dc1.png "")


不知道读者们有没有从这段代码中发现，日历特效本身和输入框之间是没有任何关联，它们之间的交互是通过那三个事件间接进行的，这正是软件工程中「低耦合」设计原则的体现。在日历和输入框之间有一个衔接层，这个衔接层就是那三个事件， 这三个事件是可以动态设置的， 假如需求改变，我们点击日历时不想将值填充到文本框，而是想直接将日期发送至服务器，那么我们只需要将onSelected事件中的代码改为发送数据的ajax请求代码即可， 日历类本身的代码完全不用改动， 这极大的降低的代码的维护成本。 

其实这中通过事件去解耦的代码设计方式随处可见，比如我们点击一个按钮弹出一个提示消息这样的效果

```javascript
var  btn = document.getElementById("btn");
btn.onclick = function() {
	alert("hello world");
}
```

如上面的代码，用的也是同样的思路，html按钮元素和其它JavaScript效果是没有联系的，然而它必然要和外部交互，比如点击的时候执行某个动作，否者就没有存在的意义了。如何做到既不与外部元素绑死又能与外部元素交互？答案就是增加一个衔接层，这个衔接层就是「事件」。我们的日历特效不正也是采用这种做法吗。 

如果了解设计模式的读者应该能看的出来，这其实是策略模式的应用，如果更贴切一点也可以说是观察者模式的应用。 

接下来我们再讲讲Calender类内部的构建。 

Calender类有6个私有的成员变量

```javascript
var calendarID = newCalendarID();
var self = this;
var calendarEl;
var selectedYear;
var selectedMonth;
var selectedDate;
```

calendarID ，日历html元素的ID， 调用newCalendarID方法生成， 关于此函数的细节在前文有过介绍。 

self，保存Calender的this指针，供程序上下文中有需要的地方使用，因为JavaScript中this指针不确定的原因，要在类中正确的使用this指针，必须在某个this值还指向类自身的地方将它保存下来，以供应后面的代码使用。 

calendarEl，日历html元素的根元素。日历是动态生成的html元素，此变量指向的就是日历html元素的DOM对象。 

selectedYear，日历选中日期的年份

selectedMonth，日历选中日期的月份

selectedDate，日历选中日期的天

Calender类中除了有这六个私有变量以外，还有一系列私有方法

getStartDate
getEndDate
getContentItemHtml
getContentHtml
getCalendarHtml
getElement
genCalanderElementID
monthChangeAction
yearChangeAction
initCalendar
refreshCalender

这些方法不是Calender类对外公布接口的一部分，但是他们参与了实现日历的功能。 在这里我们不一个一个的介绍方法的作用，我们根据日历初始化代码的执行顺序来介绍他们，轮到谁就介绍谁。 

日历类被实例化后render方法首先被调用。

```javascript
var calender = new Calender();
calender .render();
```

newCalender()实例化的过程很简单，无非就是声明和初始化部分成员变量的值，真正的大戏是render方法被调用。

```javascript
this.render = function( placeholder ) {
       var now = new Date();
       selectedYear = now.getFullYear();
       selectedMonth = now.getMonth();
       selectedDate = now.getDate();
       initCalendar( selectedYear, selectedMonth, selectedDate, placeholder );
}
```

rander方法接受一个placeholder参数，这个参数是一个html元素的ID，表示日历初始化后所在的位置，也就是说当表示日历的html元素生成后，会成为ID为这个参数的值的元素的子元素，假如调用render方法时不指定这个参数， 那么日历html成为body子元素。 

接着，render方法会将类的三个表示选中的年月日的成员变量设置为当前的年月日，然后在调用私有方法initCalendar初始化日历， initCalendar承载着生成日历的主要工作。 

```javascript
var initCalendar = function( placeholder ) {
    calendarEl = document.createElement( 'div' );
    calendarEl.id = calendarID;
    calendarEl.className = 'aspwebchh';
    calendarEl.innerHTML = getCalendarHtml();
    
    placeholder = placeholder ? document.getElementById( placeholder ) : document.body;
    placeholder.appendChild( calendarEl );

    refreshCalender(selectedYear, selectedMonth, selectedDate);

    monthChangeAction();
    yearChangeAction();
    dateSelectedChangeAction();
}
```

我们知道 calendarEl 成员变量表示日历的html元素，在initCalendar方法中，它被初始化了。 从代码中可一看出，它是一个div元素，被设置一个唯一id，被设置一个class， 日历的html结构由 getCalendarHtml 方法生成， 并被设为 id 为placeholder的值的子元素，如果id为placeholder的元素不存在，那么由body元素代替它。 

现在，我们来重点看看 getCalendarHtml 这个方法，日历的html结构是由它动态生成的。 

```javascript
var getCalendarHtml = function() {
    var html =  '    <div class="calendar_tool" id="'+ genCalanderElementID("tool") +'">'+
                '        <div class="calendar_month">'+
                '            <select id="'+ genCalanderElementID("month_select") +'"><option value="0">1月</option>'+
                '                <option value="1">2月</option>'+
                '                <option value="2">3月</option>'+
                '                <option value="3">4月</option>'+
                '                <option value="4">5月</option>'+
                '                <option value="5">6月</option>'+
                '                <option value="6">7月</option>'+
                '                <option value="7">8月</option>'+
                '                <option value="8">9月</option>'+
                '                <option value="9">10月</option>'+
                '                <option value="10">11月</option>'+
                '                <option value="11">12月</option></select>'+
                '        </div>'+
                '        <div class="calendar_year">'+
                '            <input type="button" value="&lt;" class="calendar_year_left" id="'+ genCalanderElementID("year_prev") +'"><input'+
                '                type="text" class="calendar_year_input" id="'+ genCalanderElementID("year_input") +'"><input type="button"'+
                '                value="&gt;" class="calendar_year_right" id="'+ genCalanderElementID("year_next") +'">'+
                '        </div>'+
                '    </div>'; 

    html += '<div class="calendar_content" id="'+ genCalanderElementID("date_list") +'"></div>';

    html += '<div class="calendar_action">' +
                '<input type="button" value="清空" id="'+ genCalanderElementID("clear") +'">' +
                '<input type="button" value="今天" id="'+ genCalanderElementID("today") +'">'+
            '</div>';

    return '<div class="calendar_body">' +  html + '</div>';
}

```

由代码可以看出，getCalendarHtml 方法就是通过动态拼接JavaScript字符串生成日历的html的。在此方法中， 还是一个 genCalanderElementID  方法被频繁的调用，这个方法的代码如下

```javascript
var genCalanderElementID = function( id ) {
    return calendarID + "_" + id;
}
```

他的作用就是用来生成日历的一些子元素的ID， 当然，生成的ID全局唯一的， 因为它的前缀就是标识日历唯一性的calendarID。



![6.png | center | 503x310](https://cdn.yuque.com/yuque/0/2018/png/127662/1527003866320-68092177-2ebb-48de-a46f-3c1c27e1d721.png "")


标红的就是用这个方法生成的ID 

这个时候生成的日历html元素还并不完整，日期部分处于缺失状态， 如下图



![7.png | center | 156x188](https://cdn.yuque.com/yuque/0/2018/png/127662/1527003891819-6438a50c-4744-4d80-8eba-244676141272.png "")


我们再回到处于调用栈上一层的initCalendar方法中来，当日历的外围html结构生成完毕以后，接着会调用 refreshCalender 方法。 

refreshCalender方法的作用是刷新日历的界面， 它接受年月日三个参数， 根据这三个参数来更新日历的界面。 



![8.png | center | 159x188](https://cdn.yuque.com/yuque/0/2018/png/127662/1527003929639-8970962a-b0aa-44db-98a9-65fce9944b43.png "")




![9.png | center | 158x188](https://cdn.yuque.com/yuque/0/2018/png/127662/1527003936467-fadffefb-0ed7-4cfa-98a8-f2ce8313db9b.png "")


上面两长图片是分别给refreshCalender传递2018,5,16和2018,6,13两组参数的执行结果，可以看出，此方法是整个日历特效的核心方法，日历界面的更新变化都要靠它。 

refreshCalender方法做三件事请。 

1. 设置日历界面上年份输入框的值。
2. 设置日历界面上月份选择框的值。 
3. 生成日历界面日期部分的html。这一步是最重要的一步，通过调用 getContentHtml 来完成。

getContentHtml  方法接受年和月两个参数，生成整一个月份的html



![10.png | center | 141x149](https://cdn.yuque.com/yuque/0/2018/png/127662/1527003995984-ac2940d9-49bc-4028-9cdf-1c51cf3a46b0.png "")


上图就是 getContentHtml  方法生成的内容。 方法的开头有这样两行代码用来获得日期范围。 

```javascript
var startDate = getStartDate( y, m );
var endDate = getEndDate( y, m ); 
```

这个日期范围是必须的。日历效果的一个特点是要做到星期和日期对应，望一眼日期就能知道是星期几。此外，日历界面还要保持工整， 因此， 我们必须要知道日历的第一周的开始时间是几号，日历的最后一周结束日期是几号， 要知道为保持日历界面的工整，每一页日历展示的日期都是需要跨月的，上面的两行代码就是获得每一页日历的开始日期和结束日期的。 



![11.png | center | 159x188](https://cdn.yuque.com/yuque/0/2018/png/127662/1527004030190-f6c88992-8448-466d-b12c-fd5d628a575d.png "")


以上图为例，一个5月份的日历，那么这一页的开始日期是4月29日，周日；结束日期是6月5日，周二。 

之后的代码就是根据这个时间范围生成html，并通过判断日期给每个日期元素加上对应的css class属性， 因为我们要让非本月份的日期显示成灰色， 本月份的日期显示成蓝色，当前日期拥有蓝色背景。具体的实现细节可以通过阅读下面的代码清单获知，在这里就不赘述了。 

```javascript
var getStartDate = function( y, m ) {
    var dt = new Date( y, m, 1 );
    var week = dt.getDay();
    dt.setDate( dt.getDate() - week );
    return dt;
}
        
var getEndDate = function( y, m ) {
    var dt = new Date( y, m ,1 );
    dt.setMonth( dt.getMonth() + 1 );
    dt.setDate( 0 );
    return dt;
}

var getContentItemHtml = function( date, currMonth ) {
    var content = '';
    if( date.getDate() == selectedDate && date.getMonth() == selectedMonth && date.getFullYear() == selectedYear ) {
        content += '<li class="selected">';
    } else if( currMonth == date.getMonth() ) {
        content += '<li class="c">'
    } else {
        content += '<li>';
    }
    content += '<a href="javascript:;">' + date.getDate() +'</a>';
    content += '</li>';
    return content;
}

		var getContentHtml = function( y, m ) {
    var startDate = getStartDate( y, m );
    var endDate = getEndDate( y, m );
    var title = '<dl class="calendar_title"><dd>日</dd><dd>一</dd><dd>二</dd><dd>三</dd><dd>四</dd><dd>五</dd><dd>六</dd></dl>';
    
    var content = '<ul>';
			for( var i = 0; i < 38; i++ ) {
        content += getContentItemHtml(startDate, m);
        if( ( i + 1 ) % 7 == 0 ) {
            content += '</ul><ul>';
        }
        startDate.setDate( startDate.getDate() + 1 );
    }
    content += '</ul>';
    return title + content;
		}

```

让我们再回到 initCalendar 方法中来，调用  refreshCalender 方法后， 接下是

```javascript
monthChangeAction();
yearChangeAction();
dateSelectedChangeAction();
```

这三个方法的调用。

这三个方法的作用是给日历中的元素绑定操作效果事件的。 

monthChangeAction方法用于当日历的月份选择的值改变时刷新日历的日期部分内容

```javascript
var monthChangeAction = function() {
    var monthSelect = getElement( 'month_select' );
    var yearInput = getElement( 'year_input' );
    
    addEventHandler( monthSelect, 'change', function() {
        var month = this.value;
        var year = yearInput.value;
        getElement( 'date_list' ).innerHTML = getContentHtml( year, month );
    } );
}
```

yearChangeAction方法用于当日历的年份改变时刷新日历的日期面板

```javascript
var yearChangeAction = function() {
var monthSelect = getElement( 'month_select' );
var yearInput = getElement( 'year_input' );
var yearPrev = getElement( 'year_prev' );
var yearNext = getElement( 'year_next' );

addEventHandler( yearInput, 'blur', function() {
    if( /[^\d]+/.test( this.value ) ) {
        this.value = this.value.replace( /[^\d]+/g, '' );
    } 
    getElement( 'date_list' ).innerHTML = getContentHtml( yearInput.value, monthSelect.value ); 
} );

addEventHandler( yearPrev, 'click', function() {
    var year = yearInput.value;
    var month = monthSelect.value;
    getElement( 'date_list' ).innerHTML = getContentHtml( --year, month ); 
    yearInput.value = year;
} );

addEventHandler( yearNext, 'click', function() {
    var year = yearInput.value;
    var month = monthSelect.value;
    getElement( 'date_list' ).innerHTML = getContentHtml( ++year, month ); 
        yearInput.value = year;
    } );           
}
```

yearChangeAction相对monthChangeAction较为复杂，因为它不但要处理年份输入框的事件， 还要处理“上一年”和 “下一年”两个按钮的的事件处理。

dateSelectedChangeAction用于处理日期选择事件、“清空”按钮事件、“今天”按钮事件， 从方法的代码结构中就可以看出方法的功能由这三部分构成。 

```javascript
var dateSelectedChangeAction = function() {
    //日期选中处理
    addEventHandler( getElement( 'date_list' ), 'click', function( e ) {
        e = e || window.event;
        var t = e.target || e.srcElement;
        if( t.tagName != 'A' ) {
            return;
        }

        var year = getElement( 'year_input' ).value;
        var month = getElement( 'month_select' ).value;
        var date = t.innerHTML;

        if( typeof( self.onSelected ) == 'function' ) {
            self.onSelected( parseInt( year ), parseInt( month ), parseInt( date ) );
        }
    } );

	     //“清空”按钮点击处理
    addEventHandler( getElement( 'clear' ), 'click', function() {
        if( typeof( self.onClear ) == 'function' ) {
            self.onClear();
        }
    } );

	    //“今天”按钮点击处理
    addEventHandler( getElement( 'today' ), 'click', function() {
        if( typeof( self.onSetToday ) == 'function' ) {
            self.onSetToday();
        }
    } ); 
}
```

这三部分事件处理代码其实本身不执行具体的功能， 它们的真正作用是触发另一个事件。具体一点说，这个方法做了这么三件事情

* 当选择日历的具体日期时，Calender类实例的onSelected事件被触发
* 当点击日历的“清空”按钮的时，Calender类实例的onClear事件被触发
* 当点击日历的“今天”按钮时，Calender类实例的onSetToday事件被触发

这三个事件我们在前面讲过是用于解除日历本身与使用日历的页面的耦合的，如此能使日历更加通用化。

至此calendar\_core.js中的Calender类的内部结构已经解析完毕，一款功能完善的日历特效呈现在了我们面前

```javascript
window.Calender = Calender;
```

通过这行代码导出日历类，我们就可以在外部使用它了。 

接下来我们说说如何去使用它。

## 使用日历核心类 - calendar.js

通常，日历特效的使用都会伴随着输入框，如下图所示



![12.png | center | 300x229](https://cdn.yuque.com/yuque/0/2018/png/127662/1527004276811-e0f93e5c-29bd-4b7c-8171-5b05c5901b29.png "")


当日历上的日期被选中时，着个日期会别填充到输入框里。 同时，这个日历是但实例的，不管页面上有多少个输入框需要输入日期，同一时刻，页面上只能有一个日历， 一个日历服务与多个不同的文本框。 

calendar.js文件中的代码示例就是以此模式实现。

```javascript
(function(){
    var single;
    var element;

    function closeHandler( e ) {
        e = e || window.event;
        var t = e.target || e.srcElement;
        if( single.contains( t ) ) {
            return;
        }
        if( t == element ) {
            return;
        }
        single.hide();
    }
    

    function checkElementValue() {
        if( !element.checkDateAction ) {
            addEventHandler( element, 'blur', function() {
                if( this.value != '' && this.value != undefined && !checkDate( this.value ) ) {
                    alert( '日期格式不正确' );
                    this.value = '';
                }
            } );
            element.checkDateAction = true;
        }
    }

    function renderCalendar() {
        if( !single ) {
            single = new Calender();
            single.onSelected = function( y, m, d ) {
                var datestr = y + '-' + ( m + 1 )  + '-' + d;
                element.value = datestr;
                this.hide();
            }
            single.onSetToday = function() {
                var now = new Date();
                element.value = now.getFullYear() + '-' + ( now.getMonth() + 1 ) + '-' + now.getDate();
                this.hide();
            }
            single.onClear = function() {
                element.value = '';
                this.hide();
            }
            single.render();
        }
        var offset = getOffset( element );
        single.position( offset.left, offset.top + element.offsetHeight );
    }

    function initCalendarSelectedValue() {
        var date = element.value;
        if( checkDate( date ) ) {
            var date    = date.replace(/\-|\/|\./g,"/");
            var ymd    = date.split("/");
            var y    = parseInt(ymd[0]);
            var m    = parseInt(ymd[1]) - 1;
            var d    = parseInt(ymd[2]);
            single.setDate( y, m, d );
        }
    }

    function calendar() {
        var e = calendar.caller.arguments[0] || window.event;
        element = e.target || e.srcElement; 
       
        removeEventHandler( document.documentElement, 'click', closeHandler );
        checkElementValue();
        renderCalendar();
        initCalendarSelectedValue();
        addEventHandler( document.documentElement, 'click', closeHandler );
    }

    window.calendar = calendar;
})();
```

calendar.js中有2个全局变量和5个函数

```javascript
var single;
var element;
```

```javascript
closeHandler()
checkElementValue()
renderCalendar(element)
initCalendarSelectedValue()
calendar()
```

变量single是日历的实例，它只被初始化一次，可以把它看成一个单列。 

变量element是调用日历的输入框，它会在calendar函数调用时被重复赋值，引用当前input输入框的DOM对象。 

calendar是主函数，唯一一个被导出到页面使用的函数，其它的函数是calendar函数功能的部分，为了使代码易于维护才将他们提炼成为函数。 

我们看到，其它4个函数都会在calendar函数中的某个位置出现

closeHandler 是一个工具函数， 用于实现点击页面上除日历本身以外的任何位置便隐藏日历的效果的。

checkElementValue 用于检查文本框中默认有值的情况下值的格式是否正确，假如不正确则给予提示。

renderCalendar用于实例化日历，并设置相应的事件，被初始化的实例是唯一的， 与此同时， 日历将被显示在输入框的下方。 

initCalendarSelectedValue用于将输入框中的默认值设置为日历的当前日期。

最后， calendar函数被导出

```javascript
window.calendar = calendar;
```

在页面中使用即可，使用方式很简洁

```html
<input type="text" onfocus="calendar()" id="begin_time" />
```

触发输入框的focus事件即能使用日历。 

至此，一款完整的日历的所有细节展现在了我们面前。这款日历功能很简单， 可它有一个优点，它的代码结构清晰，类和函数之间，方法与方法之间，职责异常清晰。 日历本身与页面之间是解耦的，互相之间通过事件进行通信， 这使得日历的代码复用能力变强了，如果我们哪天想把这个日历挪作他用， 只需要提取出calendar\_core.js中的代码，稍微改动即可，至于calender.js中的代码完全可以忽视。这是高内聚低耦合软件设计思想的体现，以被业界证明是有效的提升代码可维护性的思想，除了日历，也适合在任何程序设计环境中使用。所以， 这篇文章与其说是在讲解日历特效的编写，还不如说是在讲解如何设计出结构优良的代码的方法，从某种角度来讲，这比写出炫丽的JavaScript特效更加有用。

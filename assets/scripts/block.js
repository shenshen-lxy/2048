require('colors');
const colorNum = ["0","2","4","8","16","32","64","128","256","512","1024","2048"];
cc.Class({
    extends: cc.Component,

    properties: {
        numberLabel : cc.Label
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    setNumber(number){

        if(number == 0){
            this.numberLabel.node.active = false;//如果为数字0，则隐藏
        }
        
        this.numberLabel.string = number;

        let str_number = number.toString();//为了看是否在colorNum[]中
        let contain = colorNum.indexOf(str_number);//indexof()用于字符串比较
        let flag = (contain>-1) ? true : false;
       
        if(flag){ //键在colors里面(保证代码健壮性)
            this.node.color = colors[number];
        }
    }

    // update (dt) {},
});

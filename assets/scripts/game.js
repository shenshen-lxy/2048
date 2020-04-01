const Rows = 4;
const Numbers = [2,4];
const MIN_LENGTH = 50;
const MOVE_DURATION = 0.1;


cc.Class({
    extends: cc.Component,

    properties: {
       scoreLabel: cc.Label,
       score: {
           default:0,
       },
       blockPrefab: cc.Prefab,
       gap: 20,
       bg : cc.Node,
       gameover : cc.Node,
    },

    start () {
        this.drawBgBlocks();
        this.init();
        this.addEventHandler();
    },

    drawBgBlocks(){
        this.blockSize = (cc.winSize.width - this.gap * (Rows+1)) / (Rows); //动态计算方块大小
        let x = this.gap + this.blockSize/2;//坐标x
        let y = x;//坐标y
       
        this.positions = [];//用来记录每个方块的位置坐标
        for(let i=0;i<Rows;i++){
            this.positions.push([0,0,0,0]);//定义positions为二维数组
            for(let j=0;j<Rows;j++){
                let block = cc.instantiate(this.blockPrefab); //实例化资源
                block.width = this.blockSize;//赋予block长
                block.height = this.blockSize;//赋予block高
                this.bg.addChild(block); //添加到父组件
                block.setPosition(cc.v2(x,y));//设置位置
                this.positions[i][j]=cc.v2(x,y);//把位置记录到数组中
        
                x += this.gap + this.blockSize;

                block.getComponent("block").setNumber(0);//获取到block组件下的block脚本，调用函数
            }
            y += this.gap + this.blockSize;
            x = this.gap + this.blockSize/2;
        }
    },
        
    init(){
        this.gameover.active = false;
        this.updateScore(0);

        /*
            把有数字的块销毁
        */
        if(this.blocks){
            for(let i=0;i<Rows;i++){
                for(let j=0;j<Rows;j++){
                    if(this.blocks[i][j] != null){
                        this.blocks[i][j].destroy();
                    }
                }
            }
        }

        /*
            blocks[]数组：存放有数字的块
            data[]数组：存放数字(没有数字的用0代替)
        */
        this.blocks = [];
        this.data = [];
        for(let i=0;i<Rows;i++){
            this.blocks.push([null,null,null,null]);
            this.data.push([0,0,0,0]);
        }
      

        this.addBlock();
        this.addBlock();
        this.addBlock();

    },

    updateScore(number){
        this.score = number;
        this.scoreLabel.string = "分数："+this.score;
    },

    addBlock(){
        let locations = this.getEmptyLocation();
        if(locations.length == 0) return false; //块已满，不能添加新块
        let random = Math.random()*locations.length;
        let floor_random = Math.floor(random);
        let map = locations[floor_random];
        let x = map.x;
        let y = map.y;

        this.blocks[x][y] = cc.instantiate(this.blockPrefab); //实例化资源
        this.blocks[x][y].width = this.blockSize;//赋予block长
        this.blocks[x][y].height = this.blockSize;//赋予block高
        this.bg.addChild(this.blocks[x][y]); //添加到父组件
        this.blocks[x][y].setPosition(cc.v2(this.positions[x][y]));//设置位置

        random = Math.random()*Numbers.length;
        floor_random = Math.floor(random);
        let value = Numbers[floor_random];
        this.blocks[x][y].getComponent("block").setNumber(value);//颜色+数字
        this.data[x][y] = value;

        return true;
 
    },

    getEmptyLocation(){
        let locations = [];
        let num = 0;
        for(let i=0;i<Rows;i++){
            for(let j=0;j<Rows;j++){
                if(this.blocks[i][j] == null ){
                    locations[num]=({x:i,y:j});
                    num++;
                }
            }
        }
        return locations;
    },

    addEventHandler(){
        this.bg.on("touchstart",(event)=>{
            this.startPos = event.getLocation();
        });
        this.bg.on("touchend",(event)=>{         
            this.touchEnd(event);
        });
        this.bg.on("touchcancel",(event)=>{
            this.touchEnd(event);
        });
    },

    touchEnd(event){

        this.endPos = event.getLocation();
        let vec = this.endPos.sub(this.startPos);
        
        if(vec.mag() > MIN_LENGTH){ //如果滑动超过一定距离才会进行响应
            if(Math.abs(vec.x)>Math.abs(vec.y)){ //横向
                if(vec.x>0) this.moveRight();
                else this.moveLeft();
            }
            else{ //纵向
                if(vec.y>0) this.moveUp();
                else this.moveDown();
            }
        }
    },

    shift(block,position,callback){ //块位移
        let action = cc.moveTo(MOVE_DURATION,position);
        let finish = cc.callFunc(()=>{
            callback && callback(); //调用callback，前面只是定义！！
        })

        block.runAction(cc.sequence(action,finish));
    },

    moveRight(){
        console.log("moveRight");

        let hasMove = false;//是否新增新块

        let move = (x,y,callback) =>{

            if(y == (Rows-1)){ //在最右边 且不生成新块
                callback && callback();//if(callback) callback();如果callback存在
            }else if(this.data[x][y+1] == 0){ //可移动到空位置

                hasMove = true;

                let block = this.blocks[x][y];
                let position = this.positions[x][y+1];
                this.blocks[x][y+1] = block;
                this.blocks[x][y] = null;
                this.data[x][y+1] = this.data[x][y];
                this.data[x][y] = 0;

                this.shift(block,position,() =>{
                    move(x,y+1,callback);//递归
                })

            }else if(this.data[x][y] == this.data[x][y+1]) { //数值相同，则合并

                hasMove = true;

                let block = this.blocks[x][y];
                let position = this.positions[x][y+1];//shift还要用到
                this.data[x][y+1] *= 2;
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.blocks[x][y+1].getComponent("block").setNumber(this.data[x][y+1]);

                this.shift(block,position,() =>{
                    block.destroy();//递归结束
                    callback && callback();//afterMove
                })

            }else{ //数值不同，则递归结束
                callback && callback();
            }

        };

        let toMove = []; //非空的块可移动
        for(let i=0;i<Rows;i++){
            for(let j=0;j<Rows;j++){
                if(this.data[i][j] != 0 ){
                    toMove.push({x:i,y:j});
                }
            }
        }

        let count = 0;//用来计数，达到toMove.length则进入afterMove()
        for(let i=(toMove.length-1);i>=0;i--){ //从右往左move
            move(toMove[i].x,toMove[i].y,()=>{
                count++;
                if(count == toMove.length) this.afterMove(hasMove);
            })
        }
    },
    moveLeft(){
        console.log("moveLeft");

        let hasMove = false;//是否新增新块

        let move = (x,y,callback) =>{

            if(y == 0){ //在最左边 且不生成新块
                callback && callback();//if(callback) callback();如果callback存在
            }else if(this.data[x][y-1] == 0){ //可移动到空位置

                hasMove = true;

                let block = this.blocks[x][y];
                let position = this.positions[x][y-1];
                this.blocks[x][y-1] = block;
                this.blocks[x][y] = null;
                this.data[x][y-1] = this.data[x][y];
                this.data[x][y] = 0;

                this.shift(block,position,() =>{
                    move(x,y-1,callback);//递归
                })

            }else if(this.data[x][y] == this.data[x][y-1]) { //数值相同，则合并

                hasMove = true;

                let block = this.blocks[x][y];
                let position = this.positions[x][y-1];//shift还要用到
                this.data[x][y-1] *= 2;
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.blocks[x][y-1].getComponent("block").setNumber(this.data[x][y-1]);

                this.shift(block,position,() =>{
                    block.destroy();//递归结束
                    callback && callback();//afterMove
                })

            }else{ //数值不同，则递归结束
                callback && callback();
            }

        };

        let toMove = []; //非空的块可移动
        for(let i=0;i<Rows;i++){
            for(let j=0;j<Rows;j++){
                if(this.data[i][j] != 0 ){
                    toMove.push({x:i,y:j});
                }
            }
        }

        let count = 0;//用来计数，达到toMove.length则进入afterMove()
        for(let i=0;i<toMove.length;i++){
            move(toMove[i].x,toMove[i].y,()=>{
                count++;
                if(count == toMove.length) this.afterMove(hasMove);
            })
        }
    },
    moveUp(){
        console.log("moveUp");

        let hasMove = false;

        let move = (x,y,callback) =>{

            if(x == (Rows-1)){ //在最上边 且不生成新块
                callback && callback();//if(callback) callback();如果callback存在
            }else if(this.data[x+1][y] == 0){ //可移动到空位置

                hasMove = true;

                let block = this.blocks[x][y];
                let position = this.positions[x+1][y];
                this.blocks[x+1][y] = block;
                this.blocks[x][y] = null;
                this.data[x+1][y] = this.data[x][y];
                this.data[x][y] = 0;

                this.shift(block,position,() =>{
                    move(x+1,y,callback);//递归
                })

            }else if(this.data[x][y] == this.data[x+1][y]) { //数值相同，则合并

                hasMove = true;

                let block = this.blocks[x][y];
                let position = this.positions[x+1][y];//shift还要用到
                this.data[x+1][y] *= 2;
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.blocks[x+1][y].getComponent("block").setNumber(this.data[x+1][y]);

                this.shift(block,position,() =>{
                    block.destroy();//递归结束
                    callback && callback();//afterMove
                })

            }else{ //数值不同，则递归结束
                callback && callback();
            }

        };

        let toMove = []; //非空的块可移动
        for(let i=0;i<Rows;i++){
            for(let j=0;j<Rows;j++){
                if(this.data[i][j] != 0 ){
                    toMove.push({x:i,y:j});
                }
            }
        }

        let count = 0;//用来计数，达到toMove.length则进入afterMove()
        for(let i=(toMove.length-1);i>=0;i--){ //从上往下move
            move(toMove[i].x,toMove[i].y,()=>{
                count++;
                if(count == toMove.length) this.afterMove(hasMove);
            })
        }
    },
    moveDown(){
        console.log("moveDown");

        let hasMove = false;

        let move = (x,y,callback) =>{

            if(x == 0){ //在最下边 且不生成新块
                callback && callback();//if(callback) callback();如果callback存在
            }else if(this.data[x-1][y] == 0){ //可移动到空位置

                hasMove = true;

                let block = this.blocks[x][y];
                let position = this.positions[x-1][y];
                this.blocks[x-1][y] = block;
                this.blocks[x][y] = null;
                this.data[x-1][y] = this.data[x][y];
                this.data[x][y] = 0;

                this.shift(block,position,() =>{
                    move(x-1,y,callback);//递归
                })

            }else if(this.data[x][y] == this.data[x-1][y]) { //数值相同，则合并

                hasMove = true;

                let block = this.blocks[x][y];
                let position = this.positions[x-1][y];//shift还要用到
                this.data[x-1][y] *= 2;
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.blocks[x-1][y].getComponent("block").setNumber(this.data[x-1][y]);

                this.shift(block,position,() =>{
                    block.destroy();//递归结束
                    callback && callback();//afterMove
                })

            }else{ //数值不同，则递归结束
                callback && callback();
            }

        };

        let toMove = []; //非空的块可移动
        for(let i=0;i<Rows;i++){
            for(let j=0;j<Rows;j++){
                if(this.data[i][j] != 0 ){
                    toMove.push({x:i,y:j});
                }
            }
        }

        let count = 0;//用来计数，达到toMove.length则进入afterMove()
        for(let i=0;i<toMove.length;i++){ 
            move(toMove[i].x,toMove[i].y,()=>{
                count++;
                if(count == toMove.length) this.afterMove(hasMove);
            })
        }
    },

    afterMove(hasMove){
        console.log("move completed!");
        if(hasMove) {
            this.updateScore(this.score+1);
            this.addBlock();
        }
        if(this.checkFail()){
            console.log("GameOver!");
            this.gameover.active = true;
        }
    },

    checkFail(){
        for(let i=0;i<Rows;i++){
            for(let j=0;j<Rows;j++){
                if(this.data[i][j] == 0) return false;
                if(i>0 && this.data[i-1][j] == this.data[i][j]) return false;
                if(i<(Rows-1) && this.data[i+1][j] == this.data[i][j]) return false;
                if(j>0 && this.data[i][j-1] == this.data[i][j]) return false;
                if(j<(Rows-1) && this.data[i][j+1] == this.data[i][j]) return false;
            }
        }
        return true;
    },

    btnRestart(){
        console.log("restart");
        this.init();
    }

});

let mine = {};

/**
 * 开始游戏
 * @param mineZone 雷区容器id
 * @param x 长
 * @param y 宽
 * @param n 雷数
 */
mine.start = function (mineZone, x, y, n) {
    mine.info = {
        canPlay: false,// 是否可以玩了
        stratTime: 0,// 游戏开始时间
        stepNumber: 0,// 游戏步数
        x: x,// 雷区宽
        y: y,// 雷区长
        data: [],// 雷区，二维数组，元素数据结构参考dataModel
        mineNumber: 0,// 雷区雷数
        mineZone: document.getElementById(mineZone),// 雷区容器
        boxNumber: x * y,// 雷区格子数
        dataModel: {// 雷区数据结构
            isMine: false,// 是否为雷，true=是、false=不是
            aroundNumber: 0,// 周围雷数
            isOpen: false,// 是否已打开
            isFlag: false,// 插旗子状态
            $td: null// 绑定的dom
        }
    };
    mine.info.mineZone.oncontextmenu = function(){return false;};// 屏蔽右键
    // 清空
    for (let trs = mine.info.mineZone.childNodes,i = trs.length - 1; i >= 0; --i) {
        mine.info.mineZone.removeChild(trs[i]);
    }







    // 生成空雷区数据
    for (let x = 0; x < mine.info.x; ++x) {
        mine.info.data[x] = [];
        for (let y = 0; y < mine.info.y; ++ y) {
            mine.info.data[x][y] = {
                isMine: false,// 是否为雷，true=是、false=不是
                aroundNumber: 0,// 周围雷数
                isOpen: false// 是否已打开
            };
        }
    }

    // 随机生成雷，从0到(x * y)中取n个不重复的数字
    // temp_mine是雷坐标, 避免重复生成
    for (let temp_mine = {},temp; mine.info.mineNumber < n;) {
        temp = parseInt(mine.info.boxNumber * Math.random());// 先取一个随机数
        if (!temp_mine[temp]) {// 判断是否已取过这个随机数
            temp_mine[temp] = ++mine.info.mineNumber;// 这一步只是加个temp的属性，值是什么无所谓，顺便据给给雷数+1
            mine.info.data[parseInt(temp / mine.info.x)][temp % mine.info.y].isMine = true;// 标记为雷
        }
    }

    // 计算每个格子周围有几个雷
    // TODO 关于提前计算与点击时再计算哪个更好？
    for (let x = 0; x < mine.info.x; ++x) {
        for (let y = 0; y < mine.info.y; ++ y) {
            // 如果是雷就不用计算了
            if (mine.info.data[x][y].isMine)
                continue;
            // 不是雷的话取周围8个格子的坐标，边角的话就没有8个
            let z8 = mine.get8(x, y);
            // 遍历这8个格子
            for (let i = 0; i < z8.length; ++i) {
                if (mine.info.data[z8[i].x][z8[i].y].isMine)// 如果是雷
                    ++mine.info.data[x][y].aroundNumber;// 则周围雷数+1
            }
        }
    }

    // 根据雷区数据生成雷区dom
    for (let x = 0, $tr; x < mine.info.x; ++x) {
        $tr = document.createElement("tr");// 创建一个tr
        for (let y = 0, $td; y < mine.info.y; ++y) {// 创建指定数量的td
            $td = document.createElement("td");
            $td.setAttribute("x", x.toString());// x和y属性用于点击时快速获取当前点击的坐标
            $td.setAttribute("y", y.toString());
            $td.setAttribute("id", `mZ_${x}_${y}`);// 记上id，方便取dom
            $td.onmousedown = mine.handle;//
            mine.info.data[x][y].$td = $td;// 绑定dom
            $tr.appendChild($td);// 加到tr里面

        }
        mine.info.mineZone.appendChild($tr);// tr加到雷区里
    }

    // 初始化完毕
    mine.info.canPlay = true;
    mine.info.stratTime = new Date().getTime();// 记录开始时间
};

/**
 * 雷区格绑定的事件
 */
mine.handle = function (e) {
    if (!mine.info.canPlay)// 只有没结束的时候才能点击
        return;

    // 获取坐标
    let x = parseInt(this.getAttribute("x"));
    let y = parseInt(this.getAttribute("y"));


    // 判断左右键
    if (e.buttons === 1) {
        // 游戏步数+1,插旗子算不算？
        ++mine.info.stepNumber;

        // 左键按下，执行openBox方法
        mine.openBox(x, y);
    } else if (e.buttons === 2) {
        // 右键按下,插旗子


        // 获取数据
        let thisZone = mine.info.data[x][y];
        if (thisZone.isOpen) // 只能给未打开的格子插旗
            return;

        // 无论插旗子还是拔旗子，取反就对了
        thisZone.isFlag = !thisZone.isFlag;

        // 根据目前旗子的状态，操作dom
        if (thisZone.isFlag) {
            mine.setBoxState(thisZone, 2);
        } else {
            mine.setBoxState(thisZone, 0);
        }

    }
};




/**
 * 点开指定位置
 * @param x
 * @param y
 */
mine.openBox = function (x, y) {
    // 获取数据
    let thisZone = mine.info.data[x][y];
    if (thisZone.isOpen || thisZone.isFlag) // 这个格子已被打开或者插上旗子，直接返回，不做处理
        return;

    // 更改为打开状态
    thisZone.isOpen = true;
    mine.setBoxState(thisZone, 1);

    // 剩余格子数-1
    --mine.info.boxNumber;

    if (thisZone.isMine) {
        // 点到雷了
        mine.info.canPlay = false;// 游戏状态标记为结束
        // 当前格子状态改为雷(因为之前已设置为不是雷的打开状态)
        mine.setBoxState(thisZone, 3);

        // 打开所有的格子
        for (let x = 0, zoneTemp; x < mine.info.x; ++x) {
            for (let y = 0; y < mine.info.y; ++ y) {
                zoneTemp = mine.info.data[x][y];
                if (zoneTemp.isOpen) //已打开的跳过
                    continue;
                if (zoneTemp.isMine) {// 更新状态
                    mine.setBoxState(zoneTemp, 3);
                } else {
                    mine.setBoxState(zoneTemp, 1);
                }

            }
        }
    } else if (thisZone.aroundNumber === 0) {
        // 周围没有雷，把周围8个格子全部点开
        let z8 = mine.get8(x, y);
        for (let i = 0; i < z8.length; ++i) {
            mine.openBox(z8[i].x, z8[i].y);
        }
    }


    // 判断游戏结束
    if (mine.info.canPlay && mine.info.boxNumber === mine.info.mineNumber) {
        // 赢了
        mine.info.canPlay = false;
        // 打开剩下所有的格子，标记为对号
        for (let x = 0, zoneTemp; x < mine.info.x; ++x) {
            for (let y = 0; y < mine.info.y; ++ y) {
                zoneTemp = mine.info.data[x][y];
                if (zoneTemp.isOpen)// 已打开的跳过
                    continue;
                mine.setBoxState(zoneTemp, 4);
            }
        }
        alert(`累计${mine.info.stepNumber}步，共用时${(new Date().getTime() - mine.info.stratTime) / 1000}秒`);
    }

};

/**
 * 更新指定坐标格子的状态
 * @param thisZone
 * @param state 格子状态：0=未打开，1=打开，2=插旗，3=雷，4=对勾，
 */
mine.setBoxState = function (thisZone, state) {
    // 获取数据
    let $td = thisZone.$td;

    switch (state) {
        case 0 :
            $td.textContent = "";
            $td.className = "";
            break;
        case 1 :
            if (thisZone.aroundNumber !== 0)
                $td.textContent = thisZone.aroundNumber;
            else
                $td.textContent = "";
            $td.className = "open";
            break;
        case 2 :
            $td.textContent = "!";
            $td.className = "flag";
            break;
        case 3 :
            $td.textContent = "X";
            $td.className = "mine";
            break;
        case 4 :
            $td.textContent = "√";
            $td.className = "win";
            break;
    }
};




/**
 * 获取指定位置周围八个格子的坐标，不包含传入的格子
 * @param x
 * @param y
 */
mine.get8 = function (x, y) {
    // 计算周围8个方块的雷数
    // 坐标分别是
    // (xi-1,yi-1)  (xi,yi-1)   (xi+1,yi-1)
    // (xi-1,yi)    (xi,yi)     (xi+1,yi)
    // (xi-1,yi+1)  (xi,yi+1)   (xi+1,yi+1)
    let result = [];
    for (let xt = x-1; xt <= x + 1 ; ++xt) {
        if (xt < 0 || xt >= mine.info.x)
            continue;
        for (let yt = y-1; yt <= y + 1; ++yt) {
            if (yt < 0 || yt >= mine.info.y)
                continue;
            if (xt === x && yt === y)
                continue;
            result.push({x:xt,y:yt});
        }
    }
    return result;
};
import main from "../Main";
import { Server } from "../service/server/Server";
import { service } from "../service/Service";
import { formatParams } from "./CalcTool";
import ViewMenu from "./game/ViewMenu";


export enum EventProtocol {
    /** 自动收集事件 */
    ONREWARDRESULT = "onRewardResult"
}


export interface AccountChangeParams {
    credit?: formatParams,
    win?: formatParams,
    winTotal?: formatParams,
    fame?: formatParams
    level?: number,
    diamond?: number,
    cityId?: number
}

const CASH_TAG = "cashHandler";
export class GameProtocol {

    // // 服务器管理对象
    private _server: Server = null;


    constructor(server: Server) {
        this._server = server;

        server.setErrorCodeHandler(this.errorCodeHandler.bind(this))
        // 监听服务器协议推送事件
        // service.server.addProtocolListener("onRewardResult", this.onRewardResult.bind(this));        // 自动收集
        // service.server.addProtocolListener("onAutoCompleteOver", this.onAutoComplete.bind(this));    // 自动结算freespin或小游戏奖励
    }

    private errorCodeHandler(protocol: string, code: number): boolean {
        cc.warn(`【Server】, 收到服务器错误 ${code}`);
        service.analytics.logEvent("server_error_code", protocol, code.toString());

        switch (code) {
            case 302:
                break;
            default: {
                service.prompt.errorCodePrompt(code);
                return false;
            }
        }
    }
    /**
     * 开始充值
     * @param goodsId 
     * @param success 
     * @param error 
     */
    public startPay(goodsId: number, success?: Function, error?: Function) {
        this._server.safetyRequest(`connector.${CASH_TAG}.handler`, {
            title: "rechargeBegin",
            goodsId: goodsId
        }, success, error);
    }

    /**
     * 
     * @param orderId 自有订单号
     * @param receipt 苹果收据
     * @param billNO 苹果订单号
     * @param success 
     * @param error 
     */
    public finishApplePay(result: number, params: { orderId: string, receipt: string, billNo: string }, success?: Function, error?: Function) {
        cc.log("验证Apple订单，", JSON.stringify(params));

        let pa = {
            title: "rechargeResult",
            data: {
                payType: "apple",
                status: result
            }
        };
        if (result == 2) {
            for (let k in params) {
                pa.data[k] = params[k];
            }
        }
        this._server.safetyRequest(`connector.${CASH_TAG}.handler`, pa, success, error);
    }

    /**
     * 
     * @param result 支付结果 2:支付成功 3:支付失败
     * @param params 
     * @param success 
     * @param error 
     */
    public finishGooglePay(result: number, params: {
        orderId: string, packageName: string, productId: string,
        purchaseToken: string, billNo: string
    }, success?: Function, error?: Function) {
        let pa = {
            title: "rechargeResult",
            data: {
                payType: "google",
                status: result
            }
        };
        if (result == 2) {
            for (let k in params) {
                pa.data[k] = params[k];
            }
        }
        cc.log("验证google订单，", JSON.stringify(pa));
        this._server.safetyRequest(`connector.${CASH_TAG}.handler`, pa, success, error);
    }
    public onRewardResult(data: any) {
        // cc.log("自动收集",data);
        // Message.dispatchEvent(EventProtocol.ONREWARDRESULT,data);
    }

    /**
     * 进入主游戏
     * @编号 (2001)
     */
    public entry(successHandler: Function, failedHandler?: Function) {
        let route = `connector.${CASH_TAG}.entry`;

        if (!route) {
            cc.warn("【数据协议】进入路由配置不存在", route);
            return;
        }
        let complete = (data: any) => {
            cc.log('【数据协议】进入主游戏成功', data);
            successHandler(data);
        }

        this._server.request(route, null, complete, (code) => {
            cc.log(`${route} 错误`, code)
            failedHandler && failedHandler(code);
        });
    }


    /**
     * 读取服务器缓存数据
     * @param callback 
     * @编号 (2102)
     */
    public requestCashRead(params: any, callback: Function) {
        let complete = (result) => {
            cc.log(params.title, result);
            if (callback) callback(result);
        };
        this._server.request(`connector.${CASH_TAG}.read`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 获取店铺列表
     * @param callback 
     * @编号 (2102)
     */
    public requestStoreList(callback: Function) {
        let params = {
            title:"storeList"
        }
        let cachData = cc.sys.localStorage.getItem("storeList");
        if(!cachData){
            let _cachData = {};
            for (let i = 0; i < 10; i++) {
                let oneStore = {
                    id:i+1,
                    level:0,
                    rewardTime:0
                }
                let key = i+1;
                _cachData[`store_${i+1}`] = oneStore;
            }
            cachData = {storeList:_cachData};
            cc.sys.localStorage.setItem("storeList",JSON.stringify(cachData));
        }else{
            cachData = JSON.parse(cachData);
        }
        cc.log(params.title, cachData);
        if (callback) callback(cachData);
    }

    /**
     * 获取店员列表
     * @param callback 
     * @编号 (2102)
     */
    public requestClerkList(callback: Function) {
        let params = {
            title:"clerkList"
        }
        let cachData = cc.sys.localStorage.getItem("clerkList");
        if(!cachData){
            let _cachData = {};
            for (let i = 0; i < 12; i++) {
                let oneClerk = {
                    id:i+1,
                    level:0,
                }
                _cachData[`clerk_${i+1}`] = oneClerk;
            }
            cachData = {clerkList:_cachData};
            cc.sys.localStorage.setItem("clerkList",JSON.stringify(cachData));
        }else{
            cachData = JSON.parse(cachData);
        }
        cc.log(params.title, cachData);
        if (callback) callback(cachData);
    }

    /**
     * 获取声望列表
     * @param callback 
     * @编号 (2102)
     */
    public requestFameList(callback: Function) {
        let params = {
            title:"fameList"
        }
        let cachData = cc.sys.localStorage.getItem("fameList");
        if(!cachData){
            let _cachData = {};
            for (let i = 0; i < 11; i++) {
                let oneFame = {
                    id:i+1,
                    level:0,
                }
                _cachData[`fame_${i+1}`] = oneFame;
            }
            cachData = {fameList:_cachData};
            cc.sys.localStorage.setItem("fameList",JSON.stringify(cachData));
        }else{
            cachData = JSON.parse(cachData);
        }
        cc.log(params.title, cachData);
        if (callback) callback(cachData);
    }

    /**
     * 获取商品列表
     * @param callback 
     * @编号 (2102)
     */
    public requestGoodsList(callback: Function) {
        let params = {
            title:"goodsList"
        }
        let cachData = cc.sys.localStorage.getItem("goodsList");
        if(!cachData){
            let _cachData = {};
            for (let i = 0; i < 11; i++) {
                let oneFame = {
                    id:i+1,
                    level:0,
                }
                _cachData[`fame_${i+1}`] = oneFame;
            }
            cachData = {goodsList:_cachData};
            cc.sys.localStorage.setItem("goodsList",JSON.stringify(cachData));
        }else{
            cachData = JSON.parse(cachData);
        }
        cc.log(params.title, cachData);
        if (callback) callback(cachData);
    }

    /**
     * 获取商品列表
     * @param callback 
     * @编号 (2102)
     */
    public checkBuyRecord(goodsId, callback: Function) {
        let params = {
            title: "checkBuyRecord",
            goodsId: goodsId
        }
        let complete = (data) => {
            cc.log(params.title, data);
            if (callback) callback(data);
        };

        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 任务列表
     * @param callback 
     * @param goodsId 商品id
     */
    public requestTaskList(callback: Function) {
        let params = {
            title:"taskList"
        }
        let cachData = cc.sys.localStorage.getItem("taskList");
        if(!cachData){
            let _cachData = {};
            for (let i = 0; i < 11; i++) {
                let config = main.module.themeConfig.getTaskConfigByTag(`task_${i+1}`);
                let oneTask = {
                    id:i+1,
                    status:0,
                    taskValue:0,
                    taskTag:config.taskTag
                }
                _cachData[`task_${i+1}`] = oneTask;
            }
            cachData = {taskList:_cachData};
            cc.sys.localStorage.setItem("taskList",JSON.stringify(cachData));
        }else{
            cachData = JSON.parse(cachData);
        }
        cc.log(params.title, cachData);
        if (callback) callback(cachData);
    }

    /**
     * 获取背包列表
     * @param callback 
     * @编号 (2102)
     */
    public requestPropStorageList(callback: Function) {
        let params = {
            title:"propStorageList"
        }
        let cachData = cc.sys.localStorage.getItem("propStorageList");
        if(!cachData){
            let _cachData = {};
            for (let i = 0; i < 11; i++) {
                let oneProp = {
                    pid:i+1,
                    totalCount:0,
                    usedCount:0,
                }
                _cachData[`prop_${i+1}`] = oneProp;
            }
            cachData = {propStorageList:_cachData};
            cc.sys.localStorage.setItem("propStorageList",JSON.stringify(cachData));
        }else{
            cachData = JSON.parse(cachData);
        }
        cc.log(params.title, cachData);
        if (callback) callback(cachData);
    }

        /**
     * 每日任务领取
     * @param callback 
     * @编号 (2103)
     */
    public requestDayTaskReward(taskId: number, callback: Function) {
        let params = {
            title: "taskReward",
            taskId: taskId
        }

        let config = main.module.themeConfig.getTaskConfigByTag(`task_${taskId}`);
        if(config.rewardType == 2){
            let propStorageList = main.module.vm.propStorageList;
            let id = this.getRandomNum(1,11)
            let prop = propStorageList[`prop_${id}`];
            prop["totalCount"]+=1;
            let cachData = {propStorageList:main.module.vm.propStorageList};
            cc.sys.localStorage.setItem("propStorageList",JSON.stringify(cachData));
            callback && callback();
        }else{
            main.module.vm.diamond+=config.rewardValue;
            let d = cc.sys.localStorage.getItem("entryData");
            let parseData = JSON.parse(d);
            parseData["diamond"] = main.module.vm.diamond;
            cc.sys.localStorage.setItem("entryData",JSON.stringify(parseData));
            callback && callback();

        }
    }
    
    /**
     * 道具使用
     * @param callback 
     * @编号 (2103)
     */
    public requestUseProp(pid: number, callback: Function) {
        let params = {
            title: "useProp",
            pid: pid
        }
        let propStorageList = main.module.vm.propStorageList;
        let prop = propStorageList[`prop_${pid}`];
        prop["totalCount"]-=1;
        let cachData = {propStorageList:main.module.vm.propStorageList};
        cc.sys.localStorage.setItem("propStorageList",JSON.stringify(cachData));
        callback && callback();
    }

    /**
     * 使用过的道具加成数据
     * @param callback 
     * @编号 (2102)
     */
    public requestPropList(callback: Function) {
        let params = {
            title:"propList"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 获取排行榜
     * @param callback 
     * @编号 (2102)
     */
    public requestRankingList(callback: Function) {
        let params = {
            title:"rankingList"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 获取点赞信息
     * @param callback 
     * @编号 (2102)
     */
    public requestLikeInfo(callback: Function) {
        let params = {
            title:"likeInfo"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 获取商品加成信息
     * @param callback 
     * @编号 (2102)
     */
    public requestGoodsInfo(callback: Function) {
        let params = {
            title:"goodsData"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 获取npc配置信息
     * @param callback 
     * @编号 (2102)
     */
    public requestNpcConfig(callback: Function) {
        let params = {
            title:"npcConfig"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * npc 互动数据
     * @param callback 
     * @编号 (2102)
     */
    public requestNpcData(callback: Function) {
        let params = {
            title:"npcData"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 查询观看广告领取钻石次数
     * @param callback 
     * @编号 (2102)
     */
    public requestAdRechargeCount(callback: Function) {
        let params = {
            title:"adRechargeCount",
            goodsId:16
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 查询广告观看次数
     * @param callback 
     * @编号 (2102)
     */
    public requestAdvCount(callback: Function) {
        let params = {
            title:"taskData",
            taskId:31
        }
        this.requestCashRead(params, callback)
    }


    /**
     * 保存数据
     * @param callback 
     * @编号 (2101)
     */
    public requestCashWrite(title: string, data: any, callback: Function) {
        let complete = (data) => {
            cc.log(title, data);
            if (callback) callback(data);
        };
        this._server.request(`connector.${CASH_TAG}.write`,
            {
                title: title,
                data: data
            },
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

        /**
     * 写入广告观看次数
     * @param callback 
     * @编号 (2102)
     */
    public sendAdvCount(count:number,callback?: Function) {
        let complete = (data) => {
            cc.log("taskData", data);
            if (callback) callback(data);
        };
        this._server.request(`connector.${CASH_TAG}.write`,
            {
                title: "taskData",
                taskId:31,
                count:count
            },
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }


    /**
     * 改变店铺列表
     * @param callback 
     */
    public sendStoreList(data: any, callback: Function) {
        let cachData = {storeList:data};
        cc.sys.localStorage.setItem("storeList",JSON.stringify(cachData));
        callback && callback();
    }

    /**
     * 改变店员列表
     * @param callback 
     */
    public sendClerkList(data: any, callback: Function) {
        let cachData = {clerkList:data};
        cc.sys.localStorage.setItem("clerkList",JSON.stringify(cachData));
        callback && callback();
    }

    /**
     * 改变声望表
     * @param callback 
     */
    public sendFameList(data: any, callback: Function) {
        let cachData = {fameList:data};
        cc.sys.localStorage.setItem("fameList",JSON.stringify(cachData));
        callback && callback();
    }

    /**
     * 改变任务列表
     * @param callback 
     */
    public sendTaskList(data: any, callback: Function) {
        let cachData = {taskList:data};
        if (!main.module.calcUiShow.checkTaskListChange(main.module.vm.taskList, data)) {
            callback && callback(data);
            return;
        }
        cc.sys.localStorage.setItem("taskList",JSON.stringify(cachData));
        callback && callback(data);
    }

    /**
     * handler
     * @param callback 
     * @编号 (2103)
     */
    public requestAccountChange(accountInfo: AccountChangeParams, callback: Function) {
        let params = {
            title: "accountChange",
        }
        let complete = (data) => {
            cc.log(params.title, data);
            if (callback) callback(data);
        };

        let cachData = cc.sys.localStorage.getItem("entryData");
        cachData = JSON.parse(cachData);
        if (accountInfo.credit) {
            cachData["credit"] = accountInfo.credit.num;
            cachData["creditE"] = accountInfo.credit.numE;
        }
        if (accountInfo.win) {
            cachData["win"] = accountInfo.win.num;
            cachData["winE"] = accountInfo.win.numE;
        }
        if (accountInfo.winTotal) {
            cachData["winTotal"] = accountInfo.winTotal.num;
            cachData["winTotalE"] = accountInfo.winTotal.numE;
        }
        if (accountInfo.fame) {
            cachData["fame"] = accountInfo.fame.num;
            cachData["fameE"] = accountInfo.fame.numE;
        }
        if (accountInfo.level) {
            cachData["level"] = accountInfo.level;
        }
        cc.sys.localStorage.setItem("entryData", JSON.stringify(cachData));
        complete(cachData);
    }


    /**
     * 点赞操作
     * @param callback 
     * @编号 (2102)
     */
    public requestClickLike(uid, index, callback: Function) {
        let params = {
            title: "like",
            uid: uid,
            index: index//点赞名次
        }
        let complete = (result) => {
            cc.log(params.title, result);
            if (callback) callback(result);
        };

        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * handler
     * @param callback 
     * @编号 (2103)
     */
    public requestDiamondInfo(goodsId: number, callback: Function) {
        let params = {
            title: "goodsBuy",
            goodsId: goodsId
        }
        let complete = (result) => {
            cc.log(params.title, result);
            if (callback) callback(result);
        };

        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 钻石扣减
     * @param callback 
     * @编号 (2103)
     */
    public requestDiamondChange(cost: number, callback: Function) {
        let params = {
            title: "doCost",
            cost: cost
        }
        let complete = (data) => {
            cc.log(params.title, data);
            if (callback) callback(data);
        };

        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 观看广告领取钻石
     * @param callback 
     * @编号 (2103)
     */
    public rechargeBegin(callback: Function) {
        let params = {
            title: "rechargeBegin",
            goodsId:16    
        }
        let complete = (data) => {
            cc.log(`rechargeBegin`,data);
            if (callback) callback(data);
        };
        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

     /** 获取begin到length的随机数 整数 */
    public getRandomNum = function (begin: number, length: number) {
        return Math.round(Math.random() * (length - begin) + begin);
    };

    /**
     * 主线任务领取
     * @param callback 
     * @编号 (2103)
     */
    public requestMainTaskReward(callback: Function) {
        let params = {
            title: "levelReward",
        }
        let complete = (data) => {
            cc.log(params.title, data);
            if (callback) callback(data);
        };

        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * npc 领奖
     * @param callback 
     * @编号 (2102)
     */
    public requestNpcReward(npcId: number, index: number, isWatch:boolean, callback: Function, adId?: number,) {
        let params = {
            title: "npcReward",
            npcId: npcId,
            index: index,
            isWatch:isWatch
        }
        let complete = (data) => {
            cc.log(params.title, data);
            if (callback) callback(data);
        };

        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 请求头像
     * @param callback 
     * @编号 (2103)
     */
    public requestHead(uid: number, callback: Function) {
        let params = {
            title: "userIcon",
            uid: uid
        }
        let complete = (result) => {
            cc.log(params.title, result);
            if (callback) callback(result);
        };

        this._server.request(`connector.${CASH_TAG}.read`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 换头像
     * @param callback 
     * @编号 (2103)
     */
    public sendHead(icon: number, callback: Function) {
        let params = {
            title: "userIcon",
            icon: icon
        }
        let complete = (result) => {
            cc.log(params.title);
            if (callback) callback(result);
        };

        this._server.request(`connector.${CASH_TAG}.write`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 换昵称
     * @param callback 
     * @编号 (2103)
     */
    public sendNickName(nickName: string, callback: Function) {
        let params = {
            title: "nickName",
            nickName: nickName
        }
        let complete = (result) => {
            cc.log(params.title);
            if (callback) callback(result);
        };

        this._server.request(`connector.${CASH_TAG}.write`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 写入缓存数据
     * @param callback 
     * @编号 (2103)
     */
    public writeCacheData(configName: string, configValue: object, callback: Function) {
        let params = {
            title: "clientConfig",
            configName: configName,
            configValue: configValue
        }
        let complete = (result) => {
            cc.log(params.title);
            if (callback) callback(result);
        };

        this._server.request(`connector.${CASH_TAG}.write`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }


}
